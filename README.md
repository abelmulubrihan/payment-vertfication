# PayVerify Ethiopia 🇪🇹
> Production-Ready QR-Based Payment Receipt Verification & Transaction Management System for Restaurants in Ethiopia.

---

## 📌 Executive Summary & Architecture Philosophy

**PayVerify Ethiopia** is an enterprise-grade payment receipt verification and reconciliation platform designed specifically for Ethiopian hospitality businesses.

### ⚠️ Core Product Principles
1. **No Bank APIs in MVP:** The waiter scans the QR code already printed or displayed on the customer's digital receipt (Telebirr, CBE Birr / CBE Mobile Banking, Awash, etc.).
2. **Honest Data Extraction (No Fabricated Settlement):** We distinguish between:
   - `QR Decoded`: Raw payload received and sanitized.
   - `Data Extracted`: Reference numbers, amounts, dates, and payer information identified.
   - `Verification URL Available`: Provider verification link present.
   - `Receipt Recorded`: Stored permanently in restaurant ledger.
3. **Extensible Provider Adapter Architecture:** Built around `PaymentProviderParser` interface so official bank and telecom APIs can be seamlessly plugged in later without rewriting the core workflow.
4. **Duplicate Transaction Protection:** Detects duplicate scans by reference number/provider within the restaurant and blocks unauthorized double recording.
5. **Real-time Atomic Calculations:** Daily, weekly, monthly, and yearly totals are calculated dynamically from individual transaction records.
6. **Offline & Poor Internet Support:** Waiters can scan and queue receipts locally with idempotency keys; records automatically sync when internet resumes.

---

## 🏗 System Architecture

```
                                  Customer Shows Receipt
                                            │
                                            ▼
                              [Waiter Mobile App / Web Scanner]
                                            │
                                            ▼
                                     QR Scanner (Camera)
                                            │
                                            ▼
                                  Raw Decoded Payload
                                            │
                                            ▼
                                   [Provider Detector]
                                ┌───────────┼───────────┐
                                ▼           ▼           ▼
                         TelebirrParser  CBEParser  GenericQRParser
                                └───────────┬───────────┘
                                            ▼
                                    TransactionDraft
                                (Provider, Ref, Amount,
                                  Date, Time, Status)
                                            │
                                            ▼
                               [Duplicate Detection Guard]
                                            │
                                            ▼
                                   Transaction Preview
                                            │
                                            ▼
                                     Waiter Confirms
                                            │
                                            ▼
                                   [FastAPI Backend]
                                            │
                               ┌────────────┴────────────┐
                               ▼                         ▼
                      PostgreSQL Database           Audit Trail
                               │                         │
                               └────────────┬────────────┘
                                            ▼
                               [Real-Time Analytics Engine]
                                            │
                               ┌────────────┴────────────┐
                               ▼                         ▼
                     Manager Web Dashboard         Export Engine
                    (Recharts, Cards, RBAC)      (PDF, Excel, CSV)
```

---

## 👥 User Roles & RBAC

| Role | Access Level | Permissions |
|---|---|---|
| **OWNER** | Full Restaurant Access | Organization, Restaurants, Branches, Users, Transactions, Reports, Settings |
| **MANAGER** | Management Access | View transactions, Reports, Staff, Branches, Export Reports, Notes updates |
| **WAITER** | Operational POS Scanner | Login, Scan QR, View own transactions, View transaction details (Financial values immutable) |
| **ACCOUNTANT** | Financial Reconciliation | View transactions, Custom Reports, Filter, Reconcile, Export (CSV/Excel/PDF) |

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL or SQLite (Default SQLite works out of the box for quick start)

---

### 2. Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed demo restaurant, users, and 5 sample transactions (Total: 2,400.00 ETB)
python seed.py

# 4. Run tests
pytest tests/test_all.py -v

# 5. Start FastAPI Backend
uvicorn backend.app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Interactive Swagger API Docs: `http://localhost:8000/docs`

---

### 3. Web Manager Dashboard Setup

```bash
# 1. Navigate to dashboard directory
cd dashboard

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Dashboard will open at: `http://localhost:5173`

---

### 4. Mobile Waiter App Setup (Expo)

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start
```

---

### 5. Running with Docker Compose (Full Stack)

To run PostgreSQL, FastAPI Backend, and Web Dashboard in containers:

```bash
docker-compose up --build
```
- Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🔑 Demo Login Credentials

All demo accounts use password: `password123`

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Owner** | `owner` | `password123` | Full administrative control |
| **Manager** | `manager` | `password123` | Staff oversight & report exports |
| **Waiter** | `abel` | `password123` | Fast scanner & receipt recording |
| **Accountant** | `accountant` | `password123` | Audit reports & PDF/Excel downloads |

*(Tip: You can also use the 1-Click Role Switcher bar at the top of the Web Dashboard to switch roles instantly!)*

---

## 📱 Sample Transactions & Acceptance Criteria

When seeded, the system loads 5 standard transactions:
1. **Telebirr**: `TRX001` — **500.00 ETB** (10:15 AM)
2. **CBE**: `FT26271G7XLW` — **280.00 ETB** (10:42 AM)
3. **Telebirr**: `TRX003` — **1,000.00 ETB** (11:20 AM)
4. **CBE**: `FT004` — **350.00 ETB** (12:05 PM)
5. **Telebirr**: `TRX005` — **270.00 ETB** (01:30 PM)

**Calculated Today's Total = 2,400.00 ETB** (Dynamically calculated from individual database rows).

---

## 🧪 Running Automated Tests

```bash
python -m pytest backend/tests/test_all.py -v
```

Verified test coverage:
- `test_telebirr_parser_plain_text`: Telebirr receipt structure & amount extraction.
- `test_cbe_parser_plain_text`: CBE FT reference numbers, VAT, and total debited.
- `test_cbe_verification_url`: Safe URL verification parsing.
- `test_ssrf_protection_unsafe_url`: Block malicious internal IPs & SSRF payloads.
- `test_generic_json_parser`: Generic JSON & key-value payloads.
- `test_login_success` & `test_login_failure`: JWT authentication & role decoding.
- `test_decode_qr_api`: QR payload decoding endpoint.
- `test_record_transaction_and_duplicate_block`: Duplicate detection blocks 2nd scan with 409 Conflict.
- `test_calculated_totals_from_transactions`: Verifies dynamic period aggregations.
- `test_export_formats`: Verifies CSV, Excel, and PDF stream generation.

---

## 🔒 Security & Data Integrity
- **SSRF Shield:** URL parser disallows localhost, loopback (`127.0.0.1`), private networks (`10.x`, `192.168.x`), and metadata services (`169.254.169.254`).
- **Payload Size Capping:** QR inputs are capped at 8KB to prevent DOS.
- **Financial Immutability:** Waiters cannot alter recorded amounts, references, or dates.
- **Audit Trail:** Every transaction creation, duplicate attempt, status note update, and export is recorded in `audit_logs`.
