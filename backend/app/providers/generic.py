import re
import json
from urllib.parse import urlparse, parse_qs
from typing import Optional, Dict, Any
from datetime import datetime
from backend.app.providers.base import PaymentProviderParser, TransactionDraft

class GenericQRParser(PaymentProviderParser):
    @property
    def provider_code(self) -> str:
        return "GENERIC"

    @property
    def provider_display_name(self) -> str:
        return "Generic QR / Other Provider"

    def detect(self, payload: str) -> bool:
        # Fallback detector, always returns True if payload is valid string
        return self.validate(payload)

    def parse(self, payload: str) -> TransactionDraft:
        clean_payload = payload.strip()
        metadata: Dict[str, Any] = {}
        
        provider_name = "Generic Payment"
        reference_number = None
        payer_name = None
        payer_account = None
        receiver_name = None
        receiver_account = None
        amount = None
        payment_date = None
        payment_time = None
        verification_url = None
        qr_status = "QR_DECODED"
        
        # Check other known Ethiopian banks in text
        p_lower = clean_payload.lower()
        if "awash" in p_lower:
            provider_name = "Awash Bank"
        elif "bank of abyssinia" in p_lower or "boa" in p_lower:
            provider_name = "Bank of Abyssinia"
        elif "dashen" in p_lower:
            provider_name = "Dashen Bank"
        elif "zemen" in p_lower:
            provider_name = "Zemen Bank"
        elif "hibret" in p_lower or "united bank" in p_lower:
            provider_name = "Hibret Bank"
        elif "coop" in p_lower or "cooperative bank of oromia" in p_lower:
            provider_name = "Cooperative Bank of Oromia"
        elif "enat" in p_lower:
            provider_name = "Enat Bank"
        elif "amhara" in p_lower:
            provider_name = "Amhara Bank"

        # Check URL
        if clean_payload.startswith("http://") or clean_payload.startswith("https://"):
            verification_url = clean_payload
            qr_status = "VERIFICATION_PAGE_AVAILABLE"
            try:
                parsed_url = urlparse(clean_payload)
                domain = parsed_url.netloc
                provider_name = f"Web Receipt ({domain})"
                qs = parse_qs(parsed_url.query)
                metadata["url_query"] = qs
                
                for k, v in qs.items():
                    k_l = k.lower()
                    val = v[0] if v else ""
                    if k_l in ["ref", "id", "txnid", "invoice", "trans_id", "code"]:
                        reference_number = val
                    elif k_l in ["amt", "amount", "total"]:
                        try:
                            amount = float(re.sub(r"[^\d.]", "", val))
                        except Exception:
                            pass
                    elif k_l in ["date", "dt"]:
                        payment_date = val
                    elif k_l in ["time", "tm"]:
                        payment_time = val
            except Exception as e:
                metadata["url_error"] = str(e)

        # Check JSON
        elif clean_payload.startswith("{") and clean_payload.endswith("}"):
            try:
                data = json.loads(clean_payload)
                if isinstance(data, dict):
                    metadata = data
                    provider_name = data.get("provider") or data.get("bank") or provider_name
                    reference_number = str(data.get("reference_number") or data.get("reference") or data.get("txn_id") or data.get("id") or data.get("invoice") or "") or None
                    payer_name = data.get("payer") or data.get("payer_name")
                    payer_account = data.get("payer_account")
                    receiver_name = data.get("receiver") or data.get("receiver_name") or data.get("merchant")
                    receiver_account = data.get("receiver_account")
                    
                    amt_val = data.get("amount") or data.get("total")
                    if amt_val is not None:
                        try:
                            amount = float(re.sub(r"[^\d.]", "", str(amt_val)))
                        except Exception:
                            pass
                            
                    payment_date = str(data.get("payment_date") or data.get("date") or "") or None
                    payment_time = str(data.get("payment_time") or data.get("time") or "") or None
                    verification_url = data.get("verification_url") or data.get("url")
            except Exception as e:
                metadata["json_error"] = str(e)

        # Check Plain Text
        if not reference_number or amount is None:
            lines = clean_payload.split("\n")
            for line in lines:
                line_str = line.strip()
                if not line_str:
                    continue
                match = re.match(r"^([^:=]+)[:=]\s*(.+)$", line_str, re.IGNORECASE)
                if match:
                    key = match.group(1).strip().lower()
                    val = match.group(2).strip()
                    metadata[key] = val
                    
                    if "reference" in key or "transaction id" in key or "invoice" in key:
                        reference_number = re.sub(r"[^\w\-]", "", val)
                    elif "amount" in key or "total" in key:
                        amt_match = re.search(r"([\d,]+(?:\.\d+)?)", val)
                        if amt_match:
                            try:
                                amount = float(amt_match.group(1).replace(",", ""))
                            except Exception:
                                pass
                    elif "payer" in key:
                        payer_name = val
                    elif "receiver" in key:
                        receiver_name = val
                    elif "date" in key:
                        payment_date = val
                    elif "time" in key:
                        payment_time = val

        # Regex fallback for reference and amount
        if not reference_number:
            ref_m = re.search(r"(?:REF|TRX|TXN|FT|INV)[A-Z0-9]{5,20}", clean_payload, re.IGNORECASE)
            if ref_m:
                reference_number = ref_m.group(0).upper()

        if amount is None:
            amt_m = re.search(r"(\d+(?:\.\d{2})?)\s*(?:ETB|Birr|ብር|\$)", clean_payload, re.IGNORECASE)
            if amt_m:
                try:
                    amount = float(amt_m.group(1))
                except Exception:
                    pass

        # Date normalization
        formatted_date = None
        if payment_date:
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y", "%b %d, %Y", "%Y%m%d"):
                try:
                    dt = datetime.strptime(payment_date.strip(), fmt)
                    formatted_date = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
            if not formatted_date:
                formatted_date = payment_date

        payer_account_masked = (payer_account[:4] + "****" + payer_account[-3:]) if (payer_account and len(payer_account) >= 8) else payer_account
        receiver_account_masked = (receiver_account[:4] + "****" + receiver_account[-3:]) if (receiver_account and len(receiver_account) >= 8) else receiver_account

        if reference_number or amount is not None:
            if qr_status != "VERIFICATION_PAGE_AVAILABLE":
                qr_status = "DATA_EXTRACTED"

        missing_warnings = []
        if not reference_number:
            missing_warnings.append("Reference number could not be extracted.")
        if amount is None:
            missing_warnings.append("Amount could not be extracted.")
        if not payment_date:
            missing_warnings.append("Payment date could not be extracted.")

        warning_str = " ".join(missing_warnings) if missing_warnings else None

        return TransactionDraft(
            provider="GENERIC",
            provider_display_name=provider_name,
            reference_number=reference_number,
            transaction_number=reference_number,
            invoice_number=reference_number,
            payer_name=payer_name,
            payer_account_masked=payer_account_masked,
            receiver_name=receiver_name,
            receiver_account_masked=receiver_account_masked,
            payment_type="QR Payment",
            payment_method="Digital Payment",
            payment_channel="QR Code",
            amount=amount,
            service_charge=0.0,
            vat=0.0,
            total_debited=amount,
            currency="ETB",
            payment_date=formatted_date,
            payment_time=payment_time,
            qr_payload=clean_payload,
            verification_url=verification_url,
            qr_status=qr_status,
            raw_metadata=metadata,
            missing_fields_warning=warning_str
        )
