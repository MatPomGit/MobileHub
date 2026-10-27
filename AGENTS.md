# Instructions for agents

When creating or modifying user-facing content, always follow the rules of correct Polish grammar, spelling, punctuation, and stylistic conventions in every fragment where Polish is used.

Additionally, limit the use of the long dash "—". Use it only when stylistically justified; prefer shorter and simpler sentence constructions where possible.

Exceptions to these rules:
- source code,
- tables,
- figures/illustrations.

## Android UI: Compose-first (2026-10-27)

For native Android UI written in Kotlin, use Jetpack Compose and Material 3 for new screens and components. Prefer ViewModel + StateFlow for UI state, unidirectional data flow, and Navigation Compose when navigation is needed. Keep domain logic and platform adapters independent of composables.

Existing Views/XML, fragments, LiveData or other working UI need not be rewritten. Migrate incrementally only when modifying relevant screens, with appropriate regression and accessibility checks. Preserve existing behavior, lifecycle handling, performance, and tests. Do not introduce Compose into Python, Unity, web or non-Android modules solely to satisfy this rule. Follow KISS; reuse existing components and avoid speculative abstractions or dependencies.

Reference: https://android-developers.googleblog.com/2026/05/android-ui-development-is-compose-first.html
