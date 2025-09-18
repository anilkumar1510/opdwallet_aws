# MongoDB Current Schema Report

## Database: opdwallet

### Collections Overview
**Total Collections Found: 4**
- users
- userPolicyAssignments
- policies
- counters

### Detailed Schema Analysis

## 1. Users Collection

### Sample Document Structure:
```javascript
{
  "_id": ObjectId("676330d1e87be039e1e991f2"),
  "employeeId": "1001",
  "firstName": "Raju",
  "lastName": "Kumar",
  "email": "raju.kumar@example.com",
  "phoneNumber": "9876543210",
  "role": "Member",
  "assignedPlan": "plan_id",
  "planVersion": "v1",
  "dependents": [
    {
      "name": "Sunita Kumar",
      "relationship": "Spouse",
      "dob": "1990-05-15",
      "_id": ObjectId("676330d1e87be039e1e991f3")
    },
    {
      "name": "Arjun Kumar",
      "relationship": "Child",
      "dob": "2015-08-20",
      "_id": ObjectId("676330d1e87be039e1e991f4")
    }
  ],
  "walletBalance": 50000,
  "status": "Active",
  "createdAt": ISODate("2024-12-18T21:51:29.506Z"),
  "updatedAt": ISODate("2024-12-18T21:51:29.506Z"),
  "__v": 0
}
```

### Indexes:
- `_id_` (default primary key index)
- `email_1` (unique index on email field)

## 2. UserPolicyAssignments Collection

### Sample Document Structure:
```javascript
{
  "_id": ObjectId("6763341f9e1b76f4bbbc6725"),
  "userId": ObjectId("676330d1e87be039e1e991f2"),
  "policyId": ObjectId("67633180e87be039e1e991f5"),
  "assignedAt": ISODate("2024-12-18T22:05:35.764Z"),
  "status": "Active",
  "walletBalance": 50000,
  "createdAt": ISODate("2024-12-18T22:05:35.765Z"),
  "updatedAt": ISODate("2024-12-18T22:05:35.765Z"),
  "__v": 0
}
```

### Indexes:
- `_id_` (default primary key index)
- `userId_1` (index on userId field)

## 3. Policies Collection

### Sample Document Structure:
```javascript
{
  "_id": ObjectId("67633180e87be039e1e991f5"),
  "policyCode": "POLICY001",
  "policyName": "Basic Health Plan",
  "policyType": "Health",
  "planVersion": "v1",
  "effectiveDate": ISODate("2024-01-01T00:00:00.000Z"),
  "expiryDate": ISODate("2024-12-31T23:59:59.000Z"),
  "basePremium": 5000,
  "walletAmount": 50000,
  "createdBy": ObjectId("676330d1e87be039e1e991f2"),
  "createdAt": ISODate("2024-12-18T21:54:24.648Z"),
  "updatedAt": ISODate("2024-12-18T21:54:24.648Z"),
  "__v": 0
}
```

### Indexes:
- `_id_` (default primary key index)
- `policyCode_1` (unique index on policyCode field)

## 4. Counters Collection

### Sample Document Structure:
Empty collection (no documents found)

### Indexes:
- `_id_` (default primary key index)

---

## Comparison with Documentation

### Collections Status:

#### ✅ Implemented (4/14):
1. **users** - Fully implemented with all documented fields
2. **policies** - Implemented with core fields
3. **userPolicyAssignments** - Implemented as junction table
4. **counters** - Collection exists but empty

#### ❌ Not Implemented (10/14):
1. **claims** - Missing entirely
2. **transactions** - Missing entirely
3. **appointments** - Missing entirely
4. **planVersions** - Missing entirely
5. **benefitComponents** - Missing entirely
6. **walletRules** - Missing entirely
7. **categories** - Missing entirely
8. **serviceTypes** - Missing entirely
9. **benefitCoverageMatrix** - Missing entirely
10. **auditLogs** - Missing entirely

### Key Observations:

1. **Implementation Status**: Only ~29% of documented collections are implemented (4 out of 14)

2. **Core Functionality Present**:
   - User management system is operational
   - Policy assignment system is working
   - Basic wallet balance tracking exists

3. **Missing Critical Features**:
   - No claims processing system
   - No transaction history tracking
   - No appointment scheduling
   - No audit logging
   - No benefit coverage tracking

4. **Data Integrity**:
   - Proper indexes on email (unique) and policyCode (unique)
   - Foreign key relationships maintained through ObjectIds
   - Timestamps (createdAt/updatedAt) properly tracked

5. **Schema Deviations**:
   - Users collection has additional fields not in documentation (planVersion, assignedPlan)
   - Policies collection structure differs from documented schema
   - userPolicyAssignments exists but was not explicitly documented as separate collection

### Summary:
The current MongoDB implementation represents a minimal viable product (MVP) with only the essential collections for basic user and policy management. The majority of the advanced features documented in the architecture (claims, transactions, appointments, benefits) have not been implemented yet.