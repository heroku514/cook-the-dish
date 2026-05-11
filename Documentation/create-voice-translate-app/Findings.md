# Findings - Create Voice Translate App

## 2026-05-11

### Constraint research

- **iOS Safari + MediaRecorder**: supported since iOS 14.5. Captures
  in `audio/mp4` (AAC) by default. **Stops recording when tab is
  backgrounded or screen locks** — confirmed by Apple's docs and
  reproducible in practice. There is no PWA-only workaround.
- **Web Speech API on iOS**: `webkitSpeechRecognition` is not
  reliably available on iOS Safari, ruled out as the primary
  transcription path. Whisper API works on any device with network.
- **Whisper API file size**: hard limit ~25MB per request, ~24 min
  of AAC at typical bitrates. Long meetings need client-side
  chunking. Implemented as a fixed 4-minute time-slice loop —
  the recorder restarts every 4 min, blobs queue up, each is sent
  to Whisper in parallel after stop, transcripts concatenated in
  order.
- **Anthropic + OpenAI keys in browser**: both APIs expose CORS for
  direct browser calls, but using keys in the browser is only
  acceptable for personal use. Documented as such in Plan.md.

### Disguise / discretion

- Title set to "语音备忘" ("Voice Memo") instead of anything
  translation-related.
- Color palette: neutral grays + soft blue, mimics iOS Voice Memos.
- The record button is the only obvious control; translated text
  appears as the memo's "transcript" field, so a glance from a
  colleague sees what looks like an English transcription with
  Chinese notes — plausibly a note-taker.

### Model choice

- Translation model defaults to `claude-sonnet-4-6` — the latest
  stable Sonnet, well-balanced for translation quality + speed +
  cost. Configurable from Settings; Opus and Haiku are also offered.
