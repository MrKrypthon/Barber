# CLAUDE.md

# Barber SaaS — AI Development Instructions

## 1. Project

Barber SaaS is a multi-tenant SaaS platform initially designed for:

- Barber shops
- Beauty salons
- Small service businesses

The product must be simple, fast and inexpensive to operate.

The primary users are small business owners and employees who may have limited technical knowledge.

The application must reduce administrative work instead of adding complexity.

---

# 2. Source of Truth

Before making significant changes, read the relevant documentation.

Main documentation:

```text
docs/PROJECT.md
docs/TECHNOLOGIES.md
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/API.md
docs/UI_UX.md
docs/DECISIONS.md
docs/ROADMAP.md
```

If documentation conflicts with existing code:

1. Identify the conflict.
2. Determine which document represents the most recent decision.
3. Do not silently change architecture.
4. Update the documentation when the implementation changes the documented behavior.

---

# 3. Technology Stack

The official stack is:

### Web

- Next.js
- React
- TypeScript
- Tailwind CSS

### Mobile

- React Native
- Expo
- TypeScript

### Backend

- Node.js
- NestJS
- TypeScript

### Database

- PostgreSQL
- Prisma

### Infrastructure

- Docker
- Docker Compose
- Nginx
- Oracle Cloud Free Tier

### Development

- pnpm
- Git
- GitHub

---

# 4. Core Architecture

The project uses a Modular Monolith architecture.

Do NOT introduce microservices unless explicitly requested.

The backend must remain modular.

Expected domains include:

```text
auth
tenants
users
customers
services
sales
cash
settings
notifications
```

Modules must have clear boundaries.

Avoid unnecessary coupling.

---

# 5. Multi-Tenancy

The application is multi-tenant.

Tenant isolation is a critical security requirement.

Every business-owned resource must be associated with a tenant.

Examples:

```text
Customer
Service
Sale
CashMovement
User
```

must belong to a tenant when applicable.

Never allow a user from tenant A to access data belonging to tenant B.

Tenant context must be established and validated on the backend.

Never trust a tenant ID supplied directly by the client.

---

# 6. Security

Security is a mandatory requirement.

Always consider:

- Authentication
- Authorization
- Tenant isolation
- Input validation
- Rate limiting
- Secure password hashing
- JWT security
- CORS
- CSRF where applicable
- Secrets management
- SQL injection
- XSS
- IDOR
- Broken access control

Never expose:

- Password hashes
- JWT secrets
- Database credentials
- API keys
- Environment secrets

Never commit secrets to Git.

---

# 7. Development Philosophy

Prefer:

```text
Simple
→ Explicit
→ Maintainable
→ Testable
```

over:

```text
Complex
→ Abstract
→ Clever
→ Over-engineered
```

Do not introduce abstractions unless they solve a real problem.

Do not add dependencies without a reason.

Do not add infrastructure because it might be useful in the future.

---

# 8. Forbidden Premature Complexity

Do not introduce the following unless explicitly requested or technically justified:

- Microservices
- Kubernetes
- Kafka
- Redis
- GraphQL
- Event sourcing
- CQRS
- Service mesh
- Complex caching layers

The MVP should remain small.

---

# 9. AI Autonomy

Claude Code is authorized to work autonomously on implementation tasks.

When a task is clearly defined, Claude should:

1. Analyze the existing code.
2. Read the relevant documentation.
3. Identify existing patterns.
4. Create an implementation plan.
5. Implement the change.
6. Run tests.
7. Run lint/type checks.
8. Fix errors.
9. Review the implementation.
10. Update documentation when necessary.
11. Provide a concise summary of the work.

Do not stop after every small implementation step asking for confirmation.

---

# 10. When Claude MUST Ask

Claude must stop and request confirmation when a decision could significantly affect the project.

Examples:

- Changing the technology stack.
- Changing the database engine.
- Changing the architecture.
- Introducing microservices.
- Changing the multi-tenant strategy.
- Changing authentication architecture.
- Removing major functionality.
- Introducing a paid infrastructure dependency.
- Making destructive database changes.
- Deleting significant amounts of code.
- Changing a documented product requirement.
- Introducing a major breaking API change.

For normal implementation decisions, Claude should make the simplest reasonable choice and continue.

---

# 11. Feature Development Workflow

For every feature:

```text
Understand
    ↓
Inspect
    ↓
Plan
    ↓
Implement
    ↓
Test
    ↓
Review
    ↓
Document
```

Before implementing:

- Inspect related modules.
- Search for existing functionality.
- Reuse existing components.
- Reuse existing services.
- Avoid duplicate logic.

---

# 12. Do Not Duplicate Code

Before creating:

- component
- hook
- service
- utility
- DTO
- validation schema

search the repository first.

If equivalent functionality exists, reuse it.

Do not create:

```text
CustomerForm
CustomerFormV2
CustomerFormNew
CustomerFormImproved
```

when the existing component can be extended.

---

# 13. Backend Rules

Use NestJS modules.

Use DTOs for API contracts.

Do not expose Prisma models directly through API responses.

Use services for business logic.

Controllers should remain thin.

Example:

```text
Controller
    ↓
Service
    ↓
Prisma
    ↓
PostgreSQL
```

Do not put complex business logic inside controllers.

---

# 14. API Rules

Use REST.

All API endpoints must be versioned.

Example:

```text
/api/v1/customers
/api/v1/services
/api/v1/sales
/api/v1/cash
```

Use appropriate HTTP methods.

Use consistent response and error structures.

Do not break existing API contracts without documenting the change.

---

# 15. Database Rules

Use PostgreSQL.

Use Prisma.

Database changes must use migrations.

Never manually modify the production schema.

Use UUIDs for primary identifiers unless there is a documented reason otherwise.

Use timestamps where appropriate:

```text
createdAt
updatedAt
```

Use database constraints for important integrity rules.

---

# 16. Frontend Rules

Use Next.js + React + TypeScript.

Use Tailwind CSS.

Use TanStack Query for server state.

Use React Hook Form + Zod for forms and validation.

Avoid Redux unless there is a demonstrated need.

Components should remain focused.

Avoid very large components.

Separate:

```text
UI
Data fetching
Business logic
```

when complexity requires it.

---

# 17. Mobile Rules

Use React Native + Expo.

The mobile application is a first-class application.

Do not simply reproduce the Web interface.

Use mobile-appropriate UX.

Share when appropriate:

- TypeScript types
- Validation
- API client
- Utilities

Do not force UI sharing between Web and Mobile.

---

# 18. UX Principles

The target user is a small business owner or employee.

The application should be usable without technical training.

Prioritize:

- Large touch targets.
- Clear labels.
- Minimal forms.
- Few steps.
- Fast actions.
- Obvious navigation.
- Clear feedback.

The most important flow is:

```text
Customer
    ↓
Service
    ↓
Payment
    ↓
Sale
```

This flow should be extremely fast.

---

# 19. Mobile First

All interfaces must work on:

- Mobile
- Tablet
- Desktop

Design mobile first.

Do not create separate applications for different screen sizes.

---

# 20. Offline

Offline functionality is a future requirement.

Do not implement a complex synchronization system unless explicitly requested.

When implementing offline functionality, prioritize:

- Sales
- Customers
- Services
- Cash movements

Synchronization must prevent duplicate transactions.

---

# 21. Testing

Do not aim for artificial 100% coverage.

Prioritize business-critical behavior.

Backend tests should prioritize:

- Authentication
- Authorization
- Tenant isolation
- Sales
- Cash
- Customers

Frontend tests should prioritize:

- Critical forms
- Validation
- Error states
- Main user flows

E2E tests should cover critical business workflows.

---

# 22. Quality Checks

Before considering a task complete, run the appropriate checks.

At minimum when applicable:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

For affected applications:

```bash
pnpm build
```

If a command does not exist, do not invent it.

Inspect `package.json` first.

Fix errors introduced by the implementation before reporting completion.

---

# 23. Git

Keep commits focused.

Do not mix unrelated changes.

Commit messages should clearly describe the change.

Examples:

```text
feat: add customer management
fix: prevent cross-tenant customer access
test: add sales service tests
refactor: simplify customer repository
docs: update database architecture
```

Never commit:

- `.env`
- secrets
- credentials
- generated temporary files
- local databases

---

# 24. Documentation

When implementation changes project behavior, update the relevant documentation.

Examples:

Architecture change:

```text
docs/ARCHITECTURE.md
docs/DECISIONS.md
```

Database change:

```text
docs/DATABASE.md
```

API change:

```text
docs/API.md
```

Technology change:

```text
docs/TECHNOLOGIES.md
```

Product requirement change:

```text
docs/PROJECT.md
docs/ROADMAP.md
```

Documentation must describe the current state.

---

# 25. Dependency Management

Before installing a dependency:

1. Check whether the functionality already exists.
2. Check whether the current stack provides a solution.
3. Consider bundle/runtime impact.
4. Consider maintenance.
5. Consider security.
6. Install only if justified.

Do not install libraries merely for convenience.

---

# 26. Infrastructure

Initial infrastructure:

```text
Oracle Cloud VPS
        ↓
Docker Compose
        ↓
Nginx
        ↓
Web + API + PostgreSQL
```

Keep infrastructure simple.

Do not introduce cloud services without a clear requirement.

The MVP must remain deployable on a single VPS.

---

# 27. Cost Control

The project is designed for small businesses with low budgets.

Infrastructure cost is therefore a product requirement.

Prefer:

- Open Source
- Self-hosting
- Free tiers
- Low-cost services
- Simple infrastructure

Avoid unnecessary recurring costs.

Any new paid service must be explicitly justified.

---

# 28. Product Philosophy

The product is not intended to be a large ERP.

The goal is:

```text
Simple
Fast
Affordable
Useful
```

Do not add functionality merely because competitors have it.

Every feature should solve a real problem.

---

# 29. MVP

The initial MVP should focus on:

```text
Authentication
Business / Tenant
Users
Customers
Services
Sales
Cash
Basic Dashboard
Business Settings
```

Initial payment methods:

```text
Cash
Bank Transfer
```

Do not implement card payments during the initial MVP.

---

# 30. Future Modules

Possible future modules:

```text
Appointments
WhatsApp
Inventory
Payments
Stripe
Mercado Pago
SAT Billing
Notifications
Analytics
AI
Multi-branch
Loyalty
Memberships
```

Do not implement future modules unless requested.

---

# 31. Working With Plugins and Skills

Use installed Claude Code plugins and Skills when they are relevant.

Examples:

- Feature development → feature-dev
- Code review → code-review
- Git commits → commit-commands
- Browser testing → Playwright
- Documentation lookup → Context7
- TypeScript navigation → TypeScript LSP

Do not use a plugin simply because it is available.

Use the simplest appropriate tool.

---

# 32. Working With Existing Code

Before modifying code:

1. Read the target file.
2. Search for usages.
3. Search related tests.
4. Search related types.
5. Understand dependencies.
6. Make the smallest appropriate change.

Do not rewrite entire files unnecessarily.

Do not refactor unrelated code during feature implementation.

---

# 33. Error Handling

When encountering an error:

```text
Read error
    ↓
Inspect relevant code
    ↓
Identify root cause
    ↓
Fix root cause
    ↓
Run tests
    ↓
Verify
```

Do not repeatedly apply random fixes.

Do not hide errors.

Do not disable tests merely to make them pass.

---

# 34. Final Verification

Before reporting a task as completed, verify:

- Implementation exists.
- Tests pass.
- TypeScript passes.
- Lint passes.
- Build passes when applicable.
- No secrets were added.
- No unrelated files were modified.
- Documentation is updated when necessary.

Then provide a concise summary:

```text
Implemented:
- ...

Tests:
- ...

Validation:
- ...

Documentation:
- ...

Potential follow-up:
- ...
```

---

# 35. Golden Rule

When uncertain:

```text
Do not make the system more complex.

Prefer the smallest correct solution.

Preserve the architecture.

Protect tenant isolation.

Keep the product simple.
```