# TPA Decision Trees

> **Part of TPA Portal Documentation Suite**
>
> Related Documents:
> - [TPA Portal Overview](./TPA_PORTAL_OVERVIEW.md) - Core concepts and API reference
> - [TPA Workflows](./TPA_WORKFLOWS.md) - Complete workflow processes
> - [TPA Best Practices](./TPA_BEST_PRACTICES.md) - Guidelines and best practices

---

## Table of Contents
1. [Claim Approval Decision Tree](#claim-approval-decision-tree)
2. [Document Completeness Check Decision Tree](#document-completeness-check-decision-tree)
3. [Claim Priority Assignment Decision Tree](#claim-priority-assignment-decision-tree)
4. [Appendix](#appendix)

---

## Claim Approval Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│              CLAIM APPROVAL DECISION TREE                    │
└─────────────────────────────────────────────────────────────┘

                    START: Review Claim
                            ↓
            ┌───────────────────────────────┐
            │ Is policy active on service   │
            │ date?                         │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Policy Expired)
            ┌───────────────────────────────┐
            │ Is service covered under      │
            │ policy?                       │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Service Not Covered)
            ┌───────────────────────────────┐
            │ Was pre-authorization         │
            │ required and obtained?        │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Pre-auth Not Obtained)
            ┌───────────────────────────────┐
            │ Is provider in network        │
            │ (if applicable)?              │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → Check Policy
                    ↓               ↓
                    ↓          Out-of-network covered?
                    ↓               ↓
                    ↓          YES ← ┘ → NO → REJECT
            ┌───────────────────────────────┐
            │ Is medical necessity          │
            │ established?                  │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Medical Necessity)
            ┌───────────────────────────────┐
            │ Are all required documents    │
            │ present and valid?            │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REQUEST DOCUMENTS
                    ↓
            ┌───────────────────────────────┐
            │ Is this a duplicate claim?    │
            └───────────────────────────────┘
                    ↓           ↓
                   NO           YES → REJECT
                    ↓               (Reason: Duplicate)
            ┌───────────────────────────────┐
            │ Filed within time limit?      │
            └───────────────────────────────┘
                    ↓           ↓
                   YES          NO → REJECT
                    ↓               (Reason: Filing Limit)
            ┌───────────────────────────────┐
            │ Calculate Eligible Amount:    │
            │ - Apply deductible            │
            │ - Apply copay                 │
            │ - Check sublimits             │
            │ - Verify against fee schedule │
            └───────────────────────────────┘
                    ↓
            ┌───────────────────────────────┐
            │ Compare Claimed vs Eligible   │
            └───────────────────────────────┘
                    ↓
            ┌───────────┴───────────┐
            │                       │
            ↓                       ↓
    ┌──────────────┐      ┌──────────────────┐
    │ Claimed ≤    │      │ Claimed >        │
    │ Eligible     │      │ Eligible         │
    └──────────────┘      └──────────────────┘
            ↓                       ↓
    ┌──────────────┐      ┌──────────────────┐
    │ FULL         │      │ PARTIAL APPROVAL │
    │ APPROVAL     │      │ - Approve eligible│
    │              │      │ - Explain diff   │
    │ Approve full │      │ - Line breakdown │
    │ claimed amt  │      └──────────────────┘
    └──────────────┘
            ↓
            └───────────────┬───────────────┘
                            ↓
                    ┌───────────────┐
                    │ Document      │
                    │ approval with │
                    │ detailed notes│
                    └───────────────┘
                            ↓
                    ┌───────────────┐
                    │ Update status │
                    │ to APPROVED/  │
                    │ PARTIAL_APPR  │
                    └───────────────┘
                            ↓
                           END
```

### Decision Tree Explanation

This decision tree guides TPA users through the systematic evaluation of insurance claims to determine if they should be approved, rejected, or require additional documentation.

#### Key Decision Points:

**1. Policy Active on Service Date**
- Verify that the policy was active when the service was rendered
- Check policy start and end dates
- Rejection Reason: "Policy Expired/Inactive"

**2. Service Covered Under Policy**
- Confirm the claimed service is included in the policy coverage
- Check policy schedule of benefits
- Rejection Reason: "Service Not Covered"

**3. Pre-authorization Obtained**
- Verify if pre-authorization was required
- If required, confirm it was obtained before service
- Rejection Reason: "Pre-authorization Not Obtained"

**4. Provider Network Status**
- Check if provider is in-network (if applicable)
- If out-of-network, verify if policy covers out-of-network services
- Rejection Reason: "Out-of-Network Provider"

**5. Medical Necessity Established**
- Review medical documentation to establish necessity
- Check diagnosis codes and treatment protocols
- Consult medical team if needed
- Rejection Reason: "Medical Necessity Not Established"

**6. Required Documents Present**
- Verify all mandatory documents are submitted
- Check document quality and completeness
- If missing, request additional documents instead of rejection

**7. Duplicate Claim Check**
- Search claim history for duplicate submissions
- Cross-reference dates, amounts, and service details
- Rejection Reason: "Duplicate Claim"

**8. Filing Time Limit**
- Verify claim was submitted within policy filing deadline
- Check time elapsed from service date to submission
- Rejection Reason: "Filing Limit Exceeded"

**9. Calculate Eligible Amount**
- Apply deductibles (if not already met)
- Apply copay percentage
- Check sublimits (room rent, specific services)
- Verify against fee schedule

**10. Final Approval Decision**
- **Full Approval**: If claimed ≤ eligible amount
- **Partial Approval**: If claimed > eligible amount
- Document detailed reasoning for member transparency

---

## Document Completeness Check Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│         DOCUMENT COMPLETENESS CHECK DECISION TREE            │
└─────────────────────────────────────────────────────────────┘

                START: Document Review
                            ↓
                ┌───────────────────────┐
                │ Hospital/Clinic Bill  │
                │ Present?              │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Mark Required
                        ↓
                ┌───────────────────────┐
                │ Bill shows:           │
                │ - Patient name?       │
                │ - Service date?       │
                │ - Itemized charges?   │
                │ - Provider stamp?     │
                └───────────────────────┘
                        ↓           ↓
                  All Present      Missing → Request
                        ↓               Detailed Bill
                        ↓
                ┌───────────────────────┐
                │ For Hospitalization:  │
                │ Discharge Summary     │
                │ Present?              │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Mark Required
                        ↓               (if applicable)
                        ↓
                ┌───────────────────────┐
                │ Discharge Summary has:│
                │ - Diagnosis?          │
                │ - Treatment details?  │
                │ - Doctor signature?   │
                └───────────────────────┘
                        ↓           ↓
                  Complete       Incomplete → Request
                        ↓               Complete Summary
                        ↓
                ┌───────────────────────┐
                │ Prescriptions         │
                │ (if medication claim) │
                │ Present?              │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Mark Required
                        ↓
                ┌───────────────────────┐
                │ Prescription shows:   │
                │ - Doctor name?        │
                │ - Medicine names?     │
                │ - Dosage?             │
                │ - Date?               │
                └───────────────────────┘
                        ↓           ↓
                  Complete       Incomplete → Request
                        ↓               Clear Prescription
                        ↓
                ┌───────────────────────┐
                │ Diagnostic Reports    │
                │ (if tests done)       │
                │ Present?              │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Request
                        ↓               Lab Reports
                        ↓
                ┌───────────────────────┐
                │ For High-Value Claims:│
                │ (>₹50,000)            │
                │ Additional docs needed│
                └───────────────────────┘
                        ↓
                ┌───────────────────────┐
                │ - Medical records?    │
                │ - Consultation notes? │
                │ - Investigation rpts? │
                └───────────────────────┘
                        ↓           ↓
                  All Present      Missing → Request
                        ↓               Additional Docs
                        ↓
                ┌───────────────────────┐
                │ Document Quality Check│
                └───────────────────────┘
                        ↓
                ┌───────────────────────┐
                │ - Legible?            │
                │ - Clear scans?        │
                │ - Complete pages?     │
                │ - Not tampered?       │
                └───────────────────────┘
                        ↓           ↓
                       YES          NO → Request
                        ↓               Better Quality
                        ↓
            ┌───────────┴───────────┐
            │ Any Documents         │
            │ Required?             │
            └───────────┬───────────┘
                        │
                ┌───────┴───────┐
                │               │
               YES              NO
                │               │
                ↓               ↓
        ┌──────────────┐  ┌────────────┐
        │ Send Request │  │ Proceed to │
        │ to Member    │  │ Eligibility│
        │ with:        │  │ Check      │
        │ - Doc list   │  └────────────┘
        │ - Reasons    │        ↓
        │ - Deadline   │       END
        │ Status:      │
        │ DOCS_REQD    │
        └──────────────┘
                ↓
               END
```

### Document Completeness Explanation

This decision tree ensures thorough verification of all required documentation before proceeding with claim adjudication.

#### Document Categories:

**1. Hospital/Clinic Bill (Mandatory)**
- Must include patient name
- Must show service date
- Must have itemized charges
- Must have provider stamp/signature

**2. Discharge Summary (For Hospitalization)**
- Required for all inpatient claims
- Must include diagnosis
- Must show treatment details
- Must have doctor signature

**3. Prescriptions (For Medication Claims)**
- Required when medicines are claimed
- Must show doctor name and registration
- Must list medicine names
- Must specify dosage
- Must be dated

**4. Diagnostic Reports (For Tests/Procedures)**
- Required when diagnostic tests are claimed
- Must be from authorized laboratories
- Must match claimed tests
- Must be properly formatted

**5. High-Value Claim Documentation (>₹50,000)**
- Additional medical records
- Detailed consultation notes
- Investigation reports
- Treatment protocol documentation

**6. Quality Verification**
- All documents must be legible
- Scans must be clear and complete
- All pages must be present
- No evidence of tampering

#### Document Request Best Practices:

- Be specific about what's needed
- Explain why each document is required
- Set reasonable deadlines (7-15 days)
- Provide clear submission instructions
- Include examples if helpful
- Offer support contact information

---

## Claim Priority Assignment Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│          CLAIM PRIORITY ASSIGNMENT DECISION TREE             │
└─────────────────────────────────────────────────────────────┘

            START: New Claim Assessment
                        ↓
            ┌───────────────────────┐
            │ Claim Amount?         │
            └───────────────────────┘
                        ↓
            ┌───────────┴───────────┐
            │                       │
            ↓                       ↓
    ┌──────────────┐      ┌──────────────┐
    │ > ₹1,00,000  │      │ ≤ ₹1,00,000  │
    │ HIGH VALUE   │      │              │
    └──────────────┘      └──────────────┘
            │                       │
            ↓                       ↓
    ┌──────────────┐      ┌───────────────────┐
    │ Priority:    │      │ Check Claim Age   │
    │ HIGH         │      └───────────────────┘
    └──────────────┘                ↓
            │              ┌─────────┴─────────┐
            │              │                   │
            │              ↓                   ↓
            │      ┌──────────────┐    ┌──────────────┐
            │      │ > 5 days old │    │ ≤ 5 days old │
            │      └──────────────┘    └──────────────┘
            │              │                   │
            │              ↓                   ↓
            │      ┌──────────────┐    ┌──────────────┐
            │      │ Priority:    │    │ Check Type   │
            │      │ MEDIUM       │    └──────────────┘
            │      └──────────────┘            ↓
            │              │          ┌────────┴────────┐
            │              │          │                 │
            │              │          ↓                 ↓
            │              │  ┌──────────────┐  ┌─────────────┐
            │              │  │ Emergency/   │  │ Regular OPD │
            │              │  │ Accident     │  │ Consultation│
            │              │  └──────────────┘  └─────────────┘
            │              │          │                 │
            │              │          ↓                 ↓
            │              │  ┌──────────────┐  ┌─────────────┐
            │              │  │ Priority:    │  │ Priority:   │
            │              │  │ MEDIUM       │  │ LOW         │
            │              │  └──────────────┘  └─────────────┘
            │              │          │                 │
            └──────────────┴──────────┴─────────────────┘
                                      ↓
            ┌─────────────────────────────────────┐
            │ Additional Priority Escalators:     │
            │ - Member VIP status                 │
            │ - Corporate priority client         │
            │ - Repeat submission (docs added)    │
            │ - Near SLA breach                   │
            │ - Medical emergency case            │
            │ - Complaint escalation              │
            └─────────────────────────────────────┘
                                      ↓
            ┌─────────────────────────────────────┐
            │ Final Priority Determination        │
            └─────────────────────────────────────┘
                                      ↓
            ┌─────────┬───────────┬───────────┐
            │         │           │           │
            ↓         ↓           ↓           ↓
      ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
      │ URGENT  │ │ HIGH   │ │ MEDIUM │ │ LOW    │
      │ (SLA:   │ │ (SLA:  │ │ (SLA:  │ │ (SLA:  │
      │ 24 hrs) │ │ 48 hrs)│ │ 72 hrs)│ │ 5 days)│
      └─────────┘ └────────┘ └────────┘ └────────┘
            │         │           │           │
            └─────────┴───────────┴───────────┘
                                  ↓
            ┌─────────────────────────────────────┐
            │ Assign to TPA User based on:       │
            │ 1. Priority level                   │
            │ 2. Current workload                 │
            │ 3. Expertise                        │
            │ 4. Performance history              │
            └─────────────────────────────────────┘
                                  ↓
                                 END
```

### Priority Assignment Explanation

This decision tree helps TPA admins assign appropriate priority levels to incoming claims, ensuring critical claims are processed faster.

#### Priority Levels:

**URGENT (24-hour SLA)**
- High-value claims (>₹1,00,000)
- Medical emergency cases
- Complaint escalations
- Near SLA breach situations
- VIP member claims

**HIGH (48-hour SLA)**
- High-value claims (>₹1,00,000)
- Corporate priority clients
- Repeat submissions (documents added)
- Claims aged > 5 days

**MEDIUM (72-hour SLA)**
- Emergency/accident claims (≤₹1,00,000)
- Claims aged > 5 days (≤₹1,00,000)
- Standard hospitalization claims

**LOW (5-day SLA)**
- Regular OPD consultations (≤ 5 days old)
- Simple diagnostic claims
- Routine medication claims
- Follow-up consultations

#### Priority Escalation Factors:

**Member Status**
- VIP members get priority treatment
- Corporate priority clients have escalated handling
- Premium policy holders may receive faster processing

**Claim Characteristics**
- High-value claims always get priority
- Emergency medical situations are expedited
- Repeat submissions (after document requests) maintain context

**System Factors**
- Near SLA breach triggers automatic escalation
- Complaint escalations override normal priority
- Aging claims get priority boost

**Business Rules**
- Claims approaching SLA deadlines are auto-escalated
- Multiple document requests may increase priority
- Quality audits don't affect priority assignment

#### Assignment Strategy:

After priority is determined:
1. Match claim priority with TPA user capacity
2. Consider user expertise for complex claims
3. Balance workload across available users
4. Maintain continuity (same user for resubmissions)
5. Track performance metrics for optimization

---

## Appendix

### Common Rejection Codes Reference

| Code | Description | Policy Action |
|------|-------------|---------------|
| R001 | Policy expired/inactive | Verify policy dates |
| R002 | Service not covered | Check policy schedule |
| R003 | Pre-authorization not obtained | Verify pre-auth requirement |
| R004 | Out-of-network provider | Check network status |
| R005 | Filing limit exceeded | Verify filing deadline |
| R006 | Duplicate claim | Check claim history |
| R007 | Medical necessity not established | Review medical records |
| R008 | Waiting period not completed | Check policy start date |
| R009 | Pre-existing condition exclusion | Review medical history |
| R010 | Policy limit exceeded | Check annual/lifetime limits |
| R011 | Fraudulent claim | Investigate and report |
| R012 | Incomplete documentation | Request missing documents |

### Approval Calculation Example

```
Original Claimed Amount:              ₹50,000

Policy Details:
- Deductible (annual):                ₹2,000 (already met)
- Copay:                              10%
- Room Rent Limit:                    ₹2,000/day
- Policy Coverage:                     90% after copay

Calculation:
─────────────────────────────────────────────
Line Item Breakdown:

1. Room Charges (5 days × ₹3,000)     ₹15,000
   Eligible (5 days × ₹2,000)         ₹10,000
   Adjustment:                         ₹5,000 (Sublimit)

2. Doctor Consultation                ₹8,000
   Eligible:                          ₹8,000
   Adjustment:                        ₹0

3. Medicines                          ₹12,000
   Eligible:                          ₹12,000
   Adjustment:                        ₹0

4. Diagnostic Tests                   ₹10,000
   Eligible:                          ₹10,000
   Adjustment:                        ₹0

5. Nursing Charges                    ₹5,000
   Eligible:                          ₹5,000
   Adjustment:                        ₹0

─────────────────────────────────────────────
Total Claimed:                        ₹50,000
Total Eligible:                       ₹45,000
Less: Copay (10%):                    ₹4,500
─────────────────────────────────────────────
APPROVED AMOUNT:                      ₹40,500

Approval Type:                        PARTIAL
Reason:                              Room rent exceeds policy
                                     sublimit of ₹2,000/day
```

### Escalation Matrix

| Issue | First Contact | Second Contact | Final Escalation |
|-------|--------------|----------------|------------------|
| Complex medical decision | Senior TPA User | Medical Advisor | Chief Medical Officer |
| High-value claim (>₹5L) | TPA Admin | Operations Manager | Claims Director |
| Suspected fraud | TPA Admin | Fraud Prevention | Legal Team |
| Member complaint | TPA User | TPA Admin | Customer Service Head |
| SLA breach risk | TPA User | TPA Admin | Operations Manager |
| System/technical issue | TPA User | IT Support | IT Manager |
| Policy interpretation | Senior TPA User | Underwriting Team | Legal/Compliance |

---

### Decision Tree Quick Reference

**Use Claim Approval Decision Tree when:**
- Evaluating a claim for final decision
- Determining approval or rejection
- Calculating eligible amounts
- Documenting approval reasoning

**Use Document Completeness Tree when:**
- Initial claim review
- Verifying document requirements
- Requesting additional documents
- Ensuring quality standards

**Use Priority Assignment Tree when:**
- New claim enters system
- Assigning claims to TPA users
- Balancing workload
- Managing SLA compliance

---

**Document Version**: 1.0
**Last Updated**: 2025-10-05
**Next Review**: 2025-11-05

---
