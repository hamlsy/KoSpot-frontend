# Plan: Roadview Result Overlays Redesign

## Objective
- Redesign `SharedPracticeResultOverlay.vue` and enhance `PracticeResultOverlay.vue` so result UI feels more game-like, includes winner-sensitive tone, stronger login CTA, no shared-overlay exit button, and share success label transition to `복사완료!`.

## Scope
- IN:
  - `src/features/game/single/roadview/components/Result/SharedPracticeResultOverlay.vue`
  - `src/features/game/single/roadview/components/Result/PracticeResultOverlay.vue`
  - `src/features/game/single/roadview/components/Result/ShareGameButton.vue` (if needed for styling/API compatibility only)
  - `src/features/game/single/roadview/views/PracticeView.vue` (share success state and wiring)
- OUT:
  - Any gameplay logic unrelated to result overlays
  - API contract changes in `roadViewApiService`
  - New test framework introduction

## Ground Truth (Explored)
- Overlay mode branch is in `PracticeView.vue` via `showResult && !isSharedRecipientMode` and `showResult && isSharedRecipientMode`.
- Current shared overlay emits `login`, `restart`, `exit`; currently shows restart and exit buttons.
- Current share flow has `isShareLoading`; no `copy-success` state exists.
- `ShareGameButton.vue` already accepts `buttonText` and `disabled` props.
- Validation gates currently available: `npm run lint`, `npm run build:dev`.

## Decisions Locked
- Winner condition for shared recipient: `myScore > sharerScore`.
- Shared comparison message variants:
  - Win: `축하합니다! 공유 받은 게임에서 승리했어요!`
  - Tie: `무승부입니다! 거의 같은 실력이에요.`
  - Lose: `아쉽지만 다음 라운드에서 역전해보세요!`
- Login CTA copy:
  - Body: `더 많은 기능을 이용하려면 로그인해 주세요.`
  - Button: `로그인하고 더 플레이하기`
- Remove shared overlay `exit` action from UI and emit contract.
- Share success text timing:
  - success label `복사완료!` shown for 1600ms
  - fallback/default label `게임 공유`
  - failure keeps `게임 공유`
- Animation approach: lightweight `opacity + transform` transition; no heavy keyframe chains.

## Guardrails
- Keep all existing props backward-compatible unless explicitly listed in this plan.
- Do not break existing event names used by parent except approved removal of shared `exit` emit usage.
- Keep mobile-first behavior intact (`max-width: 768px` layout rules must remain functional).
- Avoid introducing expensive visual effects (`backdrop-filter` intensity increase, large blur/box-shadow stacks, infinite animations on many elements).

## Implementation Tasks
- Task entries are appended below in execution order.

### Task 1 - Shared Overlay Information Hierarchy Redesign
- File: `src/features/game/single/roadview/components/Result/SharedPracticeResultOverlay.vue`
- Update layout to a clear hierarchy: title area -> outcome banner -> comparison cards -> map -> CTA/action area.
- Reuse existing design language from `ResultOverlay.vue` and `FinalResults.vue`: high-contrast header band, compact stat cards, icon-led labels.
- Keep current data contract (all existing score/location props remain).
- QA scenarios:
  - Shared overlay renders with complete layout on desktop and mobile.
  - No clipping when `sharerNickname` is long (20+ chars).
  - Map section remains visible and not collapsed by new layout wrappers.

### Task 2 - Winner/Tie/Lose Tone Logic and Copy
- File: `src/features/game/single/roadview/components/Result/SharedPracticeResultOverlay.vue`
- Add computed `comparisonOutcome` derived from `myScore` and `sharerScore` (`win|tie|lose`).
- Replace generic `scoreDeltaText` block with outcome-driven message area using locked copy:
  - win: `축하합니다! 공유 받은 게임에서 승리했어요!`
  - tie: `무승부입니다! 거의 같은 실력이에요.`
  - lose: `아쉽지만 다음 라운드에서 역전해보세요!`
- Preserve numeric difference context in a subline (e.g., `점수 차이: N점`) for all outcomes.
- QA scenarios:
  - `myScore > sharerScore` shows win copy and win styling.
  - `myScore === sharerScore` shows tie copy and neutral styling.
  - `myScore < sharerScore` shows lose copy and supportive styling.

### Task 3 - Shared Overlay Action Model Update (Remove Exit)
- Files:
  - `src/features/game/single/roadview/components/Result/SharedPracticeResultOverlay.vue`
  - `src/features/game/single/roadview/views/PracticeView.vue`
- Remove `종료하기` button from shared overlay template.
- Remove `exit` from shared overlay `emits` to avoid stale contract.
- Remove `@exit` listener binding for `SharedPracticeResultOverlay` in parent.
- Keep `restart` and `login` actions only.
- QA scenarios:
  - Shared overlay shows exactly two actions: login CTA + restart.
  - No Vue warning for undeclared/unused emit/listener.
  - Non-shared overlay still keeps its own exit button unchanged.

### Task 4 - Shared Overlay Entrance Motion Optimization
- File: `src/features/game/single/roadview/components/Result/SharedPracticeResultOverlay.vue`
- Introduce lightweight entrance transition using `opacity` + `transform` (`translateY` or `scale`) for overlay/content.
- Keep transition short (`220ms-320ms`) and smooth (`cubic-bezier(0.22, 1, 0.36, 1)` style curve).
- Add `prefers-reduced-motion` branch to disable transform-heavy movement.
- Add GPU-friendly hints only where needed (`will-change` on animated container only).
- QA scenarios:
  - Overlay appears with perceptibly smooth fade/slide on first open.
  - Reopen after close does not stutter.
  - Reduced-motion environment shows near-instant, non-jarring appearance.

### Task 5 - Login CTA Priority Upgrade
- File: `src/features/game/single/roadview/components/Result/SharedPracticeResultOverlay.vue`
- Promote login CTA to primary visual priority:
  - stronger background contrast and button size
  - clear separation from secondary restart action
  - update button label to `로그인하고 더 플레이하기`
- Keep current routing behavior by preserving parent `@login="goToLogin"` flow.
- Ensure keyboard focus ring and aria semantics remain intact.
- QA scenarios:
  - Login CTA is visually dominant over restart action.
  - Button remains reachable/tabbable and clickable on mobile.
  - `goToLogin` navigation still preserves current redirect query behavior.

### Task 6 - Practice Result Overlay Button Visual Refresh
- Files:
  - `src/features/game/single/roadview/components/Result/PracticeResultOverlay.vue`
  - `src/features/game/single/roadview/components/Result/ShareGameButton.vue` (style tweaks only if required)
- Strengthen action area hierarchy:
  - share action card with helper text + primary share button
  - restart/exit as secondary but clear options
- Normalize button height, radius, spacing, and hover/active states to match overlay style language.
- Preserve current prop/event contracts (`shareLoading`, `@share`, `@restart`, `@exit`).
- QA scenarios:
  - Button row remains readable at 390px width without overlap.
  - Share/restart/exit all remain clickable with no layout shift.
  - Existing loading text (`링크 생성 중...`) still appears when `shareLoading=true`.

### Task 7 - Share Success Label State Wiring (`복사완료!`)
- Files:
  - `src/features/game/single/roadview/views/PracticeView.vue`
  - `src/features/game/single/roadview/components/Result/PracticeResultOverlay.vue`
- Add parent-owned state in `PracticeView.vue`:
  - `isShareCopied: false`
  - `shareCopiedResetTimer: null`
- Update `shareGame()` behavior:
  - on copy success: set `isShareCopied = true`, clear previous timer, schedule reset to false at 1600ms
  - on copy failure: ensure `isShareCopied = false`
  - in `finally`: preserve current loading reset behavior
- Pass share button text as prop from parent to child overlay:
  - `shareButtonText = isShareCopied ? '복사완료!' : '게임 공유'`
- QA scenarios:
  - Success path: text flips to `복사완료!` and reverts after ~1.6s.
  - Failure path: text stays `게임 공유`.
  - Repeated rapid clicks do not leave text stuck in wrong state.

### Task 8 - Overlay Reset and Timer Cleanup Safety
- Files:
  - `src/features/game/single/roadview/views/PracticeView.vue`
- Ensure `isShareCopied` reset and timeout cleanup on these flows:
  - `nextRound()` before reload
  - `exitGame()` before route push
  - `beforeUnmount()` teardown
- Add single utility method for timeout clear/reset to avoid duplication.
- QA scenarios:
  - Navigate away immediately after share success: no console errors from stale timer.
  - Restart flow reopens result with default `게임 공유` text.
  - No memory leak warnings in repeated play cycles.

### Task 9 - Regression and Manual QA Matrix Execution
- Files: N/A (execution checklist task)
- Validate key user journeys:
  - normal practice result with share success/failure
  - shared recipient result for win/tie/lose
  - login CTA navigation path
  - mobile/desktop layout checks
- Record quick pass/fail notes for each journey before final handoff.
- QA scenarios:
  - All acceptance criteria map to at least one executed scenario.
  - No broken events in console.
  - UX remains consistent with existing game result tone.

## Final Verification Wave
- Run `npm run lint`.
- Run `npm run build:dev`.
- Manual QA on desktop and mobile widths (at minimum 390px and 1280px).
- Confirm no regression in non-shared result overlay open/close behavior.

## Acceptance Criteria
- Shared overlay has no `종료하기` button and no dead event listener requirement for exit.
- Shared overlay visibly communicates win/tie/lose with the locked copy rules.
- Login CTA appears as strongest action in shared overlay and remains keyboard accessible.
- Practice result overlay share button can show `게임 공유` -> `복사완료!` -> `게임 공유` on success.
- Copy failure path never shows false success text.
- Lint/build both pass.

## Risks and Mitigations
- Timer leak risk for share success text reset -> always clear timeout on component unmount/reset path.
- Race conditions from repeated share clicks -> block repeat while `isShareLoading` true and ignore stale timeout using tokenized/cleared timer.
- Text overflow risk (long nickname/address) -> enforce wrapping/ellipsis in cards and CTA blocks.

## Rollback Plan
- If UX regressions appear, revert only overlay style/markup changes while keeping share logic intact.
- If share state behavior misfires, revert to prior static `게임 공유` label and retain toast behavior.
