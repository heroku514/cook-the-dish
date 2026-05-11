# 语音备忘 (Voice Translate App)

English-audio → Chinese-text post-meeting translator. Single-file
static web app, no build step.

## 用法

1. **打开**:浏览器打开 `index.html`(本地双击即可,或部署到任何静态托管)。
2. **填 Key**:右上角齿轮 → 填入 OpenAI Key(Whisper 转写)+ Anthropic Key(Claude 翻译)→ 保存。Key 仅存浏览器本机 `localStorage`,不上传任何第三方服务器。
3. **录音**:点中间圆按钮开始,再点一次结束。
4. **看结果**:几秒后列表里出现新条目 — 标题是 AI 摘的 6-12 字概括,正文是中文翻译;在设置里勾「同时保留英文原文」可看到原始英文转写。

## 装到 iPhone 桌面(像 App 一样)

1. 在 iPhone 上用 Safari 打开 `index.html` 的网址。
2. 点底部分享按钮 → 「添加到主屏幕」→ 完成。
3. 主屏幕图标点开就和 App 体验一样,Safari 地址栏不会出现。

## 隐蔽使用建议

- 标题就叫「语音备忘」、图标就是普通备忘风格,旁观者看一眼像是在记笔记。
- 开会前把屏幕亮度调到最低、App 切到前台、勿动手机。
- **iOS Safari 限制**:屏幕一锁或切到别的 App,麦克风就会停。这是浏览器层面的限制,任何 PWA 都改不了。要真正后台/锁屏录音,只能做原生 iOS App。

## 已知限制

- Whisper 单次音频 ~25MB(约 24 分钟)。本 App 已自动每 4 分钟切一段,长会议会切多段并行转写后拼接,不用手动操作。
- 浏览器直接调用 OpenAI / Anthropic 接口意味着 API Key 暴露在本机 — 自用没问题,**不要把这份 App 公开部署给陌生人用**。要公开发布请把这两个 fetch 调用换成你自己的后端转发。
- Apple Watch 不支持 — PWA 上不了 watchOS。

## 文件

- `index.html` — 全部代码(HTML + CSS + JS)。
