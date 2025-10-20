# Freelancer Job Postings - OPD Wallet Project

These job descriptions can be posted immediately on Upwork, Toptal, LinkedIn, or other freelance platforms upon budget approval.

---

## Job Posting 1: Senior Full-Stack Developer (NestJS + Next.js)

### Job Title
**Senior Full-Stack Developer - Healthcare Platform (8-week contract)**

### Job Description

We're seeking an experienced full-stack developer to complete the final 5% of our enterprise healthcare management platform (OPD Wallet). The platform is 95% complete, actively deployed, and needs critical security hardening + feature completion before client onboarding.

**Project Overview:**
- **Tech Stack:** NestJS (backend), Next.js 15 (3 frontends), MongoDB, TypeScript
- **Current State:** 95% complete, live deployment, 28 database collections, 15+ modules operational
- **Duration:** 8 weeks, full-time (40 hours/week)
- **Start Date:** Immediate
- **Working Hours:** Flexible, with 2-3 hour overlap with IST timezone for daily standups

### Responsibilities

**Weeks 1-2: Security Hardening (CRITICAL)**
- Remove all hardcoded credentials from codebase
- Generate and implement strong JWT secrets using AWS Secrets Manager
- Enable MongoDB authentication with role-based access control
- Enforce HTTPS with automatic HTTP redirects
- Sanitize/remove 355+ console.log statements containing sensitive data
- Set up production monitoring (Sentry/CloudWatch)

**Weeks 3-5: Health Records Implementation**
- Design and implement health records schema (documents, lab reports, prescriptions archive)
- Create CRUD API endpoints (upload, view, download, delete)
- Integrate AWS S3 for secure document storage
- Connect backend APIs to existing frontend UI
- Implement proper access controls (user can only view their own records)

**Weeks 6-8: Code Quality & Launch Preparation**
- Remove all TypeScript 'any' types, add proper type definitions
- Standardize error handling across all controllers
- Implement soft deletes for all entities
- Add MongoDB transactions for critical operations (wallet, claims)
- Fix N+1 query problems using aggregation pipelines
- Production deployment checklist completion

### Required Skills & Experience

**Must Have:**
- 5+ years full-stack development experience
- Expert-level NestJS (modules, services, controllers, guards, interceptors)
- Expert-level Next.js (App Router, server components, API routes)
- Strong TypeScript skills (generics, advanced types, no 'any' philosophy)
- MongoDB + Mongoose (schema design, aggregations, indexes)
- RESTful API design and implementation
- AWS services (EC2, S3, Secrets Manager)
- Git version control (GitHub workflow)
- Security best practices (OWASP Top 10)
- JWT authentication and authorization

**Nice to Have:**
- Healthcare/HealthTech domain experience
- Experience with Redis caching
- Docker and Docker Compose
- Nginx configuration
- CI/CD pipelines
- Experience completing 90%+ done projects

### Project Details

**Codebase Stats:**
- Backend: ~25,000 lines of TypeScript (NestJS)
- Frontends: ~35,000 lines (3 Next.js apps)
- Database: 28 collections with comprehensive relationships
- Documentation: 1,200+ pages (architecture, schema, API docs)
- Recent activity: 98 commits in last 3 months

**What You'll Work With:**
- Well-structured NestJS modules (auth, users, policies, appointments, claims, labs, video-consultations)
- Next.js frontals with Tailwind CSS and Radix UI
- MongoDB with 28 collections (users, policies, appointments, claims, etc.)
- AWS deployment on EC2 with Nginx reverse proxy
- Comprehensive documentation (you won't be flying blind)

### Deliverables

1. **Week 2 Milestone:** Security audit passed, all vulnerabilities fixed
2. **Week 5 Milestone:** Health Records fully functional (backend + frontend integration)
3. **Week 8 Milestone:** Production-ready checklist complete, ready for client onboarding

### Budget

**Rate:** $40-50/hour
**Total Hours:** 320 hours (40 hours/week × 8 weeks)
**Total Budget:** $12,800 - $16,000

**Payment Milestones:**
- 25% upon completion of Week 2 (Security hardening)
- 35% upon completion of Week 5 (Health Records)
- 40% upon completion of Week 8 (Production launch)

### Application Requirements

Please include in your proposal:
1. Your experience with NestJS and Next.js (provide GitHub repos or live projects)
2. Your approach to the security hardening tasks (how would you tackle this?)
3. Your availability (start date, hours per week)
4. 2-3 references from similar projects
5. Your timezone and preferred overlap hours with IST

**We will prioritize candidates who:**
- Can start immediately
- Have completed similar "last 10%" projects
- Can demonstrate security expertise
- Have healthcare/HealthTech experience

---

## Job Posting 2: QA/Testing Engineer (Part-time, 4 weeks)

### Job Title
**QA Engineer - Automated Testing for Healthcare Platform (4-week contract)**

### Job Description

We need an experienced QA engineer to build a comprehensive automated testing suite for our healthcare management platform. The platform is feature-complete and needs testing before production launch.

**Project Overview:**
- **Tech Stack:** NestJS (backend), Next.js (frontends), MongoDB
- **Scope:** Unit tests, integration tests, E2E tests
- **Duration:** 4 weeks, part-time (20 hours/week)
- **Start Date:** Week 3 of main project (can start immediately if available earlier)

### Responsibilities

**Week 1: Test Strategy & Setup**
- Review codebase and architecture documentation
- Define testing strategy and coverage goals
- Set up testing frameworks (Jest, Supertest, Playwright/Cypress)
- Create test data fixtures and database seeding scripts

**Week 2: Unit & Integration Tests**
- Write unit tests for critical services (target: 80% coverage)
  - User service, Policy service, Appointment service, Claims service
- Write integration tests for API endpoints (all 70+ endpoints)
- Set up continuous integration (GitHub Actions)

**Week 3: E2E Tests**
- Write end-to-end tests for critical user flows:
  - User registration and login
  - Appointment booking (in-clinic and online)
  - Claims submission and approval
  - Lab diagnostics workflow
- Set up E2E testing environment

**Week 4: Load Testing & Documentation**
- Perform load testing (target: 1000 concurrent users)
- Identify performance bottlenecks
- Document testing procedures and CI/CD integration
- Train team on running and maintaining tests

### Required Skills

**Must Have:**
- 3+ years QA/testing experience
- Expert in Jest, Supertest (for Node.js/NestJS)
- Expert in Playwright or Cypress (E2E testing)
- Experience with load testing tools (k6, JMeter, Artillery)
- API testing (REST, Postman/Insomnia)
- Test automation and CI/CD integration
- MongoDB test data management

**Nice to Have:**
- Healthcare/HealthTech testing experience
- Security testing (OWASP ZAP)
- Performance testing and optimization

### Deliverables

1. **Week 1:** Test strategy document + framework setup
2. **Week 2:** 80% unit test coverage + integration tests for all endpoints
3. **Week 3:** E2E tests for 5 critical user flows
4. **Week 4:** Load test report + testing documentation

### Budget

**Rate:** $25-35/hour
**Total Hours:** 80 hours (20 hours/week × 4 weeks)
**Total Budget:** $2,000 - $2,800

---

## Job Posting 3: DevOps Engineer (Part-time, 4 weeks)

### Job Title
**DevOps Engineer - Production Hardening & Monitoring (4-week contract)**

### Job Description

We're seeking a DevOps engineer to harden our production deployment, set up monitoring, and implement best practices for a healthcare platform launching to enterprise clients.

**Project Overview:**
- **Current Setup:** AWS EC2 (t3.medium), Docker Compose, Nginx, MongoDB
- **Scope:** Production hardening, monitoring, backup strategy, CI/CD
- **Duration:** 4 weeks, part-time (10 hours/week)

### Responsibilities

**Week 1: Production Audit & Security**
- Audit current AWS infrastructure
- Implement AWS Secrets Manager for all credentials
- Set up VPC with proper security groups
- Enable MongoDB encryption at rest
- SSL/TLS certificate management (Let's Encrypt auto-renewal)

**Week 2: Monitoring & Alerting**
- Set up Sentry for error tracking
- Configure AWS CloudWatch for logs and metrics
- Implement custom dashboards (API response times, database queries, error rates)
- Set up alerts for critical events (high error rate, high CPU, disk space)

**Week 3: Backup & Disaster Recovery**
- Implement automated MongoDB backups (daily to S3)
- Create restore procedures and test them
- Document disaster recovery plan
- Set up staging environment for testing

**Week 4: CI/CD Pipeline**
- Set up GitHub Actions for automated testing
- Implement automated deployment to staging
- Create deployment checklist for production
- Document infrastructure and runbooks

### Required Skills

**Must Have:**
- 3+ years DevOps experience
- AWS expertise (EC2, S3, CloudWatch, Secrets Manager, VPC)
- Docker and Docker Compose
- Nginx configuration and optimization
- MongoDB operations (backup, restore, replication)
- CI/CD pipelines (GitHub Actions preferred)
- Infrastructure as Code (Terraform or CloudFormation)

**Nice to Have:**
- Healthcare compliance experience (HIPAA)
- Kubernetes (for future scaling)
- Log aggregation (ELK stack)

### Budget

**Rate:** $35-45/hour
**Total Hours:** 40 hours (10 hours/week × 4 weeks)
**Total Budget:** $1,400 - $1,800

---

## Hiring Process

### Step 1: Application Review (1-2 days)
- Review proposals and portfolios
- Check references
- Shortlist 3-5 candidates per role

### Step 2: Technical Screening (30 minutes)
- Video call to assess technical knowledge
- Discuss approach to the project
- Review relevant experience

### Step 3: Technical Test (2-3 hours)
**For Senior Developer:**
- Fix a security vulnerability in sample code
- Implement a simple CRUD endpoint in NestJS
- Write unit tests for the endpoint

**For QA Engineer:**
- Review sample code and create test strategy
- Write sample unit and integration tests
- Demonstrate E2E testing approach

**For DevOps Engineer:**
- Review current infrastructure and suggest improvements
- Write a simple CI/CD pipeline configuration
- Propose monitoring strategy

### Step 4: Final Interview (30 minutes)
- Discuss project timeline and milestones
- Clarify expectations and deliverables
- Negotiate rate (if needed)
- Confirm availability and start date

### Step 5: Onboarding (1-2 days)
- NDA signing
- GitHub repository access
- AWS credentials (limited scope)
- Documentation review
- Environment setup
- Kickoff meeting with stakeholders

---

## Alternative: Hiring Platforms

### Recommended Platforms

**For Senior Developers:**
1. **Toptal** - Pre-vetted talent, higher rates ($60-200/hour)
2. **Upwork** - Large pool, more affordable ($40-80/hour)
3. **Gun.io** - Vetted freelancers, mid-range rates
4. **We Work Remotely** - Remote-first developers
5. **LinkedIn** - Direct outreach to qualified candidates

**For QA Engineers:**
1. **Upwork** - Best for QA talent at reasonable rates
2. **Fiverr Pro** - Vetted QA professionals
3. **Freelancer.com** - Large pool of testers

**For DevOps:**
1. **Toptal** - Pre-vetted DevOps experts
2. **Upwork** - Good selection of DevOps freelancers
3. **AWS Partner Network** - AWS-certified consultants

---

## Budget Summary for Hiring

| Role | Rate | Hours | Total |
|------|------|-------|-------|
| Senior Full-Stack Developer | $40-50/hr | 320 hrs | $12,800-16,000 |
| QA Engineer | $25-35/hr | 80 hrs | $2,000-2,800 |
| DevOps Engineer | $35-45/hr | 40 hrs | $1,400-1,800 |
| **Total** | | 440 hrs | **$16,200-20,600** |

**Platform Fees (Upwork/Toptal):** Add 10-20% for platform fees
**Final Budget:** $17,820 - $24,720 (with platform fees)

---

## Tips for Successful Hiring

1. **Post on multiple platforms simultaneously** - Don't wait for one platform to work out
2. **Respond quickly** - Best candidates get snapped up within 24-48 hours
3. **Be specific in requirements** - Vague job posts attract unqualified applicants
4. **Pay market rate** - Lowballing attracts lower-quality candidates
5. **Check references** - Always call 2-3 references before hiring
6. **Start with small paid test** - Before committing to full contract
7. **Use milestones** - Protect your budget with milestone-based payments
8. **Have backup candidates** - Things can go wrong; always have a Plan B

---

**These job postings are ready to use immediately upon budget approval.**
