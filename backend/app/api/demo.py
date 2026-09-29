import uuid
from datetime import date, datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db, Base, engine
from backend.app.models.organization import Organization, Restaurant, Branch
from backend.app.models.user import User, RoleEnum
from backend.app.models.transaction import Transaction, TransactionProviderData, QRStatusEnum, ReceiptStatusEnum
from backend.app.auth.security import get_password_hash
from backend.app.services.audit_service import log_audit
from backend.app.models.audit_log import AuditActionEnum

router = APIRouter(prefix="/demo", tags=["Demo & Sample Data"])

SAMPLE_QRS = [
    {
        "id": "cbe_receipt_1",
        "provider": "CBE",
        "title": "CBE - Standard Transfer (FT26271G7XLW)",
        "amount": 280.00,
        "reference": "FT26271G7XLW",
        "qr_payload": "CBE Mobile Banking Receipt\nPayer: Dawit Mengistu\nPayer account: 1000****421\nReceiver: Habesha Restaurant Bole\nReceiver account: 1000****992\nPayment type: Transfer / Payment\nPayment date: 2026-09-29\nPayment time: 10:42 AM\nReference number: FT26271G7XLW\nReason/type of service: Lunch Payment\nTransferred amount: 280.00 ETB\nService charge: 0.00 ETB\nVAT: 0.00 ETB\nTotal amount debited: 280.00 ETB\nVerification URL: https://apps.cbe.com.et/verify?ref=FT26271G7XLW"
    },
    {
        "id": "telebirr_receipt_1",
        "provider": "TELEBIRR",
        "title": "Telebirr - Merchant Pay (TRX8A91K2)",
        "amount": 500.00,
        "reference": "TRX8A91K2",
        "qr_payload": "Telebirr Payment Receipt\nPayer: Abel Tesfaye\nTelebirr account: +25191****345\nReceiver: Habesha Restaurant Bole\nReceiver account: +25197****890\nTransaction status: Success\nInvoice number: TRX8A91K2\nPayment date: 2026-09-29\nPayment time: 10:15 AM\nSettled amount: 500.00 ETB\nPayment mode: QR Code\nPayment channel: Telebirr SuperApp\nVerification: https://telebirr.ethiotelecom.et/receipt?inv=TRX8A91K2&amt=500.00"
    },
    {
        "id": "telebirr_receipt_2",
        "provider": "TELEBIRR",
        "title": "Telebirr - Dinner Bill (TRX9B72L4)",
        "amount": 1000.00,
        "reference": "TRX9B72L4",
        "qr_payload": "Telebirr Payment Receipt\nPayer: Sara Bekele\nTelebirr account: +25192****678\nReceiver: Habesha Restaurant Bole\nReceiver account: +25197****890\nTransaction status: Success\nInvoice number: TRX9B72L4\nPayment date: 2026-09-29\nPayment time: 11:20 AM\nSettled amount: 1000.00 ETB\nPayment mode: QR Code\nPayment channel: Telebirr App"
    },
    {
        "id": "cbe_receipt_2",
        "provider": "CBE",
        "title": "CBE - Catering Payment (FT004)",
        "amount": 350.00,
        "reference": "FT004",
        "qr_payload": "CBE Receipt\nPayer: Yohannes Girma\nPayer account: 1000****789\nReceiver: Habesha Restaurant Bole\nReference number: FT004\nPayment date: 2026-09-29\nPayment time: 12:05 PM\nTransferred amount: 350.00 ETB\nTotal amount debited: 350.00 ETB"
    },
    {
        "id": "telebirr_receipt_3",
        "provider": "TELEBIRR",
        "title": "Telebirr - Coffee & Dessert (TRX005)",
        "amount": 270.00,
        "reference": "TRX005",
        "qr_payload": "Telebirr Payment\nPayer: Tigist Alemu\nInvoice number: TRX005\nSettled amount: 270.00 ETB\nPayment date: 2026-09-29\nPayment time: 01:30 PM\nPayment mode: QR Code"
    },
    {
        "id": "generic_url_receipt",
        "provider": "GENERIC",
        "title": "Awash Bank - Web Verification URL",
        "amount": 420.00,
        "reference": "AWSH77821",
        "qr_payload": "https://awashbank.com.et/receipt-verify?ref=AWSH77821&amt=420.00&dt=2026-09-29&payer=Kidus"
    }
]

@router.get("/sample-qrs")
def get_sample_qr_codes():
    """
    Returns pre-made sample QR codes formatted for Telebirr, CBE, and other providers.
    Ideal for fast scanning and testing in the web dashboard and mobile app.
    """
    return SAMPLE_QRS

@router.post("/seed")
def seed_demo_database(db: Session = Depends(get_db)):
    """
    Initializes database tables, creates demo Organization, Restaurant, Branches,
    Users (Owner, Manager, Waiter Abel, Accountant), and the 5 sample transactions
    totaling exactly 2,400.00 ETB.
    """
    Base.metadata.create_all(bind=engine)

    # 1. Organization
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Ethiopian Hospitality Group")
        db.add(org)
        db.flush()

    # 2. Restaurant
    rest = db.query(Restaurant).first()
    if not rest:
        rest = Restaurant(
            organization_id=org.id,
            name="Habesha Cultural Restaurant",
            code="HABESHA-01",
            phone="+251 11 661 2345",
            address="Bole Road, Addis Ababa, Ethiopia"
        )
        db.add(rest)
        db.flush()

    # 3. Branches
    branch_bole = db.query(Branch).filter(Branch.code == "BOLE").first()
    if not branch_bole:
        branch_bole = Branch(
            restaurant_id=rest.id,
            name="Bole Medhanialem Branch",
            code="BOLE",
            address="Near Edna Mall, Bole, Addis Ababa",
            phone="+251 91 100 2233"
        )
        db.add(branch_bole)

    branch_kazanchis = db.query(Branch).filter(Branch.code == "KAZ").first()
    if not branch_kazanchis:
        branch_kazanchis = Branch(
            restaurant_id=rest.id,
            name="Kazanchis Branch",
            code="KAZ",
            address="Kazanchis, Addis Ababa",
            phone="+251 91 100 4455"
        )
        db.add(branch_kazanchis)
    db.flush()

    # 4. Users (Owner, Manager, Waiter Abel, Accountant)
    users_data = [
        {
            "email": "owner@payverify.et",
            "username": "owner",
            "full_name": "Tewodros Kassahun",
            "role": RoleEnum.OWNER,
            "branch_id": branch_bole.id
        },
        {
            "email": "manager@payverify.et",
            "username": "manager",
            "full_name": "Bethlehem Tadesse",
            "role": RoleEnum.MANAGER,
            "branch_id": branch_bole.id
        },
        {
            "email": "abel@payverify.et",
            "username": "abel",
            "full_name": "Abel Tesfaye",
            "role": RoleEnum.WAITER,
            "branch_id": branch_bole.id
        },
        {
            "email": "accountant@payverify.et",
            "username": "accountant",
            "full_name": "Hanna Worku",
            "role": RoleEnum.ACCOUNTANT,
            "branch_id": branch_bole.id
        }
    ]

    default_pw_hash = get_password_hash("password123")
    created_users = {}
    for u_info in users_data:
        u = db.query(User).filter(User.username == u_info["username"]).first()
        if not u:
            u = User(
                restaurant_id=rest.id,
                branch_id=u_info["branch_id"],
                email=u_info["email"],
                username=u_info["username"],
                full_name=u_info["full_name"],
                hashed_password=default_pw_hash,
                role=u_info["role"],
                is_active=True
            )
            db.add(u)
            db.flush()
        created_users[u_info["username"]] = u

    # 5. 5 Sample Transactions totaling 2,400.00 ETB
    waiter_abel = created_users["abel"]
    sample_txs_data = [
        {
            "provider": "TELEBIRR",
            "provider_display_name": "Telebirr",
            "reference_number": "TRX001",
            "invoice_number": "TRX001",
            "amount": 500.00,
            "payer_name": "Samuel Kebede",
            "payer_account_masked": "+25191****101",
            "receiver_name": "Habesha Restaurant",
            "payment_time": "10:15 AM",
            "qr_payload": "Telebirr: invoice=TRX001, settled_amount=500.00 ETB, date=2026-09-29 10:15 AM",
            "qr_status": QRStatusEnum.DATA_EXTRACTED
        },
        {
            "provider": "CBE",
            "provider_display_name": "Commercial Bank of Ethiopia (CBE)",
            "reference_number": "FT26271G7XLW",
            "invoice_number": None,
            "amount": 280.00,
            "payer_name": "Dawit Mengistu",
            "payer_account_masked": "1000****421",
            "receiver_name": "Habesha Restaurant",
            "payment_time": "10:42 AM",
            "qr_payload": "CBE Receipt: FT26271G7XLW, Transferred amount=280.00 ETB, date=2026-09-29 10:42 AM",
            "verification_url": "https://apps.cbe.com.et/verify?ref=FT26271G7XLW",
            "qr_status": QRStatusEnum.VERIFICATION_PAGE_AVAILABLE
        },
        {
            "provider": "TELEBIRR",
            "provider_display_name": "Telebirr",
            "reference_number": "TRX003",
            "invoice_number": "TRX003",
            "amount": 1000.00,
            "payer_name": "Sara Bekele",
            "payer_account_masked": "+25192****678",
            "receiver_name": "Habesha Restaurant",
            "payment_time": "11:20 AM",
            "qr_payload": "Telebirr: invoice=TRX003, settled_amount=1000.00 ETB, date=2026-09-29 11:20 AM",
            "qr_status": QRStatusEnum.DATA_EXTRACTED
        },
        {
            "provider": "CBE",
            "provider_display_name": "Commercial Bank of Ethiopia (CBE)",
            "reference_number": "FT004",
            "invoice_number": None,
            "amount": 350.00,
            "payer_name": "Yohannes Girma",
            "payer_account_masked": "1000****789",
            "receiver_name": "Habesha Restaurant",
            "payment_time": "12:05 PM",
            "qr_payload": "CBE Receipt: FT004, Transferred amount=350.00 ETB, date=2026-09-29 12:05 PM",
            "qr_status": QRStatusEnum.DATA_EXTRACTED
        },
        {
            "provider": "TELEBIRR",
            "provider_display_name": "Telebirr",
            "reference_number": "TRX005",
            "invoice_number": "TRX005",
            "amount": 270.00,
            "payer_name": "Tigist Alemu",
            "payer_account_masked": "+25193****456",
            "receiver_name": "Habesha Restaurant",
            "payment_time": "01:30 PM",
            "qr_payload": "Telebirr: invoice=TRX005, settled_amount=270.00 ETB, date=2026-09-29 01:30 PM",
            "qr_status": QRStatusEnum.DATA_EXTRACTED
        }
    ]

    for tx_data in sample_txs_data:
        existing_tx = db.query(Transaction).filter(
            Transaction.restaurant_id == rest.id,
            Transaction.reference_number == tx_data["reference_number"]
        ).first()
        if not existing_tx:
            new_tx = Transaction(
                restaurant_id=rest.id,
                branch_id=branch_bole.id,
                scanned_by_user_id=waiter_abel.id,
                provider=tx_data["provider"],
                provider_display_name=tx_data["provider_display_name"],
                reference_number=tx_data["reference_number"],
                transaction_number=tx_data["reference_number"],
                invoice_number=tx_data["invoice_number"],
                payer_name=tx_data["payer_name"],
                payer_account_masked=tx_data["payer_account_masked"],
                receiver_name=tx_data["receiver_name"],
                amount=tx_data["amount"],
                service_charge=0.0,
                vat=0.0,
                total_debited=tx_data["amount"],
                currency="ETB",
                payment_date=date.today(),
                payment_time=tx_data["payment_time"],
                qr_payload=tx_data["qr_payload"],
                verification_url=tx_data.get("verification_url"),
                qr_status=tx_data["qr_status"],
                receipt_status=ReceiptStatusEnum.RECEIPT_RECORDED,
                is_duplicate=False
            )
            db.add(new_tx)
            db.flush()
            
            p_data = TransactionProviderData(
                transaction_id=new_tx.id,
                raw_payload=tx_data["qr_payload"],
                extracted_fields={"seeded": True}
            )
            db.add(p_data)

    db.commit()

    return {
        "status": "success",
        "message": "Demo data seeded successfully. Total 5 transactions recorded totaling 2,400.00 ETB.",
        "restaurant": rest.name,
        "credentials": {
            "owner": {"username": "owner", "password": "password123"},
            "manager": {"username": "manager", "password": "password123"},
            "waiter": {"username": "abel", "password": "password123"},
            "accountant": {"username": "accountant", "password": "password123"}
        }
    }
