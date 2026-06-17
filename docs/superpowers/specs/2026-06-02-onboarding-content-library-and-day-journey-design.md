# Onboarding Content Library And Day Journey Design

## Goal

Turn onboarding settings from a read-only default list into a content library that HR and CEO can edit immediately, while keeping operations screens day-based.

This scope intentionally does **not** solve role mapping deeply yet. Role-specific mapping can come later. Current focus is:

1. a library of onboarding content
2. a built-in recommended starter template for Vietnamese milk tea chains
3. assigning each content item to a day milestone so operations can read "today needs what"
4. allowing HR and CEO to edit content without touching code

## Problem

Current settings pages show static lists such as steps, buddy rewards, conditions, and role cards. They do not function as a real onboarding content system.

Current gaps:

- onboarding content is mostly display-only
- there is no clear library concept
- there is no editable starter curriculum for HR to customize
- content is not structured by topic in a way HR naturally thinks
- operations needs day-based output, but settings is not built to manage day assignment cleanly
- there is no draft/publish flow to protect live onboarding from accidental edits

## Product Direction

Use one central concept:

`Onboarding Content Library`

HR and CEO manage onboarding by editing content grouped by topic.
System still stores day milestones on each content item.
Operations reads those day milestones to render the journey timeline and focus blocks.

This creates one authoring model for both:

- settings authoring: grouped by topic
- operations consumption: grouped by day

## Scope

### In Scope

- new onboarding content library settings area
- built-in starter template based on common F&B and milk tea training patterns in Vietnam
- content grouped by topic
- each item assigned to a day milestone
- each item configurable by HR and CEO
- draft and publish states for templates
- operations screen consumes published template day assignment

### Out Of Scope

- deep role matrix redesign
- store-specific override logic
- employee-specific adaptive learning logic
- rich media CMS
- test engine redesign
- full certification engine

## External Reference Patterns

Public references from successful chains in Vietnam and adjacent F&B show repeating training themes:

- Highlands Coffee public hiring and trainer materials emphasize service sequence, beverage quality, hygiene, expiry control, opening/closing, equipment care, and onboarding service culture.
- ToCoToCo public franchise and recruitment materials emphasize training support, operation support, launch support, service attitude, hygiene, and ingredient readiness.
- Phuc Long public customer-flow and store-facing materials show practical importance of member barcode, voucher handling, and transaction flow.
- KATINAT public recruitment emphasizes structured training from zero and career progression.

Inference from these sources:

A useful starter template for Vietnamese milk tea chains should include at minimum:

- orientation and store rules
- service greeting and customer interaction
- core menu and recipe basics
- POS, member, voucher, and payment flow
- hygiene and food safety
- opening, closing, ingredients, expiry, and station discipline
- first-shift review and readiness check

## User Roles

### HR Admin

Main editor.
Can create, edit, duplicate, draft, publish, archive templates.
Can edit content fields and day assignment.

### CEO

Can review and edit final structure.
Can publish or lock strategic default templates if needed.

### Store Manager

Read-only in this phase by default.
Future phase may allow local notes or store add-ons, but not now.

## Main UX Model

### Authoring View

Settings should present content grouped by topic because this matches how HR thinks about training.

Primary organization:

- topic group
- item inside group
- item detail panel

### Runtime View

Operations should present content grouped by day because this matches how store operations works.

Primary organization:

- day milestone
- selected day
- urgent items for selected employee

## Information Architecture

Create or refactor onboarding settings into these areas:

1. `Overview`
2. `Content Library`
3. `Templates`
4. `Journey Rules`

For this scope, the actual working center is `Content Library` and `Journey Rules`.

### Overview

Purpose:

- show save status
- show which template is published
- show content counts by topic and by day
- show missing required items
- show last publish time

### Content Library

Purpose:

- edit onboarding content grouped by topic
- manage built-in starter content
- assign each item to a day milestone

### Templates

Purpose:

- choose starter template
- duplicate template
- archive template
- publish template

### Journey Rules

Purpose:

- configure journey length such as 7, 10, 14, or custom bounded value
- define milestone buckets such as `pre_start`, `day_1`, `day_2_3`, `day_4_7`, `week_2`
- define which item types can appear in operations focus blocks

## Recommended Authoring Layout

Three-column editor.

### Left Column: Topic Groups

Examples:

- Orientation
- Rules and Discipline
- Customer Service
- POS and Payment
- Membership and Voucher
- Beverage Basics
- Hygiene and Food Safety
- Opening and Closing
- Ingredients and Expiry
- Equipment Basics
- Basic Incident Handling
- First Shift Review

Actions:

- add topic
- rename topic
- reorder topic
- disable topic

### Middle Column: Content Items

Shows items in selected topic.

Each row shows:

- title
- milestone badge
- required/optional badge
- completion method badge
- active/inactive status

Actions:

- add item
- duplicate item
- archive item
- reorder item

### Right Column: Item Detail

Editable fields:

- item title
- short description
- topic group
- milestone bucket
- estimated duration
- required or optional
- completion method
- evidence type
- who confirms completion
- whether item can appear in operations focus block
- whether item is visible to employees or ops only
- active status

## Data Model Direction

Introduce `OnboardingContentTemplate` as published curriculum container.

Suggested shape:

- template id
- template name
- template description
- status: draft | published | archived
- version number
- source type: built_in | custom | duplicated
- created by
- updated by
- created at
- updated at

Introduce `OnboardingContentTopic`.

Suggested fields:

- topic id
- template id
- code
- label
- sort order
- active

Introduce `OnboardingContentItem`.

Suggested fields:

- item id
- template id
- topic id
- title
- description
- milestone bucket
- estimated minutes
- is required
- completion method
- evidence type
- confirmer role
- is visible in ops
- is eligible for focus block
- active
- sort order

Suggested enum examples:

- milestone bucket: `pre_start`, `day_1`, `day_2_3`, `day_4_7`, `week_2`
- completion method: `read`, `watch`, `quiz`, `buddy_confirm`, `manager_observe`, `hands_on_pass`
- evidence type: `none`, `note`, `photo`, `quiz_score`, `check_observed`
- confirmer role: `employee`, `buddy`, `shift_leader`, `store_manager`, `hr_admin`

## Built-In Starter Template

Ship one built-in recommendation named similar to:

`Vietnam Milk Tea Store Onboarding - Starter`

### Pre-start

- Add employee to communication group
- Confirm uniform and attendance rules
- Prepare account and tools
- Confirm first shift and arrival time

### Day 1

- Store introduction and station walkthrough
- Working rules, attendance, break, hygiene basics
- Greeting and service sequence basics
- Hand washing and food safety basics

### Day 2-3

- Core menu orientation
- Cup size, sugar, ice, topping standards
- Recipe basics or base prep basics
- POS basic order flow
- Membership, barcode, voucher handling basics

### Day 4-7

- Opening checklist basics
- Closing checklist basics
- Ingredient storage and expiry checking
- Cleaning station and customer area
- Hands-on station practice with buddy

### Week 2

- Basic remake and minor complaint handling
- Independent station review
- First shift result and follow-up review
- Ready-for-basic-shift confirmation

## Why This Starter Template Fits Vietnam Milk Tea Chains

It reflects repeated operational themes visible in public materials from Highlands Coffee, ToCoToCo, Phuc Long, and KATINAT:

- service culture
- station discipline
- hygiene and safety
- recipe consistency
- transaction flow
- readiness review after first practical shifts

The template is a recommendation only. HR and CEO can duplicate and tailor it.

## Day Assignment Rules

Each item must map to one milestone bucket. That bucket is later converted into journey days in operations.

Authoring rule:

- HR edits by topic
- system stores milestone bucket on each item

Runtime rule:

- operations expands milestone buckets into day-based timeline blocks
- focus block uses items marked `is eligible for focus block`
- only active and published items are shown in operations

This preserves the required separation between:

- author mental model: topic-based
- operator mental model: day-based

## Journey Length Setting

Create a simple field in `Journey Rules`:

- recommended presets: 7, 10, 14
- optional custom bounded value: 5-30

Behavior:

- this setting controls how many days operations timeline renders
- milestone buckets do not disappear when journey length changes
- system remaps the buckets proportionally or by fixed day windows defined in rules

For first phase, use fixed mapping:

- `pre_start`: before day 1
- `day_1`: day 1
- `day_2_3`: days 2-3
- `day_4_7`: days 4-7
- `week_2`: days 8-14

If custom journey is shorter than a bucket range, later days compress into last available window.

## Editing Rules

### Add

HR or CEO can:

- add new topic
- add new item under topic
- duplicate starter item

### Edit

HR or CEO can edit all item fields directly in detail panel.

### Remove

Prefer archive or disable over hard delete.

Rules:

- if item belongs to published template, deleting should archive it in next draft version
- hard delete only for draft-only content never published

### Reorder

Support drag or up/down actions for:

- topic order
- item order within topic

## Draft And Publish Flow

Need safe editing.

Rules:

- HR edits draft version
- published version remains source of truth for live operations
- publishing creates next version and marks it active for new onboarding journeys
- currently running onboarding always keeps its assigned template snapshot in phase 1

For first implementation, safer rule:

- published changes apply only to newly opened onboarding flows
- active existing employees keep current assigned template snapshot

## Operations Integration

Operations should not read the library raw.

Instead, service layer should expose processed runtime view:

- current published template
- day-based journey summary
- items visible for selected day
- items eligible for focus block
- selected employee completion state

This keeps settings and operations decoupled.

## Error Handling And Validation

Need validation in settings.

Template-level validation:

- must have at least one active topic
- must have at least one active item
- published template must include required basics

Recommended required basics before publish:

- at least one orientation item
- at least one hygiene item
- at least one service item
- at least one shift-readiness or follow-up item

Item-level validation:

- title required
- milestone bucket required
- completion method required
- duration must be non-negative and bounded
- focus-block eligibility requires active item

## Permissions

Phase 1 permission rule:

- HR Admin: full edit
- CEO: full edit
- Store Manager: read-only

Later extension can add local override without changing current data model drastically.

## Testing Strategy

### Unit / Contract

- content template types serialize and load correctly
- published template filters active items only
- milestone bucket maps into day-based runtime output correctly
- journey length setting changes runtime day count correctly
- focus block only includes eligible items

### UI

- create topic
- create item
- edit item fields
- reorder items
- publish draft
- operations reads published content and renders correct day focus

### Regression

- existing onboarding operations route still works with fallback defaults
- if no custom template exists, built-in starter template is used

## Migration Strategy

Phase 1 should not break current flows.

Migration plan:

- seed one built-in starter template
- keep current static defaults as fallback source if template storage empty
- gradually move settings UI to read/write new template storage
- update operations service to prefer published template over static defaults

## Open Risks

- current settings pages contain display-only tabs; expanding them without separating responsibilities may create large monolithic files
- current copy/encoding quality in some onboarding files is inconsistent; future implementation should normalize touched strings
- if template versioning is skipped, live operations may change unexpectedly during HR edits

## Recommended Build Sequence

1. define content library data model and seed starter template
2. build content library editor UI grouped by topic
3. add journey rules including journey length and bucket mapping
4. connect operations service to published content
5. add validation and publish flow

## Recommendation Summary

Best near-term path:

- ignore deep role mapping for now
- build one strong onboarding content library
- ship one editable built-in starter template based on proven Vietnam F&B patterns
- let HR and CEO edit by topic
- keep day milestone on every item so operations stays day-first

This gives immediate admin value without blocking on larger onboarding architecture.