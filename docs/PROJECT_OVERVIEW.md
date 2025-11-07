# OPD Wallet - Project Overview

**Last Updated:** January 2025
**Document Type:** Business & Functional Overview
**Audience:** Team Members, Stakeholders, New Joiners

---

## 📖 Table of Contents

1. [What is OPD Wallet?](#what-is-opd-wallet)
2. [The Problem We're Solving](#the-problem-were-solving)
3. [How OPD Wallet Works](#how-opd-wallet-works)
4. [Platform Overview](#platform-overview)
5. [Current Platforms (Active)](#current-platforms-active)
6. [Future Platforms (Planned)](#future-platforms-planned)
7. [Key Features Summary](#key-features-summary)
8. [User Journey Examples](#user-journey-examples)

---

## 🎯 What is OPD Wallet?

**OPD Wallet** is a **digital healthcare wallet and insurance management platform** that helps people use their company health insurance benefits for outpatient (OPD) consultations, medicines, and lab tests without paying cash upfront.

Think of it like this:
- Your company gives you health insurance (₹50,000 per year for OPD)
- Instead of paying from your pocket and waiting for reimbursement
- OPD Wallet lets you use your insurance benefit **instantly** - just like using a debit card
- The payment happens directly from your digital wallet, which is loaded with your insurance amount

### Simple Explanation
Imagine you have a prepaid wallet (like Paytm or Google Pay) that contains your company's health insurance money. When you need a doctor consultation, buy medicines, or get lab tests done, you can pay directly from this wallet - no cash needed, no waiting for claims to be approved.

---

## 🔍 The Problem We're Solving

### Traditional Healthcare Insurance Problems:

1. **Upfront Payment Hassle**
   - Patients pay ₹500-₹2000 for consultations from their own pocket
   - Keep bills, prescriptions, and receipts safe
   - Fill out claim forms (15-20 minutes each)
   - Wait 15-30 days for reimbursement
   - Often forget to claim or lose receipts

2. **Complex Claim Process**
   - Multiple documents needed: bills, prescriptions, pharmacy receipts
   - Manual form filling with policy numbers, dates, amounts
   - Long approval waiting time (2-4 weeks)
   - Rejections due to missing documents or errors

3. **Unused Benefits**
   - 60-70% of OPD insurance benefits go unused
   - People avoid small claims (₹200-₹500) due to hassle
   - Don't know how much balance is left
   - Benefits expire at year-end

### OPD Wallet Solution:

✅ **Instant Payment** - Pay directly from wallet, no cash needed
✅ **No Paperwork** - System handles everything automatically
✅ **Real-time Balance** - Always know how much you have left
✅ **Zero Waiting** - Get treatment immediately
✅ **Automatic Claims** - Bills submitted to insurance automatically

---

## 🔄 How OPD Wallet Works

### The Complete Flow (Simple Steps):

1. **Company Signs Up**
   - Company buys OPD insurance for employees (e.g., ₹50,000/employee/year)
   - Admin uploads employee list to OPD Wallet platform
   - Each employee gets digital wallet automatically

2. **Employee Gets Wallet**
   - Employee receives login credentials via email/SMS
   - Opens OPD Wallet app/website
   - Sees their balance (e.g., ₹50,000 available)

3. **Employee Uses Healthcare**
   - Books doctor appointment through app (online or clinic visit)
   - Consultation fee (e.g., ₹500) deducted from wallet automatically
   - Gets prescription from doctor digitally
   - Orders medicines - payment from wallet
   - Books lab tests - payment from wallet

4. **Behind the Scenes (Automatic)**
   - System tracks every transaction
   - Applies co-payment rules (e.g., 10% patient pays, 90% from insurance)
   - Generates claim documents automatically
   - Submits to insurance company (TPA)
   - Updates wallet balance in real-time

5. **Everyone Stays Updated**
   - Employee sees transaction history anytime
   - Company admin monitors usage across all employees
   - Insurance team (TPA) processes claims efficiently
   - Finance team handles settlements monthly

---

## 🏢 Platform Overview

OPD Wallet consists of **6 integrated platforms** (3 active + 3 planned), each designed for specific users:

```
┌─────────────────────────────────────────────────────────┐
│                     OPD WALLET ECOSYSTEM                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Active Platforms (Currently Running):                 │
│  1. Member Portal     - For employees/patients         │
│  2. Doctor Portal     - For healthcare providers       │
│  3. Admin Portal      - For company HR & super admins  │
│                                                         │
│  Backend Infrastructure:                               │
│  4. API Backend       - Core business logic & data     │
│                                                         │
│  Future Platforms (In Development Pipeline):           │
│  5. TPA Portal        - For insurance claim processors │
│  6. Finance Portal    - For payment reconciliation     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Current Platforms (Active)

### 1. 👤 Member Portal (Employee/Patient Portal)

**Who Uses It:** Company employees, their family members, patients

**Primary Purpose:** Access healthcare services using digital wallet

**Current Features:**
- ✅ **Digital Wallet Dashboard**
  - View available balance (e.g., ₹45,230 remaining)
  - See transaction history (all consultations, medicines, lab tests)
  - Download bills and receipts
  - Track co-payment amounts

- ✅ **Doctor Consultations**
  - Book online video consultations (integrated with Daily.co)
  - Book in-clinic appointments at network hospitals
  - View available doctors by specialty
  - Check doctor availability and time slots
  - Automatic wallet payment during booking

- ✅ **Prescription Management**
  - View digital prescriptions from doctors
  - Download prescriptions as PDF
  - Access historical prescriptions anytime
  - Share prescriptions with pharmacy

- ✅ **Pharmacy & Medicines**
  - Order medicines online from network pharmacies (planned)
  - Upload pharmacy bills for reimbursement (planned)
  - Automatic wallet deduction
  - Medicine delivery tracking (planned)

- ✅ **Lab Tests**
  - Book lab tests from network diagnostic centers (planned)
  - View lab reports online (planned)
  - Download test results (planned)
  - Track lab test history (planned)

- ✅ **Claims & Reimbursements**
  - Submit manual claims for non-network providers (planned)
  - Upload bills, prescriptions, and receipts
  - Track claim status (Submitted → Under Review → Approved/Rejected)
  - Get refunds to wallet for approved claims

- ✅ **User Profile**
  - Manage personal information
  - Add family members under policy
  - View policy details and coverage
  - Update contact information and preferences

**Future Enhancements:**
- 🔄 AI-powered symptom checker (suggest relevant specialists)
- 🔄 Medicine reminders and refill alerts
- 🔄 Health records storage (blood reports, vaccination history)
- 🔄 Family health dashboard (track usage for all dependents)
- 🔄 Chatbot for instant support
- 🔄 Integration with fitness apps (Google Fit, Apple Health)
- 🔄 Nearby clinic finder using GPS location
- 🔄 Appointment reminders via WhatsApp/SMS

---

### 2. 👨‍⚕️ Doctor Portal (Healthcare Provider Portal)

**Who Uses It:** Doctors, medical practitioners, clinic staff

**Primary Purpose:** Conduct consultations and manage patient care

**Current Features:**
- ✅ **Video Consultation Room**
  - High-quality video calls with patients (Daily.co integration)
  - Screen sharing for explaining reports
  - Chat feature for sending instructions
  - Call recording for records (with consent)
  - Technical support for connectivity issues

- ✅ **Appointment Management**
  - View daily appointment schedule
  - See upcoming consultations
  - Appointment reminders and notifications
  - Patient arrival notifications
  - Reschedule or cancel appointments

- ✅ **Digital Prescription Writing**
  - Create prescriptions digitally during consultation
  - Pre-loaded medicine database (autocomplete search)
  - Common dosage templates (e.g., "1-0-1 after meals")
  - Add diagnosis, symptoms, and notes
  - Generate PDF prescription instantly
  - Auto-send prescription to patient's portal

- ✅ **Patient History**
  - View patient's previous consultations
  - Access past prescriptions and diagnoses
  - See lab reports and test results (planned)
  - View ongoing medications
  - Check allergies and medical conditions

- ✅ **Consultation Notes**
  - Record consultation notes privately
  - Voice-to-text notes during video call (planned)
  - Clinical observations and recommendations
  - Follow-up instructions
  - Referral notes to specialists

- ✅ **Availability Management**
  - Set working hours and consultation slots
  - Mark holidays and unavailable dates
  - Set slot duration (15/30/45 minutes)
  - Manage consultation fees per slot type

**Future Enhancements:**
- 🔄 AI scribe (automatically convert consultation audio to notes)
- 🔄 Lab test prescription (order tests directly from portal)
- 🔄 Template-based prescriptions (save common prescription patterns)
- 🔄 Patient chat messaging (follow-up questions after consultation)
- 🔄 Integration with clinic management software
- 🔄 Revenue dashboard (track earnings, consultation count)
- 🔄 Patient feedback and ratings display
- 🔄 Medical record upload (attach reports, X-rays, etc.)

---

### 3. 🏛️ Admin Portal (Company HR & Super Admin Portal)

**Who Uses It:**
- Company HR managers (view their company's data)
- Super admins (view all companies, manage platform)
- Operations team (handle support tickets)

**Primary Purpose:** Manage employees, policies, and monitor usage

**Current Features:**

#### For Company HR Admins:
- ✅ **Policy Management**
  - Create and manage health insurance policies
  - Set policy limits (per employee, per category)
  - Define effective dates (start and end)
  - Set co-payment percentages (e.g., 10% employee, 90% insurance)
  - Configure category-wise limits:
    - In-Clinic Consultation: ₹10,000/year
    - Online Consultation: ₹5,000/year
    - Pharmacy: ₹15,000/year
    - Diagnostics: ₹10,000/year

- ✅ **Employee Management (Assignments)**
  - Upload employee list via CSV/Excel
  - Add individual employees manually
  - Assign policy to employee
  - Add family members (spouse, children, parents)
  - Set relationship-based limits
  - View employee wallet balances
  - Deactivate employees on resignation

- ✅ **Usage Monitoring Dashboard**
  - Real-time usage statistics:
    - Total employees enrolled
    - Total wallet balance available
    - Amount utilized this month
    - Top 10 high-usage employees
  - Category-wise breakdown (consultations, medicines, labs)
  - Monthly trend graphs
  - Download usage reports (Excel/PDF)

- ✅ **Claims Review (Basic)**
  - View submitted claims from employees
  - See claim details (amount, category, documents)
  - Approve or reject manual claims
  - Add comments for rejections
  - Track claim settlement status

#### For Super Admins:
- ✅ **Multi-Company Management**
  - View all registered companies
  - Create new company accounts
  - Activate/deactivate companies
  - View company-wise statistics
  - Platform-wide revenue dashboard

- ✅ **Doctor & Clinic Management**
  - Onboard new doctors to platform
  - Verify doctor credentials (degrees, registrations)
  - Add clinics and diagnostic centers
  - Set network hospitals
  - Manage doctor fees and commissions
  - Activate/deactivate doctor accounts

- ✅ **Master Data Management**
  - Manage medicine database (10,000+ medicines)
  - Add medical specialties (Cardiology, Orthopedics, etc.)
  - Maintain diagnosis codes (ICD-10)
  - Update lab test catalog
  - Configure system settings

- ✅ **Financial Overview**
  - Total funds loaded in system
  - Total utilization across all companies
  - Pending settlements to doctors/clinics
  - Revenue by category
  - Monthly financial reports

**Future Enhancements:**
- 🔄 AI-powered fraud detection (identify suspicious claims)
- 🔄 Predictive analytics (forecast year-end utilization)
- 🔄 Automated reports to company management (monthly health reports)
- 🔄 Employee wellness score (based on consultation patterns)
- 🔄 Bulk operations (update 1000+ employee limits at once)
- 🔄 Custom policy rules engine (complex eligibility rules)
- 🔄 Integration with HR systems (Darwinbox, Keka, SAP)
- 🔄 Role-based access control (separate access for finance team, HR team)

---

### 4. 🔧 API Backend (Core Business Engine)

**What It Is:** The central brain of OPD Wallet - handles all business logic, data storage, and integrations

**Who Uses It:** All other platforms (Member, Doctor, Admin) connect to this backend

**What It Does:**
- ✅ **User Authentication & Security**
  - Secure login system with encrypted passwords
  - JWT token-based authentication
  - Role-based access control (Member, Doctor, Admin, Super Admin)
  - Session management across devices

- ✅ **Wallet Management**
  - Create digital wallets for each employee
  - Track every transaction (debit/credit)
  - Calculate co-payment splits automatically
  - Update balances in real-time
  - Generate transaction receipts

- ✅ **Appointment Processing**
  - Handle booking requests
  - Check slot availability
  - Process payments from wallet
  - Send confirmation emails/SMS
  - Manage cancellations and refunds

- ✅ **Claims Processing**
  - Receive claim submissions
  - Validate documents and amounts
  - Apply policy rules automatically
  - Calculate eligible amount
  - Update claim status (pending → approved → settled)
  - Refund approved amounts to wallet

- ✅ **Doctor & Clinic Management**
  - Store doctor profiles and specialties
  - Manage consultation slots
  - Track doctor availability
  - Process prescription uploads
  - Handle video call room creation

- ✅ **Policy & Configuration**
  - Store policy rules and limits
  - Apply category-wise restrictions
  - Enforce co-payment percentages
  - Check balance before transactions
  - Handle policy renewals

- ✅ **Reporting & Analytics**
  - Generate usage reports
  - Calculate statistics (total users, transactions, etc.)
  - Provide data for dashboards
  - Export financial summaries

- ✅ **Integrations**
  - Video consultation (Daily.co API)
  - Payment gateways (for wallet loading)
  - SMS/Email notifications
  - Google Maps (clinic location)
  - AWS Secrets Manager (secure credentials)

**Technical Capabilities:**
- REST API with 100+ endpoints
- MongoDB database with 25+ collections
- Handles 10,000+ transactions per day
- 99.9% uptime with auto-restart
- Automated backups every 6 hours
- API documentation via Swagger

---

## 🔮 Future Platforms (Planned)

### 5. 🏥 TPA Portal (Insurance Claim Processor Portal)

**Who Will Use It:** Third Party Administrators (TPA), insurance company claim processors

**Primary Purpose:** Process and approve insurance claims submitted by employees

**Planned Features:**
- 📋 **Claim Queue Management**
  - View all pending claims in one dashboard
  - Priority sorting (urgent, high-value, aging claims)
  - Assign claims to specific processors
  - Track processing time per claim
  - Auto-escalate delayed claims

- 📋 **Claim Review & Verification**
  - View complete claim details:
    - Employee information and policy
    - Service details (consultation/medicine/lab)
    - Bill amounts and uploaded documents
    - Co-payment calculations
    - Policy coverage limits
  - Download bills, prescriptions, and receipts
  - Zoom into uploaded images
  - Verify against policy terms
  - Check for duplicate claims

- 📋 **Approval Workflow**
  - Approve eligible claims with one click
  - Reject with reason selection (e.g., "Out of network", "Duplicate", "Exceeds limit")
  - Request additional documents from employee
  - Partial approval (e.g., approve ₹500 out of ₹600 claim)
  - Bulk approve small claims (<₹500)

- 📋 **Communication**
  - Send queries to employees (request clarification)
  - Add internal notes for team discussion
  - Email notifications on approval/rejection
  - Automated rejection reason templates

- 📋 **Analytics Dashboard**
  - Claims processed today/this week/this month
  - Average processing time
  - Approval rate vs rejection rate
  - Top rejection reasons
  - Claims aging report (pending >7 days)
  - Processor performance metrics

- 📋 **Audit & Compliance**
  - Complete audit trail (who approved, when, why)
  - Random sampling for quality check
  - Fraud detection alerts
  - Policy compliance reports
  - Export claims for TPA's internal system

**Expected Impact:**
- Reduce claim processing time from 15-20 days to 2-3 days
- Eliminate manual data entry (all data from API)
- 80% reduction in document handling
- Better fraud detection with automated checks
- Improve employee satisfaction (faster approvals)

---

### 6. 💰 Finance Portal (Payment Reconciliation Portal)

**Who Will Use It:** Finance teams (company finance, TPA finance, platform finance)

**Primary Purpose:** Handle financial settlements, reconciliations, and payment tracking

**Planned Features:**
- 💳 **Wallet Fund Management**
  - Load funds into company wallets
  - Track fund transfers (company → platform)
  - View fund utilization per company
  - Set low-balance alerts
  - Generate fund requests for top-up

- 💳 **Doctor/Clinic Settlements**
  - View pending payments to doctors (consultation fees)
  - View pending payments to clinics (for services)
  - Generate payment batches (weekly/monthly)
  - Process bulk payments
  - Download payment vouchers
  - Track payment status (initiated → processed → completed)

- 💳 **TPA Settlements**
  - View approved claims by TPA
  - Calculate settlement amount (total approved claims)
  - Generate invoice for TPA
  - Track payment from TPA to platform
  - Reconcile received amount with invoiced amount

- 💳 **Company Invoicing**
  - Generate monthly invoice for company:
    - Platform usage fees
    - Transaction charges
    - Doctor consultation fees
    - Admin fees
  - Send invoices via email
  - Track payment due dates
  - Send payment reminders
  - Record payments received

- 💳 **Reconciliation Dashboard**
  - Match transactions with bank statements
  - Identify mismatches (payment received ≠ invoice amount)
  - Resolve discrepancies
  - Mark reconciled transactions
  - Generate reconciliation reports

- 💳 **Financial Reports**
  - Platform revenue report (month/quarter/year)
  - Company-wise revenue breakdown
  - Doctor earnings report
  - TPA settlement summary
  - Pending receivables report
  - Profit & loss statement

- 💳 **Tax & Compliance**
  - Generate TDS certificates for doctors
  - GST invoice generation
  - Export data for accounting software (Tally, QuickBooks)
  - Statutory compliance reports

**Expected Impact:**
- Automate 90% of manual reconciliation work
- Reduce settlement time from 30 days to 7 days
- Eliminate payment errors and mismatches
- Real-time financial visibility for stakeholders
- Faster doctor payouts (improve doctor satisfaction)

---

## 📊 Key Features Summary

### Core Capabilities (Available Now):

| Feature | Member Portal | Doctor Portal | Admin Portal | TPA Portal | Finance Portal |
|---------|--------------|---------------|--------------|------------|----------------|
| **Digital Wallet** | ✅ View & Use | ❌ | ✅ Monitor | ❌ | ✅ Manage Funds |
| **Video Consultation** | ✅ Join Call | ✅ Conduct Call | ✅ Monitor | ❌ | ❌ |
| **Appointments** | ✅ Book | ✅ Manage | ✅ View All | ❌ | ❌ |
| **Prescriptions** | ✅ View & Download | ✅ Create & Upload | ✅ View | ❌ | ❌ |
| **Claims Processing** | ✅ Submit | ❌ | ✅ Basic Review | 🔄 Full Review | ❌ |
| **Policy Management** | ❌ | ❌ | ✅ Full Control | ❌ | ❌ |
| **Employee Management** | ❌ | ❌ | ✅ Full Control | ❌ | ❌ |
| **Financial Settlements** | ❌ | ❌ | ❌ | ❌ | 🔄 Full Control |
| **Analytics Dashboard** | ✅ Personal | ✅ Personal | ✅ Company-wide | 🔄 Claim Stats | 🔄 Financial |

**Legend:**
- ✅ = Available Now
- 🔄 = Planned (In Pipeline)
- ❌ = Not Applicable

---

## 👥 User Journey Examples

### Example 1: Employee Gets Healthcare (Happy Path)

**Scenario:** Rajesh (employee at ABC Company) has fever and wants to consult a doctor.

1. **Login** (11:00 AM)
   - Rajesh opens OPD Wallet app on his phone
   - Logs in using email and password
   - Dashboard shows: ₹48,500 available balance

2. **Find Doctor** (11:02 AM)
   - Clicks "Book Consultation"
   - Selects specialty: "General Physician"
   - Sees list of 5 available doctors with ratings
   - Chooses Dr. Priya Sharma (4.8★, ₹500 fee, available now)

3. **Book Appointment** (11:03 AM)
   - Selects "Online Video Consultation"
   - Picks time slot: 11:30 AM (first available)
   - Confirms appointment
   - **System deducts ₹500 from wallet**
   - Co-payment: ₹50 (10%) from Rajesh, ₹450 (90%) from insurance
   - Receives confirmation SMS and email with video call link

4. **Video Consultation** (11:30 AM)
   - Rajesh clicks video call link at 11:30 AM
   - Enters waiting room
   - Dr. Priya joins call at 11:31 AM
   - Rajesh explains symptoms: fever, headache, body pain
   - Doctor examines (asks questions, checks visible symptoms)
   - Doctor diagnoses: Viral fever
   - Consultation ends at 11:45 AM (15 minutes)

5. **Get Prescription** (11:46 AM)
   - Notification: "Dr. Priya uploaded your prescription"
   - Rajesh opens prescription in app
   - Prescription shows:
     - Paracetamol 650mg - 1-1-1 for 3 days
     - Rest and hydration advice
   - Downloads prescription PDF
   - Shares prescription with local pharmacy via WhatsApp

6. **Follow-up** (Next Day)
   - Rajesh feels better
   - Reviews transaction history in app
   - Transaction shows:
     - Consultation with Dr. Priya Sharma
     - Amount: ₹500 (₹50 co-pay, ₹450 from wallet)
     - Remaining balance: ₹48,000
     - Receipt available for download

**Total Time:** 45 minutes (from login to getting prescription)
**Money Paid by Rajesh:** ₹50 (10% co-pay)
**Convenience:** No cash, no hospital visit, instant prescription

---

### Example 2: HR Admin Sets Up New Policy

**Scenario:** Priya (HR Manager at XYZ Corp) wants to set up health insurance for 200 employees.

1. **Login to Admin Portal** (Day 1, 10:00 AM)
   - Priya receives super admin invitation email
   - Creates password and logs in
   - Dashboard shows: 0 employees, 0 policies

2. **Create Policy** (10:10 AM)
   - Clicks "Create New Policy"
   - Fills in policy details:
     - Policy Name: "XYZ Corp Health Plan 2025"
     - Effective From: Jan 1, 2025
     - Effective To: Dec 31, 2025
     - Total Employees: 200
     - Coverage per Employee: ₹50,000/year
   - Sets category limits:
     - In-Clinic Consultation: ₹12,000 (₹1000/visit limit)
     - Online Consultation: ₹6,000 (₹500/visit limit)
     - Pharmacy: ₹18,000 (no per-transaction limit)
     - Diagnostics: ₹14,000 (no per-transaction limit)
   - Sets co-payment: 10% (employee pays 10%, insurance pays 90%)
   - Clicks "Save Policy"
   - Policy status: DRAFT

3. **Upload Employees** (10:30 AM)
   - Clicks "Add Employees"
   - Downloads CSV template
   - HR team fills employee data in Excel:
     - Name, Email, Phone, DOB, Gender, Address
     - Family members (spouse, children)
   - Uploads CSV file (200 employees)
   - System validates data (checks for duplicates, missing fields)
   - Preview shows: 200 employees, 280 members (including family)
   - Clicks "Confirm Upload"

4. **System Processing** (10:35 AM - 10:40 AM)
   - System creates 200 user accounts
   - Generates unique UHID for each member
   - Creates digital wallet for each employee
   - Loads ₹50,000 in each wallet
   - Sends welcome email to all employees with login credentials
   - Sends SMS with app download link

5. **Activate Policy** (10:45 AM)
   - Priya reviews policy and employee list
   - Clicks "Activate Policy"
   - Policy status changes to: ACTIVE
   - All 200 employees can now use their wallets

6. **Monitor Usage** (Ongoing)
   - Next day: Dashboard shows 15 employees logged in
   - Week 1: 45 consultations completed, ₹22,500 utilized
   - Month 1: 120 employees used service, ₹1,85,000 utilized
   - Priya downloads monthly report for management

**Setup Time:** 1 hour (for 200 employees)
**Employee Activation:** Immediate (no waiting for cards/approvals)
**Manual Work Eliminated:** No individual onboarding calls

---

### Example 3: TPA Processes Claim (Future)

**Scenario:** Sunita (TPA claim processor) reviews a pharmacy claim from an employee.

1. **Login to TPA Portal** (9:00 AM)
   - Sunita logs into TPA Portal
   - Dashboard shows: 47 pending claims today

2. **Open Claim** (9:02 AM)
   - Clicks on claim #CLM-45892
   - Claim details appear:
     - Employee: Amit Kumar (ABC Corp)
     - Policy: ABC Corp Health Plan 2025
     - Category: Pharmacy
     - Claim Amount: ₹1,850
     - Date: Jan 15, 2025
     - Pharmacy: Apollo Pharmacy, Delhi
     - Co-payment: ₹185 (paid by employee)
     - Wallet deduction: ₹1,665 (pending approval)

3. **Review Documents** (9:03 AM)
   - Views uploaded pharmacy bill (PDF)
   - Bill shows:
     - Medicines purchased: ₹1,850
     - Date: Jan 15, 2025
     - Prescription attached
   - Views prescription from Dr. Sharma (uploaded on Jan 10)
   - Prescription matches medicines on bill ✓
   - Checks policy: Pharmacy limit = ₹18,000/year
   - Employee used so far: ₹3,200
   - Remaining: ₹14,800
   - Claim amount ₹1,850 < Remaining ₹14,800 ✓

4. **Approve Claim** (9:05 AM)
   - All checks pass
   - Clicks "Approve Claim"
   - System updates:
     - Claim status: APPROVED
     - Wallet balance: No change (already deducted)
     - Employee's pharmacy limit updated: ₹14,800 - ₹1,850 = ₹12,950 remaining
   - Notification sent to employee: "Your claim is approved!"

5. **Process Next Claim** (9:06 AM)
   - Sunita moves to next claim
   - Processes 30 claims in 2 hours (average 4 minutes per claim)

**Processing Time:** 4 minutes per claim
**Manual Work:** Minimal (only document verification)
**Employee Wait Time:** Same day approval (vs 15-20 days traditionally)

---

## 🎯 Project Goals & Vision

### Short-Term Goals (6 Months):
- ✅ Onboard 10 companies (2000+ employees)
- ✅ Process 500 consultations per day
- ✅ Integrate 50 network doctors
- ✅ Achieve 80% employee satisfaction
- ✅ Launch TPA Portal for claim processing

### Long-Term Goals (1-2 Years):
- 📈 Onboard 100+ companies (50,000+ employees)
- 📈 Process 5000 consultations per day
- 📈 Integrate 500+ doctors and 100+ clinics
- 📈 Add pharmacy and lab partnerships
- 📈 Launch mobile apps (iOS & Android)
- 📈 Expand to Tier 2 & Tier 3 cities
- 📈 Integrate with national health stack (ABHA)

### Vision:
**"Make healthcare accessible, affordable, and hassle-free for every working professional in India."**

We envision a future where:
- No employee pays upfront for basic healthcare
- No claim forms, no paperwork, no waiting
- Healthcare is as easy as ordering food online
- Every rupee of health insurance is utilized
- Families stay healthy without financial stress

---

## 📞 Getting Started

### For Team Members:
- Read this document to understand the business
- Review [TECHNOLOGY_STACK.md](/docs/TECHNOLOGY_STACK.md) for technical details
- Check [temp_automated_testing_not_implemented.md](/docs/temp_automated_testing_not_implemented.md) for testing approach
- Join onboarding sessions with tech lead

### For Stakeholders:
- This document provides complete business overview
- For demo, contact: demo@opdwallet.com
- For partnership inquiries: partnerships@opdwallet.com

---

**Document Version:** 1.0
**Last Reviewed:** January 2025
**Next Review:** April 2025
