<!--
  ============================================================================
  SYNC IMPACT REPORT
  ============================================================================
  Version change: 0.0.0 (template) → 1.0.0
  Bump rationale: MAJOR — first ratification of project constitution

  Modified principles:
    - [PRINCIPLE_1_NAME] → I. MVP First, Always
    - [PRINCIPLE_2_NAME] → II. Code Simplicity & Readability
    - [PRINCIPLE_3_NAME] → III. No Overengineering
    - [PRINCIPLE_4_NAME] → IV. Testing & Verification
    - [PRINCIPLE_5_NAME] → V. User Experience (UX) Consistency
    - (new) → VI. Performance (Pragmatic, Not Premature)
    - (new) → VII. Delivery Standards

  Added sections:
    - Purpose (preamble)
    - Principle VI — Performance (Pragmatic, Not Premature)
    - Principle VII — Delivery Standards
    - Guiding Question
    - Governance (fully defined)

  Removed sections:
    - [SECTION_2_NAME] / [SECTION_3_NAME] generic placeholders (replaced)

  Templates requiring updates:
    - .specify/templates/plan-template.md        ✅ compatible (dynamic gates)
    - .specify/templates/spec-template.md         ✅ compatible (MVP slices)
    - .specify/templates/tasks-template.md        ✅ compatible (optional tests)
    - .specify/templates/checklist-template.md    ✅ compatible (generic)

  Follow-up TODOs: none
  ============================================================================
-->

# AIMarketplace Constitution

## Purpose

This constitution defines how code and product MUST be built for
AIMarketplace. Our primary goal as a startup is to ship a **working,
minimal MVP** as quickly as possible, without sacrificing basic
correctness, clarity, or user trust.

We value **simplicity over cleverness**, **clarity over abstraction**,
and **working software over theoretical perfection**.

## Core Principles

### I. MVP First, Always

- Every feature MUST deliver a **running, usable version** first.
- The simplest solution that satisfies the requirement MUST be chosen.
- Do NOT overengineer for scale, extensibility, or edge cases unless
  explicitly required by the current specification.
- Optimizations, abstractions, and refactors MUST be deferred until
  the MVP is stable and validated.

**Rationale**: Shipping working software is the only way to learn
what users actually need. Premature investment in flexibility delays
that learning.

### II. Code Simplicity & Readability

- Code MUST be **easy to read, understand, and modify**.
- Prefer explicit, straightforward logic over complex patterns.
- Avoid unnecessary abstractions, frameworks, layers, or indirection.
- Avoid premature generalization.

Guidelines:

- Short functions with clear responsibilities.
- Meaningful variable and function names.
- Minimal magic, minimal configuration.
- Favor clarity over DRY if it improves readability.

**Rationale**: If a junior engineer cannot understand the code
quickly, it is too complex.

### III. No Overengineering

Do NOT introduce any of the following unless **clearly justified by
current requirements**:

- Complex architectures
- Heavy design patterns
- Custom frameworks
- Advanced optimizations

Build for **today's needs**, not hypothetical future ones.

**Rationale**: Unused abstractions are liabilities, not assets.
Every layer of indirection MUST earn its place.

### IV. Testing & Verification

- Every solution MUST be verified **end-to-end** before delivery.
- At minimum:
  - Manually test the main user flows.
  - Validate critical logic paths.
- Add automated tests only where they provide **clear, immediate
  value** for the MVP.

**Rationale**: Untested code is unfinished code. However, exhaustive
test suites for throwaway prototypes waste time.

### V. User Experience (UX) Consistency

- UI MUST be minimal, clean, intuitive, and easy to navigate.
- Avoid visual clutter and unnecessary interactions.
- Prefer fewer screens, fewer clicks, and clear defaults.

Design rules:

- The user MUST understand what to do without instructions.
- Navigation MUST be obvious and predictable.
- If something can be simpler, make it simpler.

**Rationale**: Users judge the product by its interface. Confusing
UX erodes trust faster than missing features.

### VI. Performance (Pragmatic, Not Premature)

- The app MUST be "fast enough" for MVP usage.
- Avoid obvious inefficiencies (unnecessary loops, repeated calls).
- Do NOT optimize prematurely.
- Address performance issues only when they are **observable and
  impactful**.

**Rationale**: Premature optimization obscures intent and wastes
effort on problems that may never materialize.

### VII. Delivery Standards

Before delivering any work:

- The app MUST run successfully.
- The core requirements MUST be implemented.
- The code MUST be readable and minimal.
- The primary user flow MUST be tested.

If something is incomplete, it MUST be called out clearly rather
than hidden.

**Rationale**: Incomplete work disguised as done is worse than
incomplete work clearly labeled.

## Guiding Question

At every decision point, ask:

> "What is the simplest thing that works and gets us closer to a
> usable product?"

If in doubt, choose **simplicity**, **clarity**, and **speed**.

## Governance

- This constitution **supersedes** all other development practices
  and guidelines for the AIMarketplace project.
- All code reviews and pull requests MUST verify compliance with
  these principles.
- Any complexity beyond the simplest working solution MUST be
  justified against the Guiding Question.
- Amendments to this constitution require:
  1. A written proposal describing the change and its rationale.
  2. Review and approval by the project lead.
  3. Version bump following semantic versioning (MAJOR for principle
     removal/redefinition, MINOR for additions, PATCH for wording).
  4. Update of the `Last Amended` date.
- Compliance review SHOULD occur at sprint boundaries or before
  major releases.

**Version**: 1.0.0 | **Ratified**: 2026-03-30 | **Last Amended**: 2026-03-30
