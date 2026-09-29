import re
import json
from urllib.parse import urlparse, parse_qs
from typing import Optional, Dict, Any
from datetime import datetime
from backend.app.providers.base import PaymentProviderParser, TransactionDraft

class TelebirrParser(PaymentProviderParser):
    @property
    def provider_code(self) -> str:
        return "TELEBIRR"

    @property
    def provider_display_name(self) -> str:
        return "Telebirr"

    def detect(self, payload: str) -> bool:
        if not self.validate(payload):
            return False
        
        p_lower = payload.lower()
        if "telebirr" in p_lower or "ethiotelecom" in p_lower:
            return True
        
        # Check URL domain
        if payload.startswith("http://") or payload.startswith("https://"):
            try:
                domain = urlparse(payload).netloc.lower()
                if "telebirr" in domain or "ethiotelecom" in domain:
                    return True
            except Exception:
                pass
                
        # Check Telebirr specific keywords
        if "invoice number" in p_lower and "settled amount" in p_lower:
            return True
        if "payment mode" in p_lower and "telebirr account" in p_lower:
            return True

        # Check JSON payload
        try:
            data = json.loads(payload)
            if isinstance(data, dict):
                if data.get("provider", "").lower() in ["telebirr", "tele birr"]:
                    return True
                if "invoice_no" in data and ("settled_amount" in data or "telebirr" in str(data).lower()):
                    return True
        except Exception:
            pass

        return False

    def parse(self, payload: str) -> TransactionDraft:
        clean_payload = payload.strip()
        metadata: Dict[str, Any] = {}
        
        reference_number = None
        invoice_number = None
        payer_name = None
        payer_account = None
        receiver_name = None
        receiver_account = None
        amount = None
        payment_type = "Merchant Payment"
        payment_method = "Telebirr Wallet"
        payment_channel = "QR Scan"
        payment_date = None
        payment_time = None
        verification_url = None
        qr_status = "QR_DECODED"
        
        # Check if URL
        if clean_payload.startswith("http://") or clean_payload.startswith("https://"):
            verification_url = clean_payload
            qr_status = "VERIFICATION_PAGE_AVAILABLE"
            try:
                parsed_url = urlparse(clean_payload)
                qs = parse_qs(parsed_url.query)
                metadata["url_query"] = qs
                
                # Extract query parameters if available
                for k, v in qs.items():
                    k_lower = k.lower()
                    val = v[0] if v else ""
                    if k_lower in ["invoice", "invoiceno", "inv", "trx", "transid", "ref", "receiptno"]:
                        invoice_number = val
                        reference_number = val
                    elif k_lower in ["amt", "amount", "settledamount"]:
                        try:
                            amount = float(re.sub(r"[^\d.]", "", val))
                        except Exception:
                            pass
                    elif k_lower in ["date", "dt"]:
                        payment_date = val
                    elif k_lower in ["time", "tm"]:
                        payment_time = val
                    elif k_lower in ["payer", "from"]:
                        payer_name = val
                    elif k_lower in ["receiver", "to", "merchant"]:
                        receiver_name = val
            except Exception as e:
                metadata["url_parse_error"] = str(e)

        # Check if JSON
        elif clean_payload.startswith("{") and clean_payload.endswith("}"):
            try:
                data = json.loads(clean_payload)
                if isinstance(data, dict):
                    metadata = data
                    invoice_number = str(data.get("invoice_no") or data.get("invoice_number") or data.get("invoice") or data.get("reference") or data.get("trans_id") or "") or None
                    reference_number = invoice_number
                    payer_name = data.get("payer") or data.get("payer_name")
                    payer_account = data.get("payer_account") or data.get("telebirr_account")
                    receiver_name = data.get("receiver") or data.get("receiver_name") or data.get("merchant_name")
                    receiver_account = data.get("receiver_account")
                    
                    amt_val = data.get("settled_amount") or data.get("amount") or data.get("total")
                    if amt_val is not None:
                        try:
                            amount = float(re.sub(r"[^\d.]", "", str(amt_val)))
                        except Exception:
                            pass
                            
                    payment_date = str(data.get("payment_date") or data.get("date") or "") or None
                    payment_time = str(data.get("payment_time") or data.get("time") or "") or None
                    payment_channel = data.get("payment_channel") or data.get("channel") or payment_channel
                    payment_mode = data.get("payment_mode") or data.get("mode")
                    if payment_mode:
                        payment_method = payment_mode
                    verification_url = data.get("verification_url") or data.get("receipt_url")
            except Exception as e:
                metadata["json_error"] = str(e)

        # Parse plain-text receipt line by line
        if not invoice_number or amount is None:
            lines = clean_payload.split("\n")
            for line in lines:
                line_str = line.strip()
                if not line_str:
                    continue
                
                # Match Key: Value or Key - Value
                match = re.match(r"^([^:=]+)[:=]\s*(.+)$", line_str, re.IGNORECASE)
                if match:
                    key = match.group(1).strip().lower()
                    val = match.group(2).strip()
                    metadata[key] = val
                    
                    if "invoice" in key or "transaction" in key or "trans no" in key or "ref" in key:
                        inv = re.sub(r"[^\w\-]", "", val)
                        if inv:
                            invoice_number = inv
                            reference_number = inv
                    elif "payer account" in key or "telebirr account" in key or "customer phone" in key:
                        payer_account = val
                    elif "payer" in key or "customer" in key:
                        payer_name = val
                    elif "receiver account" in key or "merchant phone" in key:
                        receiver_account = val
                    elif "receiver" in key or "merchant" in key:
                        receiver_name = val
                    elif "settled amount" in key or "amount" in key or "total" in key:
                        amt_match = re.search(r"([\d,]+(?:\.\d+)?)", val)
                        if amt_match:
                            try:
                                amount = float(amt_match.group(1).replace(",", ""))
                            except Exception:
                                pass
                    elif "payment date" in key or "date" in key:
                        payment_date = val
                    elif "payment time" in key or "time" in key:
                        payment_time = val
                    elif "payment mode" in key or "mode" in key:
                        payment_method = val
                    elif "payment channel" in key or "channel" in key:
                        payment_channel = val
                    elif "verification" in key or "url" in key or "link" in key:
                        if val.startswith("http"):
                            verification_url = val
                            qr_status = "VERIFICATION_PAGE_AVAILABLE"

        # Look for standalone patterns if still missing
        if not reference_number:
            ref_match = re.search(r"(?:TRX|INVC|TB|TLB)[\w\d]{4,20}", clean_payload, re.IGNORECASE)
            if ref_match:
                reference_number = ref_match.group(0)
                invoice_number = reference_number

        if amount is None:
            amt_match = re.search(r"(\d+(?:\.\d{2})?)\s*(?:ETB|Birr|ብር)", clean_payload, re.IGNORECASE)
            if amt_match:
                try:
                    amount = float(amt_match.group(1))
                except Exception:
                    pass

        # Parse and format date if present
        formatted_date = None
        if payment_date:
            try:
                # Try multiple date formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD Mon YYYY
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y", "%Y%m%d"):
                    try:
                        dt = datetime.strptime(payment_date.strip(), fmt)
                        formatted_date = dt.strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        continue
            except Exception:
                pass
            if not formatted_date:
                formatted_date = payment_date  # keep original string representation

        # Mask accounts if full phone number provided (e.g. +251911234567 -> +25191****567)
        if payer_account and len(payer_account) >= 8:
            payer_account_masked = payer_account[:6] + "****" + payer_account[-3:]
        else:
            payer_account_masked = payer_account

        if receiver_account and len(receiver_account) >= 8:
            receiver_account_masked = receiver_account[:6] + "****" + receiver_account[-3:]
        else:
            receiver_account_masked = receiver_account

        if reference_number or amount is not None:
            if qr_status != "VERIFICATION_PAGE_AVAILABLE":
                qr_status = "DATA_EXTRACTED"

        missing_warnings = []
        if not reference_number:
            missing_warnings.append("Reference/Invoice number could not be extracted.")
        if amount is None:
            missing_warnings.append("Amount could not be extracted.")
        if not payment_date:
            missing_warnings.append("Payment date could not be extracted.")

        warning_str = " ".join(missing_warnings) if missing_warnings else None

        return TransactionDraft(
            provider=self.provider_code,
            provider_display_name=self.provider_display_name,
            reference_number=reference_number,
            transaction_number=invoice_number,
            invoice_number=invoice_number,
            payer_name=payer_name,
            payer_account_masked=payer_account_masked,
            receiver_name=receiver_name,
            receiver_account_masked=receiver_account_masked,
            payment_type=payment_type,
            payment_method=payment_method,
            payment_channel=payment_channel,
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
