# Verification - Create Voice Translate App

## 2026-05-11

### How to verify manually

1. Open `voice-translate-app/index.html` in a modern browser
   (Chrome / Safari / Firefox on desktop, or on iPhone for the
   target experience).
2. Tap the gear icon → enter an OpenAI API key (starts `sk-`) and
   an Anthropic API key (starts `sk-ant-`). Save.
3. Tap the big circular record button. The browser will ask for
   microphone permission — grant it.
4. Speak a few sentences in English. The timer should increment.
5. Tap the button again to stop. A new memo appears in the list
   in "处理中…" state. Within a few seconds, it should populate
   with the English transcript (subtitle) and the Chinese
   translation (body).
6. Reload the page; the memo list should persist (localStorage).

### Edge cases checked while implementing

- No keys configured → record still works, but on stop the memo
  shows an inline "请先在设置中填写 API Key" error instead of
  silently failing.
- Long recording (>4 min) → MediaRecorder is restarted every 4 min
  so each chunk stays under Whisper's 25MB limit; transcripts are
  joined with `\n` before translation.
- Permission denied → an error banner appears under the record
  button explaining how to re-grant in browser settings.

### Not verified (need real device)

- iPhone Safari "Add to Home Screen" install — UI is built for it
  (proper viewport, theme-color meta, apple-mobile-web-app-capable)
  but I cannot test on an actual iOS device from this environment.
- Whisper / Anthropic API responses — no keys available here to
  exercise the live request path. Code paths inspected by reading;
  request bodies and headers conform to current API specs.
- Cross-device localStorage — keys and history are device-local by
  design.

### Tests

- No automated tests added. The app is a single static HTML file
  with no dependencies, separate from the existing `app/` and
  `extension/` test suites, which are unaffected.
