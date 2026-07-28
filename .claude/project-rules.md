# OPD Wallet - Project Rules

**Last Updated:** July 28, 2026

---

## 📋 Project-Specific Rules

This file contains important rules and guidelines that Claude must follow when working on this project.

**CRITICAL: These rules MUST be followed for ALL work on this project.**

---

## 1. Security & Environment

**Context:** This is a TESTING PHASE project

- ❌ Security is NOT a priority during testing phase
- ✅ All credentials should be easily accessible for development
- ✅ ALL data in the system is TEST DATA
- ✅ Focus on functionality over security hardening
- ✅ Use simple, accessible authentication for testing

**Key Point:** Don't implement security measures that complicate testing. Security hardening comes later.

---

## 2. Code Quality & Maintainability

**Principle:** Write maintainable code without breaking existing structure

- ✅ Code MUST be maintainable for quick future changes
- ❌ **NEVER** break the original project structure
- ❌ DO NOT create unnecessary partial services or abstractions
- ✅ Every fix MUST be **ROBUST** - no superficial or abandoned fixes
- ✅ Follow existing code patterns in the project
- ❌ NO over-engineering or premature optimization

**Key Point:** Complete, robust solutions only. No half-fixes, no breaking structure.

---

## 3. Analysis Before Action

**Principle:** ALWAYS analyze thoroughly before making changes

- ✅ **REQUIRED:** Do THOROUGH analysis and planning before making ANY change
- ✅ Work like the best auditor and technical architect
- ✅ All assumptions and concerns MUST be validated against actual code with proof
- ✅ Do thorough research when necessary - never compromise on understanding
- ✅ Validate ALL assumptions with evidence (file reads, code inspection)
- ❌ NEVER make changes based on assumptions or guesses

**Key Point:** Analysis first, action second. No shortcuts. Validate everything with proof.

---

## 4. New Features & Services

**Principle:** Understand the full system context before adding features

- ✅ **REQUIRED:** Before creating any new service or page, review all existing API endpoints in documentation
- ✅ Understand the full system context before adding new components
- ✅ Check if similar functionality already exists
- ✅ Review related portal implementations (Member, Admin, Doctor, etc.)
- ✅ Check database schema for relevant collections
- ❌ DO NOT duplicate existing functionality
- ✅ Follow existing patterns for similar features

**Key Point:** Review existing APIs first. Understand system context before building new components.

---

## 5. Documentation Updates

**Principle:** Documentation must be updated with EVERY change

- ✅ **MANDATORY:** After completing ANY change, UPDATE the project documentation to reflect that change
- ✅ Documentation must always stay in sync with the codebase
- ✅ Update **existing** files in `/docs`:
  - API endpoint docs (`LATEST_API_ENDPOINTS_*.md`)
  - Frontend page docs (`LATEST_FRONTEND_PAGES_*.md`)
  - Portal documentation (`*_PORTAL.md`)
  - Main API reference (`API_REFERENCE.md`)
  - Database and configuration (`DATABASE_AND_CONFIG.md`)
  - Deferred work (`TECH_DEBT.md`)
  - React Native app (`member_portal_rn/`)
- ✅ Keep CHANGELOG.md updated with notable changes
- ✅ Document new features, API changes, and bug fixes
- ✅ If you add a NEW doc file, add it to `docs/README.md` — anything not in that index rots unnoticed

### ❌ Do NOT Create Per-Task Completion Documents

This rule means *update the docs*, not *write a report about your work*.

- ❌ NEVER create files like `PHASE1_*.md`, `*_FIX_COMPLETE.md`, `FIXES_APPLIED.md`,
  `IMPLEMENTATION_COMPLETE_SUMMARY.md`, `SESSION_*_SUMMARY.md`
- ❌ NEVER write a doc whose subject is "what I just did" — git history already records that
- ✅ Durable facts (how a feature works, endpoints, schema, config) go in the **existing** topic doc
- ✅ What changed and when goes in **CHANGELOG.md**
- ✅ Phase/progress trackers are temporary, like `PLAN.md` — delete them when the work is done

*(On 2026-07-28, 11 such files were deleted from `docs/member_portal_rn/` and `web-doctor/`.
They described work finished in January 2026, were linked from nothing, and had drifted so far
from the code that one screen checklist reported 3 of 63 screens built when 56 existed.)*

**Key Point:** Documentation must always reflect current code. Update existing docs — do not
add new files narrating completed work.

---

## 6. Handling Large Changes

**Principle:** Break down large tasks into manageable phases

- ✅ **REQUIRED:** For BIG changes, divide into multiple phases with a clear plan
- ✅ Complete each phase FULLY - never do partial implementations just because it's complex
- ✅ Plan first, then execute phase by phase until 100% complete
- ✅ Test each phase before proceeding
- ❌ DO NOT leave phases incomplete or abandoned
- ✅ Commit after each completed phase

**Workflow:**
1. Analyze and plan all phases
2. Execute phase 1 completely (code + docs + test)
3. Commit phase 1
4. Move to phase 2
5. Repeat until all phases are 100% complete

**Key Point:** Complete each phase fully. No partial or abandoned implementations.

---

## 7. Task Tracking with Plan File

**Principle:** Track multi-step tasks with a PLAN.md file

- ✅ **REQUIRED:** For any multi-step task, create a `PLAN.md` file in the project root
- ✅ Use a table format to track progress:

  ```markdown
  | #   | Task                | Status         |
  |-----|---------------------|----------------|
  | 1   | Feature description | Pending / Done |
  ```

- ✅ Mark each task as "Done" ONLY AFTER it is implemented AND tested
- ✅ Move to the next task ONLY after the current one is marked Done
- ✅ **CRITICAL:** Delete the `PLAN.md` file after ALL tasks are completed successfully

**Workflow:**
1. Create `PLAN.md` with all tasks listed
2. Mark task #1 as in progress
3. Complete task #1 (code + test + docs)
4. Mark task #1 as Done
5. Move to task #2
6. Repeat until all tasks Done
7. Delete `PLAN.md` file

**Key Point:** Plan file is temporary. Delete it only when everything is 100% complete.

---

## 8. Answering Questions - Plain English Only

**Principle:** Explain issues in simple English, not code snippets

- ✅ When answering questions, DO NOT provide code snippets
- ✅ Explain issues in plain, simple English with very short examples
- ✅ Keep answers summarized and to the point
- ✅ **CRITICAL:** ALL information must be verified through actual proof in the code
- ❌ Never assume or guess - always validate against the actual codebase first

**Good Example:**
"The login endpoint is at `/api/auth/login` and it expects email and password. I verified this in `api/routes/auth.js` line 45."

**Bad Example:**
```javascript
// Don't show code like this when answering questions
app.post('/api/auth/login', async (req, res) => { ... })
```

**Key Point:** Plain English explanations with proof. No code snippets in answers.

---

## 9. Testing Protocol

**Principle:** Comprehensive testing using browser automation and logs

**When Testing is Required:**
1. ✅ Use appropriate testing tools (browser automation, unit tests, etc.)
2. ✅ If test FAILS, check BOTH:
   - Backend logs
   - Frontend browser console logs
3. ✅ If logs are insufficient:
   - **FIRST** add detailed logging to cover all possible issues
   - **THEN** run the test again to validate
4. ✅ Never skip validation - every change must be verified

**Debugging Workflow:**
1. Reproduce issue in Chrome automation
2. Check frontend console logs
3. Check backend API logs
4. If logs insufficient, add detailed logging
5. Run test again with new logging
6. Fix the root cause
7. Verify fix in browser
8. Remove debug logging (or keep if useful)

**Key Point:** Test fails? Check both backend AND frontend logs. Add logging if needed.

---

## 🎯 Rule Priority

When rules conflict, follow this priority:

1. **Analysis Before Action** (Rule 3) - Always analyze first with proof
2. **Code Quality & Maintainability** (Rule 2) - Robust fixes, no breaking structure
3. **Testing Protocol** (Rule 9) - Verify it works, check all logs
4. **Documentation Updates** (Rule 5) - Keep docs in sync
5. **Task Tracking** (Rule 7) - Use PLAN.md for multi-step tasks
6. **Large Changes** (Rule 6) - Complete phases fully
7. **New Features** (Rule 4) - Understand system context
8. **Answering Questions** (Rule 8) - Plain English with proof
9. **Security & Environment** (Rule 1) - Keep it simple for testing

---

## 📋 Before Starting ANY Task

**Mandatory Checklist:**

- [ ] Read and understand these project rules
- [ ] Do THOROUGH analysis of existing code (work like best auditor/architect)
- [ ] Validate ALL assumptions with actual code proof
- [ ] Review existing API documentation for related features
- [ ] Understand full system context
- [ ] Plan the approach (create PLAN.md if multi-step task)
- [ ] Identify which documentation files need updating

---

## ✅ Before Completing ANY Task

**Mandatory Checklist:**

- [ ] Code changes are COMPLETE and ROBUST (no partial/abandoned fixes)
- [ ] Project structure NOT broken
- [ ] All related documentation UPDATED and in sync
- [ ] Changes TESTED (browser automation if UI, logs checked)
- [ ] Backend AND frontend logs checked (added logging if needed)
- [ ] No existing functionality broken
- [ ] Code follows existing patterns
- [ ] PLAN.md updated (mark task Done) OR deleted (if all tasks complete)
- [ ] CHANGELOG.md updated (if notable change)

---

**Note:** These rules are automatically loaded at the start of each Claude Code session via SessionStart hook.
