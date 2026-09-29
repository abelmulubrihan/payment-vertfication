import re
import json
from urllib.parse import urlparse, parse_qs
from typing import Optional, Dict, Any
from datetime import datetime
from backend.app.providers.base import PaymentProviderParser, TransactionDraft

class CBEParser(PaymentProviderParser):
    @property
    def provider_code(self) -> str:
        return "CBE"

    @property
    def provider_display_name(self) -> str:
        return "Commercial Bank of Ethiopia (CBE)"

    def detect(self, payload: str) -> bool:
        if not self.validate(payload):
            return False
        
        p_lower = payload.lower()
        if "cbe" in p_lower or "commercial bank of ethiopia" in p_lower or "cbebirr" in p_lower:
            return True

        # Check URL domain
        if payload.startswith("http://") or payload.startswith("https://"):
            try:
                domain = urlparse(payload).netloc.lower()
                if "cbe.com.et" in domain or "cbebirr" in domain:
                    return True
            except Exception:
                pass

        # Check standard CBE reference prefix: FT followed by 10-14 alphanumeric chars
        if re.search(r"\bFT\d{5,12}[A-Z0-9]{1,6}\b", payload, re.IGNORECASE):
            return True

        # Check CBE specific fields
        if "transferred amount" in p_lower or "total amount debited" in p_lower or "reason/type of service" in p_lower:
            return True

        # Check JSON
        try:
            data = json.loads(payload)
            if isinstance(data, dict):
                if data.get("provider", "").upper() in ["CBE", "CBEBIRR", "CBE_BIRR"]:
                    return True
                if str(data.get("reference_number", "")).startswith("FT"):
                    return True
        except Exception:
            pass

        return False

    def parse(self, payload: str) -> TransactionDraft:
        clean_payload = payload.strip()
        metadata: Dict[str, Any] = {}
        
        reference_number = None
        payer_name = None
        payer_account = None
        receiver_name = None
        receiver_account = None
        payment_type = "Transfer / Payment"
        payment_method = "CBE Mobile / Birr"
        payment_channel = "CBE App"
        
        transferred_amount = None
        service_charge = 0.0
        vat = 0.0
        total_debited = None
        
        payment_date = None
        payment_time = None
        verification_url = None
        qr_status = "QR_DECODED"
        reason = None

        # 1. URL Check
        if clean_payload.startswith("http://") or clean_payload.startswith("https://"):
            verification_url = clean_payload
            qr_status = "VERIFICATION_PAGE_AVAILABLE"
            try:
                parsed_url = urlparse(clean_payload)
                qs = parse_qs(parsed_url.query)
                metadata["url_query"] = qs
                
                for k, v in qs.items():
                    k_lower = k.lower()
                    val = v[0] if v else ""
                    if k_lower in ["ref", "referenceno", "reference_number", "ft", "txnid", "id"]:
                        reference_number = val
                    elif k_lower in ["amt", "amount", "transferred_amount"]:
                        try:
                            transferred_amount = float(re.sub(r"[^\d.]", "", val))
                        except Exception:
                            pass
                    elif k_lower in ["date", "dt"]:
                        payment_date = val
                    elif k_lower in ["time", "tm"]:
                        payment_time = val
                    elif k_lower in ["payer", "from"]:
                        payer_name = val
                    elif k_lower in ["receiver", "to"]:
                        receiver_name = val
            except Exception as e:
                metadata["url_parse_error"] = str(e)

        # 2. JSON Check
        elif clean_payload.startswith("{") and clean_payload.endswith("}"):
            try:
                data = json.loads(clean_payload)
                if isinstance(data, dict):
                    metadata = data
                    reference_number = str(data.get("reference_number") or data.get("ref") or data.get("reference") or data.get("transaction_id") or "") or None
                    payer_name = data.get("payer") or data.get("payer_name")
                    payer_account = data.get("payer_account")
                    receiver_name = data.get("receiver") or data.get("receiver_name")
                    receiver_account = data.get("receiver_account")
                    payment_type = data.get("payment_type") or payment_type
                    reason = data.get("reason") or data.get("type_of_service")
                    
                    amt_val = data.get("transferred_amount") or data.get("amount")
                    if amt_val is not None:
                        try:
                            transferred_amount = float(re.sub(r"[^\d.]", "", str(amt_val)))
                        except Exception:
                            pass
                    
                    sc_val = data.get("service_charge")
                    if sc_val is not None:
                        try:
                            service_charge = float(re.sub(r"[^\d.]", "", str(sc_val)))
                        except Exception:
                            pass
                            
                    vat_val = data.get("vat")
                    if vat_val is not None:
                        try:
                            vat = float(re.sub(r"[^\d.]", "", str(vat_val)))
                        except Exception:
                            pass
                            
                    tot_val = data.get("total_debited") or data.get("total_amount_debited")
                    if tot_val is not None:
                        try:
                            total_debited = float(re.sub(r"[^\d.]", "", str(tot_val)))
                        except Exception:
                            pass
                            
                    payment_date = str(data.get("payment_date") or data.get("date") or "") or None
                    payment_time = str(data.get("payment_time") or data.get("time") or "") or None
                    verification_url = data.get("verification_url") or data.get("receipt_url")
            except Exception as e:
                metadata["json_error"] = str(e)

        # 3. Plain Text / Receipt Format Check
        if not reference_number or transferred_amount is None:
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
                    
                    if "reference" in key or "ref no" in key or "ft no" in key:
                        ref_found = re.sub(r"[^\w\-]", "", val)
                        if ref_found:
                            reference_number = ref_found
                    elif "payer account" in key or "from account" in key:
                        payer_account = val
                    elif "payer" in key or "debited from" in key:
                        payer_name = val
                    elif "receiver account" in key or "to account" in key:
                        receiver_account = val
                    elif "receiver" in key or "credited to" in key or "beneficiary" in key:
                        receiver_name = val
                    elif "transferred amount" in key or "transfer amount" in key:
                        amt_match = re.search(r"([\d,]+(?:\.\d+)?)", val)
                        if amt_match:
                            try:
                                transferred_amount = float(amt_match.group(1).replace(",", ""))
                            except Exception:
                                pass
                    elif "service charge" in key or "fee" in key:
                        sc_match = re.search(r"([\d,]+(?:\.\d+)?)", val)
                        if sc_match:
                            try:
                                service_charge = float(sc_match.group(1).replace(",", ""))
                            except Exception:
                                pass
                    elif "vat" in key:
                        vat_match = re.search(r"([\d,]+(?:\.\d+)?)", val)
                        if vat_match:
                            try:
                                vat = float(vat_match.group(1).replace(",", ""))
                            except Exception:
                                pass
                    elif "total amount debited" in key or "total debited" in key or ("amount" in key and transferred_amount is None):
                        amt_match = re.search(r"([\d,]+(?:\.\d+)?)", val)
                        if amt_match:
                            try:
                                total_debited = float(amt_match.group(1).replace(",", ""))
                                if transferred_amount is None:
                                    transferred_amount = total_debited
                            except Exception:
                                pass
                    elif "reason" in key or "type of service" in key:
                        reason = val
                    elif "payment type" in key:
                        payment_type = val
                    elif "payment date" in key or "date" in key:
                        # Sometimes date and time are combined: "28 Sep 2026 1:19 PM"
                        parts = val.split(" ")
                        if len(parts) >= 4:
                            payment_date = " ".join(parts[:3])
                            payment_time = " ".join(parts[3:])
                        else:
                            payment_date = val
                    elif "payment time" in key or "time" in key:
                        payment_time = val
                    elif "verification" in key or "url" in key:
                        if val.startswith("http"):
                            verification_url = val
                            qr_status = "VERIFICATION_PAGE_AVAILABLE"

        # Look for FT reference number pattern anywhere in payload if not found
        if not reference_number:
            ft_match = re.search(r"\bFT[A-Z0-9]{8,16}\b", clean_payload, re.IGNORECASE)
            if ft_match:
                reference_number = ft_match.group(0).upper()

        # Look for amounts if not found
        if transferred_amount is None:
            amt_match = re.search(r"(\d+(?:\.\d{2})?)\s*(?:ETB|Birr|ብር)", clean_payload, re.IGNORECASE)
            if amt_match:
                try:
                    transferred_amount = float(amt_match.group(1))
                except Exception:
                    pass

        # Calculate total debited if not explicitly set
        if total_debited is None and transferred_amount is not None:
            total_debited = round(transferred_amount + service_charge + vat, 2)

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

        # Account masking
        if payer_account and len(payer_account) >= 8:
            payer_account_masked = payer_account[:4] + "****" + payer_account[-3:]
        else:
            payer_account_masked = payer_account

        if receiver_account and len(receiver_account) >= 8:
            receiver_account_masked = receiver_account[:4] + "****" + receiver_account[-3:]
        else:
            receiver_account_masked = receiver_account

        if reference_number or transferred_amount is not None:
            if qr_status != "VERIFICATION_PAGE_AVAILABLE":
                qr_status = "DATA_EXTRACTED"

        missing_warnings = []
        if not reference_number:
            missing_warnings.append("CBE Reference Number (FT...) could not be extracted.")
        if transferred_amount is None:
            missing_warnings.append("Transferred amount could not be extracted.")
        if not payment_date:
            missing_warnings.append("Payment date could not be extracted.")

        warning_str = " ".join(missing_warnings) if missing_warnings else None

        return TransactionDraft(
            provider=self.provider_code,
            provider_display_name=self.provider_display_name,
            reference_number=reference_number,
            transaction_number=reference_number,
            invoice_number=None,
            payer_name=payer_name,
            payer_account_masked=payer_account_masked,
            receiver_name=receiver_name,
            receiver_account_masked=receiver_account_masked,
            payment_type=payment_type,
            payment_method=payment_method,
            payment_channel=payment_channel,
            amount=transferred_amount,
            service_charge=service_charge,
            vat=vat,
            total_debited=total_debited,
            currency="ETB",
            payment_date=formatted_date,
            payment_time=payment_time,
            qr_payload=clean_payload,
            verification_url=verification_url,
            qr_status=qr_status,
            raw_metadata=metadata,
            missing_fields_warning=warning_str
        )
