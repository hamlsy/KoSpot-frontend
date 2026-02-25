# RoadView Shared Game and Comparative Result Modal Plan

## Objective
Implement a shareable Practice game flow for RoadView so another player can play the same target location and see a specialized comparison result modal, while preserving existing Practice UX and refactoring the current monolithic result overlay into maintainable components.

## Repository Grounding
- Current Practice view and inline result overlay: `src/features/game/single/roadview/views/PracticeView.vue`
- Existing reusable rank result components: `src/features/game/single/roadview/components/Result/ResultOverlay.vue`, `src/features/game/single/roadview/components/Result/ResultMapSection.vue`
- RoadView routes: `src/router/roadViewRoutes.js`
- RoadView API service: `src/features/game/single/roadview/services/roadViewApi.service.js`
- Color design source of truth: `src/core/constants/colors.js`

## Decisions
1. Use one Practice screen (`PracticeView.vue`) for both normal and shared play, controlled by explicit route query/state mode.
2. Split Practice result UI into dedicated components before adding share-mode specialization.
3. Keep share link state server-validated (token/session id), not trusted from client-side coordinates.
4. Implement clipboard copy with progressive fallback and deterministic feedback.
5. Keep non-share Practice behavior backward compatible.

## Scope
IN:
- Add `Game Share` action in Practice result overlay.
- Generate and copy share URL for same target game/session.
- Recipient loads same gameplay shell and plays same coordinates.
- Shared recipient result modal variant showing sharer info + comparison + login CTA.
- Refactor Practice result overlay into separate components.
- Align modal visual system with `colors.js` and mobile-first behavior.

OUT:
- Full social sharing platform (analytics, OG cards, deep-link provider integration).
- Multi-round tournament/sharing ladder redesign.
- Backend anti-abuse platform beyond minimum token validation/replay controls.

## Assumptions and Contract Placeholders
- Backend must provide share APIs and recipient compare payloads.
- If backend is not ready, frontend will ship with guarded feature flag and graceful disabled state.
- Token policy requires at minimum: signature/integrity, TTL, replay rule.

## Component Target Structure
- `PracticeView.vue` (orchestrator only, reduced UI responsibility)
- `components/Result/PracticeResultOverlay.vue` (normal practice result UI)
- `components/Result/PracticeResultMapSection.vue` (map rendering extracted/reused)
- `components/Result/SharedPracticeResultOverlay.vue` (recipient comparison modal)
- `components/Result/ShareGameButton.vue` (copy link UX)
- `services/roadViewApi.service.js` (share API methods added)

## Route and Mode Strategy
- Route stays `/roadView/practice`.
- Add query contract:
  - `shareToken=<opaque-token>` when recipient enters via shared link.
  - Optional `mode=shared` derived from token presence, not user-editable source of truth.
- View mode flags:
  - `isSharedRecipientFlow`
  - `shareContext` (validated payload)

## API Contract Plan (Frontend-facing)
- `POST /roadView/practice/share` (or equivalent backend endpoint): create share URL/token from current finished game.
- `POST /roadView/practice/shared/start`: resolve share token and start recipient round with same coordinates/rules.
- `POST /roadView/practice/shared/end`: submit recipient answer and receive comparison payload.
- Comparison payload minimum fields:
  - sharer nickname
  - sharer score
  - sharer hint used count
  - recipient score
  - recipient hint used count
  - optional delta fields (`scoreDiff`, `hintDiff`)

## Execution Tasks

### Task 1 - Extract Practice Result Overlay Component (Normal Mode)
- Move inline result overlay template/style blocks from `src/features/game/single/roadview/views/PracticeView.vue` into `PracticeResultOverlay.vue`.
- Keep current props/events parity (`score`, `distance`, `poiName`, `fullAddress`, restart/exit actions).
- Restrict `PracticeView.vue` to orchestration state and event handlers.
- Add minimal comments only where behavior is non-obvious (state-mode branching points).
- QA Scenario: finish a normal practice game and confirm result data, map, restart, and exit all behave exactly like pre-refactor.

### Task 2 - Extract and Reuse Result Map Section
- Extract map rendering logic from Practice result area into `PracticeResultMapSection.vue` (or reuse/adapt `ResultMapSection.vue` if coupling remains low).
- Standardize marker/line rendering with existing utilities (`getUserMarkerSize`, `getResultMarkerSize`).
- Remove duplicate map-init logic from parent component after extraction.
- QA Scenario: verify map renders both guessed and answer positions with line, markers, and bounds in normal mode.

### Task 3 - Introduce Practice Flow Mode State
- Add explicit mode state in `PracticeView.vue`: `normal` vs `shared-recipient` derived from validated route context.
- Parse route query token (`shareToken`) during mount and trigger shared-start initialization when present.
- Keep existing `sido` handling for normal practice flow unchanged.
- QA Scenario: open `/roadView/practice?sido=SEOUL` and confirm existing normal behavior; open `/roadView/practice?shareToken=test` and confirm shared-init branch activates.

### Task 4 - Extend RoadView API Service for Share Flow
- Add share API methods in `src/features/game/single/roadview/services/roadViewApi.service.js`:
  - `createPracticeShareLink(payload)`
  - `startSharedPracticeGame(shareToken)`
  - `endSharedPracticeGame(payload)`
- Keep existing `startPracticeGame`/`endPracticeGame` contracts untouched.
- Add request/response shape comments for new methods mirroring current service style.
- QA Scenario: mock each new method response and verify success/error handling paths (including toast-level messages) in caller components.

### Task 5 - Add Share Button Component with Clipboard Fallback
- Create `ShareGameButton.vue` in result components area.
- Behavior sequence:
  1) call share-link API,
  2) attempt `navigator.clipboard.writeText`,
  3) fallback to legacy copy strategy if needed,
  4) show deterministic success/failure feedback.
- Ensure user-gesture-bound execution (copy inside click flow) for mobile Safari reliability.
- QA Scenario: click `Game Share` on desktop and mobile; verify success toast on supported browsers and fallback/manual guidance on failure.

### Task 6 - Define Shared Recipient Result Modal Variant
- Create `SharedPracticeResultOverlay.vue` with required comparison fields:
  - sharer nickname
  - sharer score
  - sharer hint usage
  - recipient score and hint usage
  - comparison/delta presentation
  - login CTA button
- Keep action set explicit (`Play Again`, `Exit`, `Login`).
- QA Scenario: complete shared recipient game and verify specialized modal appears instead of normal practice modal with all comparison values rendered.

### Task 7 - Wire Login CTA and Navigation Guardrails
- Login CTA in shared-result modal routes to existing login view and preserves return intent.
- Prevent destructive navigation ambiguity: maintain existing exit behavior while shared mode is active.
- Add clear copy text for non-logged-in users without blocking current game completion.
- QA Scenario: from shared result modal, click login CTA and confirm navigation works and back-navigation returns to expected context.

### Task 8 - Apply Color-System and Mobile-First Style Refactor
- Replace hardcoded modal action colors in extracted practice result components with palette references aligned to `src/core/constants/colors.js`.
- Keep visual language consistent with existing design philosophy: clear hierarchy, restrained gradients, accessible contrast, rounded cards, compact spacing.
- Add responsive rules for 480px and 768px breakpoints (button stacking, map height, text wrapping).
- QA Scenario: validate modal readability and tap target sizes on mobile viewport; confirm no horizontal overflow.

### Task 9 - Error and Edge-Case UX Paths for Shared Links
- Add explicit states for:
  - invalid token
  - expired token
  - replay/consumed token
  - shared-start API failure
- Provide user-safe fallback CTA (`Go to normal practice`) without dead ends.
- Ensure shared flow cannot silently fall back to random normal coordinates.
- QA Scenario: simulate each token failure state and verify expected message + safe navigation action.

### Task 10 - Clean-Code Pass and Responsibility Boundaries
- Ensure `PracticeView.vue` responsibilities are limited to state orchestration and API coordination.
- Keep presentational concerns inside result components.
- Remove duplicated logic discovered during extraction (especially result map init duplication).
- Add concise comments only for branch rationale and integration contracts.
- QA Scenario: static review confirms no duplicated result-render logic between `PracticeView.vue` and extracted components.

### Task 11 - Verification Matrix and Manual Regression Checklist
- Create implementation checklist for manual verification due limited automated test infrastructure:
  - normal practice happy path
  - shared recipient happy path
  - share copy success/failure
  - token invalid/expired/replayed
  - login CTA route
  - mobile layout checks
- Include environment notes for clipboard behavior differences (desktop Chrome vs iOS Safari fallback).
- QA Scenario: checklist executed end-to-end with pass/fail log before merge.

## Final Verification Wave
- Regression: non-shared Practice flow start/play/end/retry works unchanged.
- Shared entry: valid link opens playable session with same map/rules.
- Shared result: specialized comparison modal fields render correctly.
- Clipboard: success/failure feedback verified on desktop and mobile fallback path.
- Visual consistency: colors and hierarchy align with `src/core/constants/colors.js`.
- Responsive: modal and controls work on small viewports without overflow.

## Risks and Mitigations
- API mismatch risk -> define request/response schemas first and gate UI by capability flag.
- Replay/expiration risk -> enforce token validity and explicit error UX for invalid/expired links.
- Refactor regression risk -> isolate extraction in small steps and run manual regression checklist.

## Decisions Needed
- [DECISION NEEDED] Confirm backend endpoint names and payload schema for share create/start/end APIs (current entries are frontend placeholders).
- [DECISION NEEDED] Confirm token replay policy (`single-use`, `two-use`, or `multi-use with TTL`) for shared links.
- [DECISION NEEDED] Confirm login CTA destination and post-login return path behavior for shared recipients.

## Delivery Artifacts
- Updated planning docs only (no source-code edits in this phase).
- Decision-complete implementation sequence for `/start-work` execution.
