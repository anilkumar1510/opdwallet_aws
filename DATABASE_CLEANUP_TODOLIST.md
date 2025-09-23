# 🔧 DATABASE CLEANUP & SYSTEM OPTIMIZATION TODO LIST

**Generated:** September 20, 2025
**Status:** All items pending completion
**Priority:** Critical → High → Medium → Low

---

## 🚨 **CRITICAL PRIORITY (IMMEDIATE ACTION REQUIRED)**

### **Data Integrity Issues**

- [x] **#001** - ✅ Clean 17 orphaned plan versions (94.4% orphaned data)
- [x] **#002** - ✅ Clean 4 orphaned benefit components (80% orphaned data)
- [x] **#003** - ✅ Clean 4 orphaned wallet rules (80% orphaned data)
- [x] **#004** - ✅ Verify and fix user policy assignments data integrity
- [ ] **#005** - Populate benefitCoverageMatrix collection when policies are created (keeping empty for now)

### **Schema Definition Conflicts**

- [ ] **#006** - Resolve duplicate category_master schema definitions
  - `api/src/modules/categories/schemas/category.schema.ts`
  - `api/src/modules/masters/schemas/category-master.schema.ts`
- [ ] **#007** - Resolve benefitCoverageMatrix collection name mismatch
  - Schema 1: `benefitCoverageMatrix`
  - Schema 2: `benefit_coverage_matrix`
- [ ] **#008** - Choose primary service management system (service_types vs service_master)

---

## 🔥 **HIGH PRIORITY (THIS WEEK)**

### **Database Structure Optimization**

- [ ] **#009** - Decide fate of service_types collection (33 documents, unused by UI)
- [ ] **#010** - Decide fate of service_master collection (14 documents, unused by UI)
- [ ] **#011** - Consolidate or remove duplicate service code entries (CON001, CON002, PHA001, PHA002)
- [ ] **#012** - Clean up category_master duplicates (6 documents with conflicting data)
- [ ] **#013** - Analyze auditLogs usage and implement proper UI integration or remove
- [ ] **#014** - Review counters collection necessity (2 documents, no UI usage)

### **API Endpoint Cleanup**

- [ ] **#015** - Remove or document unused Categories Management API (6 endpoints)
- [ ] **#016** - Remove or document unused Services Management API (6 endpoints)
- [ ] **#017** - Remove or document unused User Management API (7 endpoints)
- [ ] **#018** - Remove or document unused Policy Management API (5 endpoints)
- [ ] **#019** - Remove or document unused Assignments Management API (6 endpoints)
- [ ] **#020** - Remove or document unused Plan Config Resolution API (3 endpoints)

---

## 🟡 **MEDIUM PRIORITY (THIS MONTH)**

### **Admin UI Completion**

- [ ] **#021** - Complete Policy Management UI integration with existing APIs
- [ ] **#022** - Complete User Management UI integration with existing APIs
- [ ] **#023** - Complete Service/Category Management UI integration
- [ ] **#024** - Connect Plan Version Configuration UI to backend APIs
- [ ] **#025** - Implement Benefits Configuration UI functionality
- [ ] **#026** - Implement Wallet Rules Configuration UI functionality
- [ ] **#027** - Implement Coverage Matrix Configuration UI functionality

### **Data Relationship Fixes**

- [ ] **#028** - Establish proper policy → planVersion → components → rules data flow
- [ ] **#029** - Implement cascade delete prevention for data integrity
- [ ] **#030** - Add foreign key validation in application layer
- [ ] **#031** - Create data consistency check scripts

---

## 🟢 **LOW PRIORITY (FUTURE OPTIMIZATION)**

### **Code Architecture Cleanup**

- [ ] **#032** - Remove backward compatibility properties in benefit-component.schema.ts (lines 108-115)
- [ ] **#033** - Standardize category naming across all collections
- [ ] **#034** - Implement single category system across all modules
- [ ] **#035** - Remove unused schema files after consolidation
- [ ] **#036** - Optimize database indexes for actual usage patterns

### **Performance & Monitoring**

- [ ] **#037** - Implement proper audit log integration in UI
- [ ] **#038** - Add data validation middleware for all endpoints
- [ ] **#039** - Create automated data integrity checks
- [ ] **#040** - Add monitoring for orphaned records
- [ ] **#041** - Implement proper error handling for data relationship failures

### **Documentation & Testing**

- [ ] **#042** - Document final API endpoint decisions (keep/remove)
- [ ] **#043** - Update schema documentation to reflect single source of truth
- [ ] **#044** - Create migration scripts for data cleanup
- [ ] **#045** - Add integration tests for admin UI functionality
- [ ] **#046** - Document data flow diagrams for all modules

---

## 📊 **COMPLETION TRACKING**

**Total Items:** 46
**Completed:** 0
**In Progress:** 0
**Pending:** 46

**Progress by Priority:**
- Critical: 0/8 (0%)
- High: 0/12 (0%)
- Medium: 0/11 (0%)
- Low: 0/15 (0%)

**Overall Progress: 0% Complete**

---

## 🎯 **NEXT ACTION**

**START WITH:** Item #001 - Clean 17 orphaned plan versions

**Command Ready:**
```bash
# First, backup current data
docker exec opd-mongo mongodump --db opd_wallet --out /backup

# Then clean orphaned plan versions
docker exec opd-mongo mongosh opd_wallet --eval "
  var validPolicyIds = db.policies.distinct('_id').map(id => id.toString());
  var result = db.planVersions.deleteMany({
    policyId: {\$nin: validPolicyIds.map(id => ObjectId(id))}
  });
  print('Deleted ' + result.deletedCount + ' orphaned plan versions');
"
```

**Estimated Impact:** Will clean 94.4% of orphaned data immediately.