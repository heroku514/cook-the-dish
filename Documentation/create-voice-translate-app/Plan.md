# Plan - Create Voice Translate App

## Goal
A minimal, mobile-first, discreet **English-audio → Chinese-text**
App for a user working in an English-speaking environment who wants
post-meeting Chinese translations without obviously using a
translator in front of colleagues.

## User scenario (verbatim from user, 2026-05-11)
> 我的英文水平不好,但是我正在英文环境工作,经常开会或者和同事沟通时
> 听不懂。我想打开手机/Apple Watch 的录音功能,立马给我中文的完整翻译。
> 简单方便,一点开录音,手机就比较快地有中文翻译。
> 希望功能稍微隐蔽 — 不想让别人知道我在这样用,
> 不是那种拿手机对着人翻译的方式。
> 正常聊天/开会时,打开手表或手机的录音在后台运行,
> 结束后我自己点开手机就有完整的中文翻译。

## Approach
- **Form**: single-file static web app at
  `voice-translate-app/index.html`. No build step, no package
  manager. Open in any modern mobile browser (Safari iOS,
  Chrome Android), "Add to Home Screen" to act like an App.
- **Recording**: browser `MediaRecorder` API → `audio/webm` or
  `audio/mp4` blob.
- **Transcription**: POST blob to OpenAI Whisper API
  (`/v1/audio/transcriptions`, model `whisper-1`), prompt forces
  English source.
- **Translation**: POST transcribed text to Anthropic Messages API
  (model `claude-sonnet-4-6` — most recent stable Sonnet that handles
  long context well; user can swap in settings).
- **Storage**:
  - API keys → `localStorage` (set once via a Settings sheet).
  - Translation history → `localStorage` JSON array.
- **Disguise UI**: looks like a plain voice-memo app — title
  "语音备忘", neutral palette, the record button is the only obvious
  control, translations look like memo descriptions in a list.

## Out of scope (will document, not implement)
- True background recording (iOS PWA limit).
- Apple Watch companion (requires Swift / WatchOS).
- Real-time / live translation during the meeting — current scope
  is post-recording only, matching user's stated flow.

## Architecture notes
- All network calls happen from the browser directly to OpenAI &
  Anthropic. **Security trade-off**: this exposes API keys to the
  device, fine for personal-use on the user's own phone, **not** OK
  if the App is ever published. A backend (Next.js API route) is the
  upgrade path if needed later.
- For meetings > 24MB / ~25min, we'll auto-chunk the audio client-
  side using a fixed time-slice MediaRecorder restart loop, then
  concatenate transcripts before translation.
