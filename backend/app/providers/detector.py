import ipaddress
import socket
from urllib.parse import urlparse
from typing import List, Optional
from backend.app.providers.base import PaymentProviderParser, TransactionDraft
from backend.app.providers.telebirr import TelebirrParser
from backend.app.providers.cbe import CBEParser
from backend.app.providers.generic import GenericQRParser
from backend.app.database.config import settings

class ProviderDetector:
    """
    Detector registry to identify and execute the appropriate provider parser.
    Ensures security validations (payload size, URL schemes, SSRF protection).
    """

    def __init__(self):
        # Ordered list of parsers (specific first, fallback last)
        self.parsers: List[PaymentProviderParser] = [
            TelebirrParser(),
            CBEParser(),
            GenericQRParser()
        ]

    def register_parser(self, parser: PaymentProviderParser):
        """Allows dynamic registration of new provider adapters"""
        self.parsers.insert(0, parser)

    @staticmethod
    def is_safe_url(url_str: str) -> bool:
        """
        Validates URL scheme and protects against SSRF (private / loopback IPs).
        """
        try:
            parsed = urlparse(url_str)
            if parsed.scheme.lower() not in ["http", "https"]:
                return False
            
            hostname = parsed.hostname
            if not hostname:
                return False
            
            # Reject localhost and local domains
            if hostname.lower() in ["localhost", "127.0.0.1", "0.0.0.0", "::1"]:
                return False
            
            # Check for direct IP inputs
            try:
                ip = ipaddress.ip_address(hostname)
                if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                    return False
            except ValueError:
                # Hostname is a domain name
                pass
            
            return True
        except Exception:
            return False

    def decode_and_parse(self, payload: str) -> TransactionDraft:
        """
        Main entry point for QR payload processing.
        1. Validate payload length.
        2. Clean & sanitize.
        3. Iterate through registered provider parsers.
        4. Return parsed TransactionDraft.
        """
        if not payload or not isinstance(payload, str):
            raise ValueError("Invalid QR payload: Empty or non-string input.")

        if len(payload) > settings.MAX_QR_PAYLOAD_BYTES:
            raise ValueError(f"QR payload size ({len(payload)} bytes) exceeds max limit of {settings.MAX_QR_PAYLOAD_BYTES} bytes.")

        clean_payload = payload.strip()

        # Find matching parser
        for parser in self.parsers:
            if parser.detect(clean_payload):
                draft = parser.parse(clean_payload)
                
                # Check URL safety if verification URL is present
                if draft.verification_url:
                    if not self.is_safe_url(draft.verification_url):
                        draft.verification_url = None
                        draft.missing_fields_warning = (
                            (draft.missing_fields_warning or "") + " Warning: Verification URL was blocked by security filter."
                        ).strip()
                
                return draft

        # Fallback to Generic
        generic_parser = GenericQRParser()
        return generic_parser.parse(clean_payload)

# Global singleton instance
detector = ProviderDetector()
