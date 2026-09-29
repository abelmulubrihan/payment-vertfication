import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User, RoleEnum
from backend.app.models.organization import Organization, Restaurant, Branch
from backend.app.models.transaction import Transaction, QRStatusEnum, ReceiptStatusEnum
from backend.app.auth.security import get_password_hash, create_access_token
from backend.app.providers.detector import detector
from backend.app.providers.telebirr import TelebirrParser
from backend.app.providers.cbe import CBEParser
from backend.app.providers.generic import GenericQRParser
from backend.app.api.demo import seed_demo_database

# Use in-memory SQLite for test suite
TEST_DATABASE_URL = "sqlite:///./test_payverify.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_demo_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

# ==================== 1. QR PARSER TESTS ====================

def test_telebirr_parser_plain_text():
    parser = TelebirrParser()
    payload = """
    Telebirr Payment Receipt
    Payer: Abel Tesfaye
    Telebirr account: +251911234567
    Receiver: Habesha Restaurant
    Invoice number: TRX8A91K2
    Settled amount: 500.00 ETB
    Payment date: 2026-09-29
    Payment time: 10:15 AM
    """
    assert parser.detect(payload) is True
    draft = parser.parse(payload)
    assert draft.provider == "TELEBIRR"
    assert draft.reference_number == "TRX8A91K2"
    assert draft.amount == 500.00
    assert draft.payer_name == "Abel Tesfaye"
    assert draft.payer_account_masked == "+25191****567"
    assert draft.qr_status == "DATA_EXTRACTED"

def test_cbe_parser_plain_text():
    parser = CBEParser()
    payload = """
    CBE Mobile Banking Receipt
    Payer: Dawit Mengistu
    Payer account: 100012345678
    Receiver: Habesha Restaurant
    Reference number: FT26271G7XLW
    Transferred amount: 280.00 ETB
    Service charge: 5.00 ETB
    VAT: 0.75 ETB
    Total amount debited: 285.75 ETB
    Payment date: 2026-09-29
    Payment time: 10:42 AM
    """
    assert parser.detect(payload) is True
    draft = parser.parse(payload)
    assert draft.provider == "CBE"
    assert draft.reference_number == "FT26271G7XLW"
    assert draft.amount == 280.00
    assert draft.service_charge == 5.00
    assert draft.total_debited == 285.75
    assert draft.payer_name == "Dawit Mengistu"

def test_cbe_verification_url():
    url_payload = "https://apps.cbe.com.et/verify?ref=FT26271G7XLW&amt=280.00"
    draft = detector.decode_and_parse(url_payload)
    assert draft.provider == "CBE"
    assert draft.reference_number == "FT26271G7XLW"
    assert draft.amount == 280.00
    assert draft.qr_status == "VERIFICATION_PAGE_AVAILABLE"
    assert draft.verification_url == url_payload

def test_ssrf_protection_unsafe_url():
    # SSRF payload pointing to internal IP
    unsafe_payload = "http://169.254.169.254/latest/meta-data/credentials"
    draft = detector.decode_and_parse(unsafe_payload)
    # Verification URL should be stripped by security filter
    assert draft.verification_url is None
    assert "blocked by security filter" in (draft.missing_fields_warning or "")

def test_generic_json_parser():
    json_payload = '{"bank": "Awash Bank", "reference": "AWSH999", "amount": 150.50, "date": "2026-09-29"}'
    draft = detector.decode_and_parse(json_payload)
    assert draft.provider == "GENERIC"
    assert draft.reference_number == "AWSH999"
    assert draft.amount == 150.50

# ==================== 2. AUTH & RBAC TESTS ====================

def test_login_success():
    res = client.post("/api/auth/login", json={"username_or_email": "abel", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_failure():
    res = client.post("/api/auth/login", json={"username_or_email": "abel", "password": "wrongpassword"})
    assert res.status_code == 401

def test_get_current_user_profile():
    login_res = client.post("/api/auth/login", json={"username_or_email": "abel", "password": "password123"})
    token = login_res.json()["access_token"]
    
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    profile = res.json()
    assert profile["username"] == "abel"
    assert profile["role"] == "WAITER"

# ==================== 3. TRANSACTION WORKFLOW & DUPLICATES ====================

def test_decode_qr_api():
    login_res = client.post("/api/auth/login", json={"username_or_email": "abel", "password": "password123"})
    token = login_res.json()["access_token"]

    payload = "CBE Receipt: FT9988771122, Transferred amount=450.00 ETB, date=2026-09-29"
    res = client.post(
        "/api/qr/decode",
        json={"qr_payload": payload},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["draft"]["provider"] == "CBE"
    assert data["draft"]["reference_number"] == "FT9988771122"
    assert data["draft"]["amount"] == 450.00
    assert data["is_duplicate"] is False

def test_record_transaction_and_duplicate_block():
    login_res = client.post("/api/auth/login", json={"username_or_email": "abel", "password": "password123"})
    token = login_res.json()["access_token"]

    tx_payload = {
        "provider": "CBE",
        "provider_display_name": "Commercial Bank of Ethiopia",
        "reference_number": "FT_TEST_DUP_123",
        "amount": 320.00,
        "payment_date": "2026-09-29",
        "payment_time": "02:00 PM",
        "qr_payload": "CBE FT_TEST_DUP_123 320 ETB",
        "idempotency_key": "unique_scan_key_001"
    }

    # 1. First Scan: Successfully saves
    res1 = client.post("/api/transactions", json=tx_payload, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 200
    tx_data = res1.json()
    assert tx_data["reference_number"] == "FT_TEST_DUP_123"
    assert tx_data["amount"] == 320.00

    # 2. Second Scan by Waiter: Blocked with 409 Conflict Duplicate warning
    res2 = client.post("/api/transactions", json={**tx_payload, "idempotency_key": "second_scan_key"}, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 409
    dup_resp = res2.json()
    assert "Duplicate Transaction" in dup_resp["detail"]["message"]
    assert dup_resp["detail"]["duplicate_info"]["reference_number"] == "FT_TEST_DUP_123"

# ==================== 4. REPORT & DASHBOARD CALCULATIONS ====================

def test_calculated_totals_from_transactions():
    """
    Verifies that daily totals are dynamically calculated from transactions.
    """
    login_res = client.post("/api/auth/login", json={"username_or_email": "manager", "password": "password123"})
    token = login_res.json()["access_token"]

    res = client.get("/api/reports/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    
    # 5 seeded transactions (500 + 280 + 1000 + 350 + 270 = 2400) + 1 new (320) = 2720
    assert data["today_total"] >= 2400.00
    assert data["today_count"] >= 5

def test_export_formats():
    login_res = client.post("/api/auth/login", json={"username_or_email": "manager", "password": "password123"})
    token = login_res.json()["access_token"]

    # CSV Export
    csv_res = client.get("/api/reports/export/csv", headers={"Authorization": f"Bearer {token}"})
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert len(csv_res.content) > 50

    # Excel Export
    excel_res = client.get("/api/reports/export/excel", headers={"Authorization": f"Bearer {token}"})
    assert excel_res.status_code == 200
    assert len(excel_res.content) > 100

    # PDF Export
    pdf_res = client.get("/api/reports/export/pdf", headers={"Authorization": f"Bearer {token}"})
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert len(pdf_res.content) > 100
