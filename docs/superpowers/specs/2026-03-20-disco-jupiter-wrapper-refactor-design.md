# Design: Disco/Jupiter Wrapper Refactor For Custom Reports Prototype

## What this design covers

This design defines a strict visual and component refactor for the Custom Reports prototype in this repository. The goal is to keep current behavior, routes, data flow, and user interactions stable while replacing the prototype's hand-rolled UI layer with wrappers grounded in the cloned Refrens `disco` and `jupiter` codebases.

This is a prototype refactor, not a production package integration effort.

## Goal

Make the reports and query-builder prototype feel like a real Refrens surface by replacing custom local UI primitives with Disco/Jupiter-aligned wrappers, while preserving the existing feature behavior.

## Non-goals

- Directly integrating the cloned `@refrens/disco` or `@refrens/jupiter` packages in this first pass
- Changing route structure or app information architecture
- Changing report/query-builder behavior, query payloads, or hook-level data flow
- Rewriting the TanStack table implementation from scratch
- Converting this prototype into production-ready code with tests and full edge-case handling

## Current context

The prototype is a Next.js app in this repo and currently uses a local UI layer under `src/components/ui/`.

Current local primitives:

- `Button.tsx`
- `Dropdown.tsx`
- `Input.tsx`
- `Modal.tsx`
- `Pill.tsx`
- `RadioGroup.tsx`
- `SplitButton.tsx`

Primary feature surfaces consuming that UI layer:

- `src/components/reports/*`
- `src/components/query-builder/*`

Known library context:

- This app currently runs on React 19 and Next 15
- The cloned `disco` and `jupiter` repos are React 18-oriented libraries with broader peer dependency requirements and `styled-components`

Because of that mismatch, the cloned repos will be treated as reference implementations in phase 1, not mounted as live runtime dependencies.

## Source-of-truth references

Reference repositories:

- `/Users/apple/Refrens/Andromeda-temp/disco`
- `/Users/apple/Refrens/Andromeda-temp/jupiter`

Reference role split:

- `disco` is the source of truth for generic UI primitives, prop naming patterns, visual semantics, spacing patterns, and component composition
- `jupiter` is the source of truth for Refrens product-level layout/composition patterns and invoice/report-adjacent visual treatment

## Recommended approach

Use a seam-first adapter refactor:

1. Keep feature imports and behavior mostly unchanged
2. Refactor the local UI primitives so they become Disco/Jupiter-aligned wrappers
3. Update feature surfaces only where the wrapper contract is too limited or where screen chrome needs cleanup
4. Verify route-by-route that behavior remains unchanged

This is preferred over direct library integration because it keeps the refactor focused on visual/component fidelity instead of dependency migration.

## Architecture

### Layer 1: Adapter primitives

Files in `src/components/ui/` become the stable compatibility layer for this prototype.

Responsibilities:

- Preserve the app's current feature-facing API where practical
- Translate local variants and props into Disco/Jupiter-like semantics internally
- Align DOM structure, spacing, affordances, and naming with real Refrens component usage
- Provide a controlled place to evolve toward real library usage later if desired

This layer is the only place in phase 1 that should "know" both the prototype's current API quirks and the Disco/Jupiter reference patterns.

### Layer 2: Feature surfaces

Reports and query-builder components should remain behaviorally stable.

Responsibilities:

- Continue using existing hooks and state flow
- Accept targeted cleanup only when required by the wrapper contract
- Avoid broad rewrites that mix visual refactor work with business logic changes

### Dependency boundary

Phase 1 must not require live package-level integration from the cloned repos.

Allowed:

- Reading Disco/Jupiter source for exported component names, prop shapes, variants, layout patterns, and visual treatment
- Recreating those patterns in this repo's wrappers

Not allowed in phase 1:

- Refactoring this prototype into a React 18 compatibility project
- Pulling in large peer dependency trees just to achieve visual parity

## Component mapping

### `Button`

Refactor the local button primitive to mirror Disco-style button semantics.

Current local variants:

- `primary`
- `secondary`
- `ghost`
- `danger`

Wrapper expectations:

- Map current variants to Disco-like intent/nature patterns
- Normalize spacing, radii, text styling, and hover/disabled affordances to Refrens conventions
- Keep current button usage stable across reports and query-builder screens

### `SplitButton`

Refactor to feel like a Disco/Jupiter action trigger plus menu composition rather than a bespoke control.

Wrapper expectations:

- Preserve current action behavior
- Use a clearer primary-action plus menu-trigger composition
- Match Refrens action-menu spacing and hierarchy

### `Modal`

Refactor modal shell and action layout to mirror Disco modal composition.

Wrapper expectations:

- Preserve `open`, `onClose`, `title`, `footer`, and current content flow
- Normalize header/body/footer spacing
- Normalize close affordance and footer button alignment
- Keep the `SaveReportModal` behavior unchanged

### `Input`

Refactor visual treatment to Disco/Jupiter field styling.

Wrapper expectations:

- Preserve current value/change handling
- Normalize border, focus, label, help, and spacing treatment where used
- Avoid behavior changes to form state

### `RadioGroup`

Refactor to look and read like Refrens segmented/radio controls.

Wrapper expectations:

- Preserve selected value behavior
- Normalize visual emphasis, spacing, and selected-state affordances

### `Pill`

Refactor pills/chips to align with Disco tags and Jupiter token-chip patterns.

Wrapper expectations:

- Preserve current removable/filter-pill behavior
- Match Refrens chip styling in reports and query-builder surfaces

### `Dropdown`

Refactor menus and dropdown shells toward Disco select/menu/popover patterns.

Wrapper expectations:

- Preserve current selection behavior and outside-click dismissal
- Normalize menu spacing, separators, hover states, and trigger treatment
- Support current usage in report controls without changing feature logic

## Screen-level application

### Reports screens

Primary targets:

- `src/components/reports/ReportsDashboard.tsx`
- `src/components/reports/ReportsListingDashboard.tsx`
- `src/components/reports/FilterBar.tsx`
- `src/components/reports/SaveReportButton.tsx`
- `src/components/reports/SaveReportModal.tsx`
- `src/components/reports/AppliedFiltersPills.tsx`
- `src/components/reports/InvoiceTable.tsx`

Reports refactor rules:

- Keep report selection, filter application, save/update/delete behavior unchanged
- Upgrade headers, filters, pills, modal shell, action buttons, and toolbar chrome first
- Restyle table-adjacent controls before considering deeper table markup changes

### Query builder screens

Primary targets:

- `src/components/query-builder/QueryBuilderPage.tsx`
- `src/components/query-builder/ConditionGroup.tsx`
- `src/components/query-builder/ConditionList.tsx`
- `src/components/query-builder/ValueInput.tsx`

Query-builder refactor rules:

- Keep condition creation/edit/removal logic stable
- Focus on buttons, pills, radios, input chrome, and spacing consistency
- Avoid rethinking the builder interaction model in phase 1

## Table strategy

The table logic in `InvoiceTable.tsx` should remain TanStack-based in phase 1.

Phase 1 table work:

- Refactor toolbar chrome
- Refactor column visibility controls
- Refactor pagination buttons
- Refactor loading and empty states
- Normalize header and cell visual treatment where possible without changing data behavior

Avoid in phase 1:

- Replacing the table engine
- Rebuilding sorting/resizing/drag-reorder behavior
- Converting the table to a different grid abstraction

If the table still feels visually inconsistent after chrome cleanup, a later phase can wrap it in a stronger Disco-like table shell while keeping TanStack state intact.

## Migration phases

### Phase 1: Core form and token surfaces

Refactor:

- `Input`
- `Button`
- `Pill`
- `RadioGroup`

Purpose:

- Establish the most reused visual language first
- Improve save-report and query-builder surfaces with minimal risk

### Phase 2: Overlay and action controls

Refactor:

- `Modal`
- `Dropdown`
- `SplitButton`

Purpose:

- Bring menus and overlays in line with Disco/Jupiter composition
- Improve save-report and action-menu fidelity

### Phase 3: Reports screen chrome

Refactor:

- Header treatment
- Filter bar presentation
- Applied filter pills
- Report action areas

Purpose:

- Make the main reports flow read like a Refrens surface without touching logic

### Phase 4: Query-builder cleanup

Refactor:

- Condition controls
- Value controls
- Spacing, grouping, and control emphasis

Purpose:

- Match the updated reports styling and reduce visual drift between prototype surfaces

### Phase 5: Table chrome polish

Refactor:

- Column visibility toolbar area
- Pagination
- Empty/loading states
- Header/cell visual polish where safe

Purpose:

- Finish the prototype with a consistent Refrens feel while keeping table logic stable

## Behavior preservation rules

This refactor is allowed to change visible styling and composition, but not feature behavior.

Must remain unchanged:

- Route behavior
- Hook behavior
- Filter payloads
- Saved report payload generation
- Report hydration and selection behavior
- Sorting semantics
- Pagination semantics
- Query-builder state transitions

If a wrapper requires a tiny interface cleanup, the wrapper should absorb that difference rather than pushing churn into feature code unless the cleanup clearly reduces future complexity.

## Risks

### Primary risks

- Visual regressions in dense filter and pill surfaces
- Interaction regressions in dropdowns and split-buttons
- Modal behavior drift during shell refactor
- Overfitting wrappers to Disco/Jupiter internals in a way that implies unsupported runtime dependencies

### Secondary risks

- Inconsistent styling between reports and query-builder if migration stops midway
- Spending too much effort on the table markup instead of the more impactful chrome and controls

## Verification plan

Verification is route-and-flow based for this prototype.

Routes and flows to verify:

1. `/reports`
2. `/reports/invoices`
3. `/reports/new`
4. Save a new report
5. Update an existing report
6. Apply and clear filters
7. Query-builder condition create/edit/remove flows
8. Column visibility interactions
9. Pagination interactions

Verification questions:

- Does the screen still behave the same?
- Do filters still generate the same outcomes?
- Do report save/update/delete flows still work?
- Does the UI now read as Refrens-aligned rather than custom prototype chrome?

## Definition of done

The refactor is done when:

- The prototype behaves the same as before on the verified routes and flows
- The local UI layer is wrapper-based rather than hand-rolled in appearance and composition
- Reports and query-builder surfaces visually feel aligned with Disco/Jupiter patterns
- No direct cloned-library runtime integration is required for phase 1

## Future extension, intentionally deferred

If phase 1 succeeds and the team later wants deeper fidelity, a separate follow-up can evaluate:

- Direct package integration feasibility
- React 19 compatibility with published Refrens UI packages
- Replacing more of the table surface with Disco-native composition

That work is intentionally outside this design.
