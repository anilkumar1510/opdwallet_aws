# Admin Portal Documentation

## Overview

The Admin Portal is a comprehensive management interface for OPD Wallet administrators to manage users, policies, master data, and lab diagnostics services. It provides a centralized dashboard for system configuration and operational oversight.

**URL**: `/admin` (http://51.20.125.246/admin)

**Access Control**: Restricted to users with `ADMIN` or `SUPER_ADMIN` roles

**Primary Capabilities**:
- User and dependent management
- Policy and plan configuration
- Master data administration (categories, services, relationships, CUGs, specialties)
- Lab diagnostics ecosystem management
- System monitoring and analytics

---

## Dashboard

**Route**: `/admin`

**File**: `/web-admin/app/admin/page.tsx`

The main dashboard provides administrators with:

### Quick Actions
- Navigate to key management sections
- Access frequently used administrative functions
- View system health indicators

### Statistics Overview
- User registration metrics
- Active policy counts
- Lab service utilization
- Appointment analytics
- Revenue and transaction summaries

---

## User Management

Comprehensive CRUD operations for managing system users, their dependents, and role assignments.

### Key Features
- **User Creation**: Add new users with profile information
- **User Editing**: Update user details, contact information, and preferences
- **Dependent Management**: Link and manage dependent profiles under primary users
- **Role Assignment**: Assign and modify user roles (USER, ADMIN, SUPER_ADMIN)
- **User Deactivation**: Soft delete or deactivate user accounts
- **Search and Filtering**: Find users by name, email, phone, or role

### User Roles
- **USER**: Standard end-user with access to mobile app features
- **ADMIN**: Administrative access to portal features
- **SUPER_ADMIN**: Full system access with elevated privileges

---

## Policy Management

Create, configure, and version health insurance policies and plan configurations.

### Core Functions
- **Policy Creation**: Define new insurance policies with coverage details
- **Plan Configuration**: Set up plan tiers, benefits, and pricing
- **Version Control**: Manage policy versions and track changes over time
- **Coverage Rules**: Define eligibility, limits, and exclusions
- **Premium Settings**: Configure premium amounts and payment schedules

### Policy Lifecycle
1. Draft creation
2. Configuration and approval
3. Activation and publication
4. Versioning for updates
5. Archival or deactivation

---

## Master Data Management

Centralized management of core system reference data used across the platform.

### Categories (4 Active)
Reference data for service categorization and classification.

**Management Functions**:
- Create, edit, and deactivate categories
- Set display order and hierarchy
- Define category metadata

### Services (4 Active)
Service type definitions used in appointments and claims.

**Management Functions**:
- Add new service types
- Configure service properties
- Link services to categories

### Relationships (5 Active)
Dependent relationship types (e.g., Spouse, Child, Parent, Sibling, Other).

**Management Functions**:
- Define relationship types
- Set eligibility rules per relationship
- Configure age and dependency constraints

### CUGs - Closed User Groups (8 Active)
Corporate or group-based user segments.

**Management Functions**:
- Create CUG profiles
- Assign users to CUGs
- Configure group-specific benefits and pricing

### Specialties (9 Active)
Medical specialties for doctor categorization.

**Management Functions**:
- Add medical specialties
- Configure specialty descriptions
- Link to service offerings

---

## Lab Diagnostics Management

**NEW MAJOR SECTION** - Comprehensive management system for lab test services, vendor partnerships, pricing, and appointment scheduling.

### Overview
The Lab Diagnostics module enables end-to-end management of:
- Diagnostic test catalog
- Lab vendor partnerships
- Pricing configurations
- Time slot scheduling
- Home collection services

---

### Lab Services

**Route**: `/admin/lab/services`

**File**: `/web-admin/app/admin/lab/services/page.tsx`

**Purpose**: Manage the diagnostic test catalog available to users.

#### Service Categories
- **PATHOLOGY**: Blood tests, urine analysis, tissue examination
- **RADIOLOGY**: X-rays, CT scans, MRI, ultrasound
- **CARDIOLOGY**: ECG, stress tests, echocardiography
- **ENDOSCOPY**: Gastroscopy, colonoscopy, bronchoscopy
- **OTHER**: Miscellaneous diagnostic services

#### Service Attributes
- Service name and description
- Category classification
- Sample type (blood, urine, tissue, etc.)
- Preparation instructions for patients
- Turnaround time
- Test methodology
- Reference ranges
- Clinical significance

#### API Endpoints

```
POST   /api/admin/lab/services
GET    /api/admin/lab/services?category=&search=
GET    /api/admin/lab/services/:id
PATCH  /api/admin/lab/services/:id
DELETE /api/admin/lab/services/:id
```

#### Configuration Guide

**Creating a Lab Service**:
1. Navigate to `/admin/lab/services`
2. Click "Add New Service"
3. Enter service details:
   - Service name (e.g., "Complete Blood Count")
   - Select category (e.g., PATHOLOGY)
   - Add description and clinical use
   - Specify sample type
   - Add preparation instructions (e.g., "Fasting required for 8-12 hours")
4. Save and activate

**Best Practices**:
- Use clear, standardized test names
- Provide detailed preparation instructions
- Include clinical context for common tests
- Regularly review and update test information
- Maintain consistent naming conventions

---

### Lab Vendors

**Route**: `/admin/lab/vendors`

**File**: `/web-admin/app/admin/lab/vendors/page.tsx`

**Purpose**: Manage partnerships with diagnostic lab vendors.

#### Vendor Profile Information
- Vendor name and registration details
- Contact information (phone, email, address)
- Operating hours
- Accreditations and certifications
- Service capabilities
- Quality ratings

#### Serviceable Areas
- Pincode-based service coverage
- Geographic limitations
- Delivery radius for home collection

#### Home Collection Settings
- Home collection availability (enabled/disabled)
- Base home collection charges
- Additional charges by distance/zone
- Home collection time slots
- Sample handling protocols

#### API Endpoints

```
POST   /api/admin/lab/vendors
GET    /api/admin/lab/vendors
GET    /api/admin/lab/vendors/:id
PATCH  /api/admin/lab/vendors/:id
```

#### Configuration Guide

**Onboarding a Lab Vendor**:
1. Navigate to `/admin/lab/vendors`
2. Click "Add New Vendor"
3. Complete vendor profile:
   - Business name and registration number
   - Contact person and details
   - Operating hours (e.g., "Mon-Sat: 8AM-8PM, Sun: 9AM-5PM")
   - Certifications (NABL, CAP, ISO)
4. Configure service areas:
   - Add serviceable pincodes
   - Set service radius
5. Enable home collection if supported:
   - Set base charges
   - Define distance-based pricing tiers
6. Save and activate vendor

**Best Practices**:
- Verify vendor credentials before activation
- Maintain updated contact information
- Regularly audit service quality
- Monitor vendor performance metrics
- Update pincode coverage as vendors expand

---

### Vendor Pricing

**Route**: `/admin/lab/vendors/[vendorId]/pricing`

**File**: `/web-admin/app/admin/lab/vendors/[vendorId]/pricing/page.tsx`

**Purpose**: Configure service-specific pricing for each vendor.

#### Pricing Components
- **MRP (Maximum Retail Price)**: Standard list price
- **Discounted Price**: Actual price offered to users
- **Discount Percentage**: Calculated from MRP and discounted price
- **Home Collection Charge Override**: Vendor-specific home collection fees

#### Pricing Strategies
- Competitive pricing analysis
- Volume-based discounts
- Seasonal promotions
- Package pricing for test bundles

#### API Endpoints

```
POST   /api/admin/lab/vendors/:vendorId/pricing
GET    /api/admin/lab/vendors/:vendorId/pricing
PATCH  /api/admin/lab/vendors/:vendorId/pricing/:serviceId
```

#### Configuration Guide

**Setting Vendor Pricing**:
1. Navigate to vendor detail page
2. Select "Pricing" tab
3. For each service offered by the vendor:
   - Set MRP (reference price)
   - Set discounted price (user-facing price)
   - System auto-calculates discount percentage
4. Override home collection charges if needed (optional)
5. Save pricing configuration

**Bulk Pricing Operations**:
- Import pricing via CSV upload
- Apply percentage-based discounts across categories
- Copy pricing from similar vendors
- Schedule seasonal price updates

**Best Practices**:
- Ensure competitive pricing vs market rates
- Maintain pricing consistency across similar tests
- Document price change rationale
- Review and update prices quarterly
- Monitor competitor pricing trends
- Validate pricing before activation

---

### Vendor Slots

**Route**: `/admin/lab/vendors/[vendorId]/slots`

**File**: `/web-admin/app/admin/lab/vendors/[vendorId]/slots/page.tsx`

**Purpose**: Create and manage appointment time slots for lab services.

#### Slot Configuration
- **Date and Time**: Specific appointment windows
- **Pincode-Based Availability**: Slots vary by service area
- **Capacity Management**: Maximum bookings per slot
- **Duration**: Time allocated per appointment
- **Buffer Time**: Gap between consecutive appointments

#### Slot Types
- **In-Center Appointments**: Patients visit lab facility
- **Home Collection Slots**: Phlebotomist visits patient location
- **Express Slots**: Premium, faster service windows

#### API Endpoints

```
POST   /api/admin/lab/vendors/:vendorId/slots
GET    /api/admin/lab/vendors/:vendorId/slots?pincode=&date=
```

#### Configuration Guide

**Creating Vendor Slots**:
1. Navigate to vendor detail page
2. Select "Slots" tab
3. Define slot parameters:
   - Service type (in-center or home collection)
   - Date range (start and end date)
   - Time windows (e.g., "9:00 AM - 9:30 AM")
   - Days of week (Mon-Sun selection)
4. Set capacity:
   - Maximum bookings per slot
   - Current bookings (auto-updated)
5. Configure pincode availability:
   - Select serviceable pincodes for each slot
   - Enable/disable by location
6. Save slot configuration

**Recurring Slots**:
- Create weekly repeating patterns
- Set exceptions for holidays
- Bulk generate slots for multiple weeks
- Clone existing slot configurations

**Capacity Management**:
- Real-time booking count tracking
- Automatic slot closing when capacity reached
- Waitlist functionality for full slots
- Emergency slot override for urgent cases

**Best Practices**:
- Create slots aligned with vendor operating hours
- Allocate sufficient buffer time between appointments
- Monitor slot utilization rates
- Adjust capacity based on demand patterns
- Create more slots for high-demand pincodes
- Plan for seasonal demand fluctuations
- Block slots for maintenance or holidays
- Maintain 15-30 day advance booking window

---

## Navigation Structure

**Main Admin Layout**: `/web-admin/app/admin/layout.tsx`

### Primary Navigation Items ✨ UPDATED (v6.4)
1. **Dashboard**: Admin home and overview
2. **Users**: User and dependent management
3. **Policies**: Policy and plan administration
4. **Lab**: Lab diagnostics hub
5. **Services**: Service type management
6. **Categories**: Category administration

**ARCHITECTURAL CHANGE**: TPA and Finance portals have been moved to separate dedicated portals:
- **TPA Portal**: `/tpa/*` (Previously `/admin/tpa/*`)
- **Finance Portal**: `/finance/*` (Previously `/admin/finance/*`)
- **Operations Portal**: `/operations/*` (Unchanged)

This separation provides:
- **Role-Based Access**: Dedicated authentication per portal
- **Improved Performance**: Isolated routing and state management
- **Better Security**: Separate middleware and authorization
- **Enhanced UX**: Focused navigation per user role

### Lab Diagnostics Sub-Navigation
- **Lab Dashboard**: Lab module overview
- **Lab Services**: Test catalog management
- **Lab Vendors**: Vendor partnership management
- **Vendor Details**: Individual vendor configuration
  - Overview
  - Pricing
  - Slots

---

## API Reference

### Complete Lab Diagnostics API Endpoints

#### Lab Services
```
POST   /api/admin/lab/services
       Body: { name, category, description, sampleType, preparation }
       Response: Created service object

GET    /api/admin/lab/services?category=&search=
       Query: category (optional), search (optional)
       Response: Array of services with filtering

GET    /api/admin/lab/services/:id
       Params: id (service ID)
       Response: Single service detail

PATCH  /api/admin/lab/services/:id
       Params: id (service ID)
       Body: Partial service update
       Response: Updated service object

DELETE /api/admin/lab/services/:id
       Params: id (service ID)
       Response: Deletion confirmation
```

#### Lab Vendors
```
POST   /api/admin/lab/vendors
       Body: { name, contact, address, pincodes, homeCollection }
       Response: Created vendor object

GET    /api/admin/lab/vendors
       Query: search (optional)
       Response: Array of all vendors

GET    /api/admin/lab/vendors/:id
       Params: id (vendor ID)
       Response: Single vendor detail with services and stats

PATCH  /api/admin/lab/vendors/:id
       Params: id (vendor ID)
       Body: Partial vendor update
       Response: Updated vendor object
```

#### Vendor Pricing
```
POST   /api/admin/lab/vendors/:vendorId/pricing
       Params: vendorId
       Body: { serviceId, mrp, discountedPrice, homeCollectionCharge }
       Response: Created pricing record

GET    /api/admin/lab/vendors/:vendorId/pricing
       Params: vendorId
       Response: Array of all pricing for vendor

PATCH  /api/admin/lab/vendors/:vendorId/pricing/:serviceId
       Params: vendorId, serviceId
       Body: Partial pricing update
       Response: Updated pricing object
```

#### Vendor Slots
```
POST   /api/admin/lab/vendors/:vendorId/slots
       Params: vendorId
       Body: { date, startTime, endTime, pincode, capacity }
       Response: Created slot object

GET    /api/admin/lab/vendors/:vendorId/slots?pincode=&date=
       Params: vendorId
       Query: pincode (optional), date (optional)
       Response: Array of available slots with filtering
```

---

## Setup Instructions

### Initial Admin Portal Setup

1. **Environment Configuration**
   - Ensure admin routes are protected by authentication middleware
   - Configure role-based access control (RBAC)
   - Set up environment variables for admin features

2. **Database Initialization**
   - Run migrations for all admin-related tables
   - Seed initial master data (categories, services, relationships)
   - Create default admin user account

3. **Admin User Creation**
   - Register first SUPER_ADMIN user
   - Configure authentication credentials
   - Set up multi-factor authentication (recommended)

4. **Master Data Population**
   - Add all relationship types (Spouse, Child, Parent, Sibling, Other)
   - Configure service categories
   - Set up initial CUGs if applicable
   - Add medical specialties

### Lab Diagnostics Module Setup

1. **Service Catalog Creation**
   - Import standard lab tests by category
   - Configure test-specific attributes
   - Add preparation instructions

2. **Vendor Onboarding**
   - Register lab vendor partners
   - Verify credentials and certifications
   - Configure serviceable pincodes

3. **Pricing Configuration**
   - Set up pricing for each vendor-service combination
   - Apply discount strategies
   - Configure home collection charges

4. **Slot Management**
   - Generate initial slot templates
   - Create recurring slot patterns
   - Test booking workflow end-to-end

---

## Best Practices

### General Administration
- **Audit Logging**: Track all administrative actions for compliance
- **Regular Reviews**: Quarterly review of master data accuracy
- **Access Control**: Limit SUPER_ADMIN access to essential personnel
- **Backup Strategy**: Regular backups before bulk data operations
- **Testing Environment**: Test major changes in staging before production

### UI/UX Improvements ✨ RECENT
- **Modal Patterns**: Enhanced modal implementation with:
  - Proper backdrop overlay (z-40) with click-to-close
  - Centered modal content (z-50) with pointer-events management
  - Consistent close button behavior with aria-labels
  - Applied to: Categories, Services, User Management modals
- **Accessibility**: All modals include proper ARIA labels for screen readers
- **Responsive Design**: Modals adapt to mobile viewports with max-h-[90vh]

### Lab Diagnostics Management
- **Vendor Quality**: Monitor vendor performance metrics and user feedback
- **Pricing Competitiveness**: Regular market analysis to ensure competitive pricing
- **Slot Optimization**: Analyze booking patterns to optimize slot availability
- **Service Updates**: Keep test information current with medical standards
- **Pincode Coverage**: Expand service areas based on demand analytics

### Data Integrity
- **Validation Rules**: Enforce data quality at entry points
- **Duplicate Prevention**: Check for existing records before creation
- **Archival Policy**: Archive inactive records rather than deletion
- **Version Control**: Maintain change history for critical configurations
- **Referential Integrity**: Ensure proper relationships between linked data

### Performance Optimization
- **Caching Strategy**: Cache frequently accessed master data
- **Query Optimization**: Index commonly searched fields
- **Pagination**: Implement pagination for large data sets
- **Lazy Loading**: Load detailed data only when needed
- **Batch Operations**: Use bulk operations for mass updates

### Security Considerations
- **Role Verification**: Double-check role assignments before granting access
- **Sensitive Data**: Encrypt sensitive vendor and pricing information
- **Session Management**: Implement secure session timeouts
- **API Security**: Rate limiting and authentication for all admin APIs
- **Audit Trails**: Comprehensive logging of all administrative changes

---

## Troubleshooting

### Common Issues

**Unable to Access Admin Portal**
- Verify user has ADMIN or SUPER_ADMIN role
- Check authentication token validity
- Confirm route permissions in middleware

**Vendor Slots Not Appearing**
- Verify slot date is in the future
- Check pincode matches user location
- Confirm slot capacity not exceeded
- Ensure vendor is active

**Pricing Not Reflecting**
- Clear application cache
- Verify pricing record saved successfully
- Check for vendor-service mapping
- Confirm pricing is activated

**Service Creation Fails**
- Validate required fields completed
- Check for duplicate service names
- Verify category selection
- Review API error logs

### Support and Maintenance

For technical support or to report issues with the Admin Portal:
- Review application logs in `/logs` directory
- Check database connection and query performance
- Monitor API response times and error rates
- Contact system administrator for access-related issues

---

## Future Enhancements

### Planned Features
- Advanced analytics dashboard with charts and insights
- Bulk import/export functionality for master data
- Automated vendor performance scoring
- Dynamic pricing engine based on demand
- Multi-language support for international users
- Mobile app for admin on-the-go
- Integrated communication with vendors
- AI-powered test recommendations

### Under Consideration
- Vendor self-service portal for pricing updates
- Real-time slot availability notifications
- Automated report generation and scheduling
- Integration with third-party lab systems
- Telemedicine integration for test consultations

---

## Version History

- **v1.0**: Initial admin portal with user and policy management
- **v2.0**: Added lab diagnostics module with vendors, pricing, and slots
- **v2.1**: Enhanced master data management capabilities
- **Current**: Comprehensive lab ecosystem with full CRUD operations

---

## Related Documentation

- [Database Schema](./DATABASE.md) - Database structure and relationships
- [Appointment System](./APPOINTMENT_SYSTEM.md) - Appointment booking workflows
- [API Documentation](./API_REFERENCE.md) - Complete API reference (if available)
- [User Guide](./USER_GUIDE.md) - End-user application guide (if available)

---

**Last Updated**: 2025-10-05
**Maintained By**: OPD Wallet Development Team
**Document Version**: 2.1.0
