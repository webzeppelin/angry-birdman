# Angry Birdman - Specification Index

This directory contains comprehensive specifications for the Angry Birdman clan
management system. All specifications serve as the source of truth for
implementation and should be consulted throughout development.

---

## Specification Documents

### [high-level-spec.md](high-level-spec.md)

**Purpose**: Complete system specification defining the what and why of Angry
Birdman

**Description**: The primary specification document covering purpose,
requirements, data model, calculations, and technical requirements. This
document defines what needs to be built and provides the foundation for all
other specifications.

**Key Sections**:

1. Purpose - System goals and objectives
2. Glossary of Key Concepts - Domain terminology (FP, Ratio Score, CvC battles,
   etc.)
3. User Personas - Anonymous, Clan Admin, Clan Owner, Superadmin
4. User Experience Objectives - Design and efficiency goals
5. User Epics - Seven epics covering all functional areas
6. Data Concepts - Complete data model with all entities and fields
7. Data Calculations - Precise formulas for all calculated fields
8. Tech Requirements - Technology stack overview
9. Architecture - Three-tier application structure
10. Performance Requirements - Scalability and reliability expectations
11. Security Requirements - Authentication and data protection
12. Development Requirements - Coding standards and practices

**Use Cases**:

- Understanding business requirements
- Defining data structures and relationships
- Implementing calculation logic
- Making architectural decisions

---

### [user-experience-specs.md](user-experience-specs.md)

**Purpose**: Comprehensive UX specification defining how users interact with the
system

**Description**: Detailed user experience design covering personas, user
journeys, UI components, screen specifications, design system, and interaction
patterns. This document ensures consistent, accessible, and efficient user
interfaces.

**Key Sections**:

1. User Personas - Detailed profiles of Anonymous Users, Clan Admins, Clan
   Owners, Superadmins
2. User Journey - Complete workflows from landing page to data entry
3. Global UI Components - Navigation, headers, footers, modals, notifications
4. Screen Specifications - Detailed specs for all major screens
5. Design System - Colors, typography, spacing, components
6. Accessibility Guidelines - WCAG compliance and keyboard navigation
7. Responsive Design Guidelines - Mobile, tablet, desktop breakpoints
8. Interaction Patterns - Forms, tables, filters, navigation

**Use Cases**:

- Designing user interfaces
- Implementing frontend components
- Ensuring accessibility compliance
- Creating consistent user experiences

---

### [epics-and-stories.md](epics-and-stories.md)

**Purpose**: User stories organized by epic with acceptance criteria

**Description**: Comprehensive breakdown of functionality into seven epics
containing detailed user stories. Each story includes the user role, desired
action, benefit, and acceptance criteria. This document translates requirements
into implementable features.

**Key Sections** (7 Epics):

**Epic 1: General and Navigation** (12 stories)

- Landing page, navigation menus, clan selection, authentication

**Epic 2: User and Clan Management** (17 stories)

- Account registration, profile management, clan registration, admin requests,
  permissions, audit logging

**Epic 3: Maintain Clan Roster** (9 stories)

- View roster, add/edit players, record departures/kicks, player history, bulk
  import

**Epic 4: Record Clan Battle Data** (11 stories)

- Battle entry workflow, metadata, performance data, player stats, action codes,
  validation, drafts

**Epic 5: View Clan Battle Stats** (10 stories)

- Battle overview, clan performance, opponent data, player rankings, non-player
  tracking

**Epic 6: View Rolled-Up Monthly and Yearly Stats** (8 stories)

- Monthly/yearly clan summaries, individual player aggregates, trend comparison

**Epic 7: Analyze and Visualize Clan Data** (6 stories)

- Flock power trends, ratio analysis, participation tracking, margin analysis

**Use Cases**:

- Sprint planning and estimation
- Feature implementation roadmap
- Acceptance testing
- Understanding user needs

---

### [technology-plan.md](technology-plan.md)

**Purpose**: Comprehensive documentation of technology stack and architectural
decisions

**Description**: In-depth technical specification covering every technology
choice, configuration details, integration patterns, and rationale. This
document ensures developers understand the complete technology landscape and how
components work together.

**Key Sections**:

1. Overview - Technology philosophy and three-tier architecture
2. Frontend Stack - React, Vite, TypeScript, state management, routing, styling
3. API/Backend Stack - Node.js, Fastify, authentication, session management
4. Common Library - Shared code between frontend and backend
5. Database & Data Layer - PostgreSQL, Prisma ORM, data access patterns
6. Authentication & Authorization - Keycloak, JWT, OAuth2 flows
7. Infrastructure & DevOps - Docker, CI/CD, version control
8. Development Tools - Editors, linting, formatting, package management
9. Observability & Monitoring - Logging, error tracking, metrics
10. Architecture Patterns - Layered architecture, state management, design
    patterns
11. Security Stack - HTTPS, headers, CORS, rate limiting, validation
12. Testing Strategy - Unit, integration, E2E testing approaches

**Use Cases**:

- Understanding technology choices and rationale
- Configuring development environments
- Implementing architectural patterns
- Making technology decisions

---

### [implementation-plan.md](implementation-plan.md)

**Purpose**: Detailed 12-week implementation strategy with actionable steps

**Description**: Step-by-step plan for implementing Angry Birdman across three
functional phases. Each step includes scope, deliverables, and validation
criteria. This document serves as the primary roadmap for development.

**Key Sections**:

1. Overview - Implementation strategy, dependencies, success criteria
2. Environment Setup - Docker infrastructure, database schema, Keycloak
   configuration
3. Project Structure Initialization - Monorepo setup, common library, API
   foundation, frontend foundation
4. Development Tooling Setup - Testing frameworks, code quality tools,
   development scripts
5. Phase 1: Core Foundation (Weeks 1-4)
   - Epic 1: Navigation and General UI (Stories 1.1-1.12)
   - Epic 2: User and Clan Management (Stories 2.1-2.17)
   - Epic 3: Core Roster Management (Stories 3.1-3.7)
6. Phase 2: Data Entry (Weeks 5-7)
   - Epic 4: Battle Data Recording (Stories 4.1-4.11)
   - Advanced Roster Features (Stories 3.8-3.9)
7. Phase 3: Viewing & Analysis (Weeks 8-11)
   - Epic 5: Battle Statistics (Stories 5.1-5.10)
   - Epic 6: Monthly/Yearly Statistics (Stories 6.1-6.8)
   - Epic 7: Analytics and Reporting (Stories 7.1-7.6)
8. Testing & Quality Assurance - Comprehensive testing strategy
9. Documentation & Deployment Preparation - Final documentation and deployment
   setup

**Use Cases**:

- Planning development sprints
- Tracking implementation progress
- Understanding task dependencies
- Estimating effort and timeline

---

### [implementation-status.md](implementation-status.md)

**Purpose**: Living document tracking implementation progress

**Description**: Status tracking document mirroring the implementation plan
structure. Uses visual indicators (🔴 Not Started, 🟡 In Progress, 🟢 Complete,
🔵 Blocked, ⚠️ Issues) and checkboxes to track completion. Updated as work
progresses.

**Key Sections**:

- Overall Progress - High-level completion percentage and timeline
- Environment Setup Status - Infrastructure readiness
- Project Structure Status - Codebase organization progress
- Development Tooling Status - Tool configuration completion
- Phase 1 Status - Core Foundation implementation progress
- Phase 2 Status - Data Entry implementation progress
- Phase 3 Status - Viewing & Analysis implementation progress
- Testing Status - Test coverage and quality metrics
- Next Steps - Immediate priorities and blockers

**Use Cases**:

- Daily standup updates
- Sprint reviews
- Progress reporting
- Identifying blockers and bottlenecks

---

## Database Documentation

### [../database/postgres/README.md](../database/postgres/README.md)

**Purpose**: Complete PostgreSQL database schema documentation

**Description**: Technical documentation for the database layer including schema
structure, table definitions, relationships, indexes, constraints, setup
instructions, and maintenance procedures.

**Key Sections**:

1. Files - Schema, seed data, README
2. Database Overview - Design principles and structure
3. Schema Structure - All tables organized by category
4. Key Relationships - Entity relationship diagram
5. Data Validation Rules - Format rules, calculations, constraints
6. Indexes - Query optimization strategy
7. Triggers - Automatic timestamp updates
8. Initial Setup - Step-by-step installation
9. Docker Setup - Container configuration
10. Connection Strings - Database connection examples
11. Prisma Integration - ORM setup and usage
12. Maintenance - Backup, restore, migrations
13. Performance Considerations - Optimization and monitoring
14. Security - User permissions and audit logging
15. Troubleshooting - Common issues and solutions

**Use Cases**:

- Database setup and configuration
- Understanding data model implementation
- Writing database queries
- Troubleshooting database issues

---

## Using the Specifications

### For Developers

1. **Start with [high-level-spec.md](high-level-spec.md)** to understand the
   system requirements and data model
2. **Review [technology-plan.md](technology-plan.md)** to understand the
   technology stack and architectural decisions
3. **Consult [user-experience-specs.md](user-experience-specs.md)** when
   implementing UI components
4. **Reference [epics-and-stories.md](epics-and-stories.md)** for detailed
   feature requirements and acceptance criteria
5. **Follow [implementation-plan.md](implementation-plan.md)** for step-by-step
   implementation guidance
6. **Update [implementation-status.md](implementation-status.md)** as work
   progresses

### For Product Owners

1. **Start with [high-level-spec.md](high-level-spec.md)** Section 5 (User
   Epics) for feature overview
2. **Review [epics-and-stories.md](epics-and-stories.md)** for detailed user
   stories and acceptance criteria
3. **Consult [user-experience-specs.md](user-experience-specs.md)** for UX
   design decisions
4. **Track progress in [implementation-status.md](implementation-status.md)**

### For UX Designers

1. **Start with [user-experience-specs.md](user-experience-specs.md)** for
   complete UX guidelines
2. **Reference [high-level-spec.md](high-level-spec.md)** Section 4 (User
   Experience Objectives)
3. **Consult [epics-and-stories.md](epics-and-stories.md)** for user story
   context and acceptance criteria

### For Database Administrators

1. **Start with
   [../database/postgres/README.md](../database/postgres/README.md)** for
   complete database documentation
2. **Reference [high-level-spec.md](high-level-spec.md)** Section 6 (Data
   Concepts) for business context
3. **Review [high-level-spec.md](high-level-spec.md)** Section 7 (Data
   Calculations) for calculation formulas

### For DevOps Engineers

1. **Start with [technology-plan.md](technology-plan.md)** Section 7
   (Infrastructure & DevOps)
2. **Review [implementation-plan.md](implementation-plan.md)** Section 2
   (Environment Setup)
3. **Reference [technology-plan.md](technology-plan.md)** Section 6
   (Authentication & Authorization) for Keycloak setup

---

## Specification Maintenance

### Keeping Specs Current

- **Implementation should track specifications** - If implementation approach
  changes, update specs first
- **Document decisions** - Capture architectural and design decisions in
  appropriate spec files
- **Update status regularly** - Keep implementation-status.md current with
  actual progress
- **Version control** - All spec changes should be committed with descriptive
  messages

### Spec Change Process

1. Identify need for specification change
2. Update affected specification document(s)
3. Review impact on other specifications
4. Update cross-references if needed
5. Communicate changes to team
6. Commit with descriptive message referencing issue/story

---

## Quick Reference

### Common Calculations (high-level-spec.md Section 7)

- **Clan Ratio**: `(score / baselineFp) * 1000`
- **Average Ratio**: `(score / fp) * 1000`
- **Player Ratio**: `(score / fp) * 1000`
- **Margin Ratio**: `((score - opponentScore) / score) * 100`
- **FP Margin**: `((baselineFp - opponentFp) / baselineFp) * 100`

### ID Formats (high-level-spec.md Section 6)

- **Battle ID**: `YYYYMMDD` (e.g., "20251101")
- **Month ID**: `YYYYMM` (e.g., "202511")
- **Year ID**: `YYYY` (e.g., "2025")

### User Roles (high-level-spec.md Section 3)

- **Anonymous**: Read-only access to all data
- **Clan Admin**: Manage roster and battles for their clan
- **Clan Owner**: Clan Admin + ownership management
- **Superadmin**: Full system access across all clans

### Technology Stack Summary (technology-plan.md Section 1)

- **Frontend**: React 18+, Vite 5+, TypeScript 5+, Tailwind CSS 3+
- **Backend**: Node.js 20 LTS+, Fastify 4+, TypeScript 5+
- **Database**: PostgreSQL 15+, Prisma ORM 5+
- **Auth**: Keycloak 23+, JWT tokens
- **Cache**: Valkey (Redis fork)
- **Infrastructure**: Docker 24+, Docker Compose

---

## Document History

| Document                 |  Created   | Last Updated | Version |
| :----------------------- | :--------: | :----------: | :-----: |
| high-level-spec.md       | 2025-11-01 |  2025-11-01  |   1.0   |
| user-experience-specs.md | 2025-11-01 |  2025-11-01  |   1.0   |
| epics-and-stories.md     | 2025-11-01 |  2025-11-01  |   1.0   |
| technology-plan.md       | 2025-11-01 |  2025-11-01  |   1.0   |
| implementation-plan.md   | 2025-11-01 |  2025-11-01  |   1.0   |
| implementation-status.md | 2025-11-01 |  2025-11-01  |   1.0   |
| index.md (this file)     | 2025-11-02 |  2025-11-02  |   1.0   |

---

**Navigation**: [Back to Project Root](../README.md) |
[Database Documentation](../database/postgres/README.md)
