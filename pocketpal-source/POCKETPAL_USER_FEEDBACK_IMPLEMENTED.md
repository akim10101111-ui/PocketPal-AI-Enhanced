# PocketPal AI — changes based on user feedback

This update combines a focused stability patch with a restrained visual refresh on top of the supplied PocketPal AI source snapshot. It avoids duplicate functionality and keeps the established theme and navigation architecture intact.

## Implemented in this source update

### 1. Safer model replacement on Android
- A validated download is written to the existing `.part` staging file.
- If a completed model already exists at the destination, it is preserved while the replacement downloads.
- At commit time, the old model is moved to a same-directory `.bak` file before the new file is promoted.
- If promotion fails, the old model is restored.
- If the app is terminated during the swap, the next download run recovers the `.bak` file or removes a stale backup after a successful commit.
- A previously completed model record is distinguished from an abandoned partial file, so a replacement attempt does not delete the working model before the network request succeeds.

### 2. Safer iOS model downloads
- Downloads go to `model-file.part`, not directly to the final model path.
- The HTTP status and on-disk file size are checked before the file can become loadable.
- A truncated/empty response is rejected and its partial file is cleaned up.
- An existing model is held as `model-file.bak` during the final replacement and restored if the new file cannot be promoted.
- A stale backup is recovered/cleaned on the next attempt.
- Progress math is guarded against missing content-length values so invalid percentages/ETAs are not emitted.

### 3. Benchmark result validation
- The Benchmark screen now rejects zero, missing, infinite, or `NaN` prompt/generation speed measurements.
- Invalid results are not persisted or submitted as successful benchmark data.

### 4. Visual polish from the “outdated design” feedback
- Settings screen: more breathing room, clearer surface separation, softer rounded cards, consistent horizontal padding, and less crowded vertical rhythm.
- Model cards: refined corner radius, clearer surface/border contrast, improved internal spacing, and more comfortable details spacing.
- Pals screen: more deliberate top spacing and a safer bottom content inset so cards do not feel cramped near the floating/bottom controls.
- Chat screen and composer: deliberately unchanged; the previous composer-style experiment was reverted to the upstream PocketPal file.
- Changes use the existing theme tokens so light/dark mode remain theme-driven. This is a visual refinement pass, not a full redesign of every screen; a complete redesign still needs screenshot/device review.

## Regression tests added/updated

- Android: replacing a model fails without deleting the previous completed file.
- Android: successful replacement commits the new model and removes the backup.
- Android: an interrupted replacement restores the backup before retrying.
- iOS: download uses a `.part` file, verifies size, and promotes only after validation.
- iOS: an incomplete response is rejected rather than promoted.
- Benchmark screen: invalid measurements are not stored.

## Functionality already present in the supplied project

The supplied snapshot already includes Android resumable downloads, model memory estimation and calibration, device-rule model presets, persistent chat history, edit/regenerate and pinned-chat flows, Markdown export, Whisper-based speech-to-text, system/engine text-to-speech, image/vision support, and web-tool consent notices. These were inspected and not reimplemented.

## Not claimed as completed

The following larger requests still need separate implementation and/or physical-device validation: user-managed long-term Pal memory (review/edit/delete saved facts), transparent chat summarization and context compaction, a fully tested fast/balanced/quality recommender with measured per-device speeds, Russian offline Kokoro voice assets, a unified local-vs-network privacy explanation, and regression testing of Samsung/Pixel/Xiaomi/Honor STT, GPU, OOM, and voice/vision combinations.

## Verification status

- `node scripts/validate-l10n.js`: passed; all locale JSON files are valid.
- `src/locales/en.json` and Android device-rule JSON parsing: passed.
- Jest tests and TypeScript typecheck: not run successfully because `node_modules` is absent. The environment has Node 22.16.0 while this project requires Node >=22.21.0.
- Android unit tests / APK build: blocked before Gradle configuration because the Gradle wrapper distribution could not be downloaded (`UnknownHostException: services.gradle.org`) and no Android SDK is configured in this environment.

The source changes and tests are included, but this archive is not a verified APK build.

## v3 sidebar/navigation refresh (2026-11-22)

- Reworked the left drawer around a clear PocketPal header and a prominent localized New chat action.
- Main navigation is now grouped near the top (Chat, Pals, Models).
- Chat history is separated under a dedicated Chats heading rather than visually blending into navigation.
- Secondary utilities (Benchmark, Settings, PocketPal Plus, App Info, and debug tools) moved into a lower drawer section separated by a divider, keeping Settings easy to find without crowding the primary navigation.
- Updated drawer row height, margins, rounded surfaces, header typography, and spacing.
- The New chat action resets the active session and navigates to Chat; it does not add model modes or arbitrary Fast/Balanced/Smart presets.
- The drawer keeps existing localization for the New chat label and existing route/store behavior for other navigation items.

Validation: source-level review performed. Automated tests/build were not run because this checkout has no `node_modules` installed and the earlier environment had no Android SDK/network access for Gradle.
