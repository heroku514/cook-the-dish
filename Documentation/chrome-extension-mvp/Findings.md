# Findings - Chrome Extension MVP

## 2026-05-10

### TypeScript Narrowing in Async Closures
- TS doesn't narrow null checks across async function boundaries in React components
- Fix: use `useStore.getState().recipe` inside the async function instead of relying on outer component-level null check
- Affected: IngredientList.tsx `startSearch()` function

### Instacart DOM Structure (as of implementation)
- Product cards findable via `a[href*="/product/"]` links
- Prices typically in `$X.XX` format within card elements
- Search URL pattern: `https://www.instacart.com/store/search/{encoded_query}`
- Dynamic rendering requires MutationObserver — cards load async after navigation
- Card count stabilization (1.5s of no new cards) used as "ready" signal

### MV3 Service Worker Constraints
- Service workers can go idle — used `chrome.storage.session` for job state persistence
- No DOM access in service workers — all scraping must happen in content scripts
- Message passing is async — used `chrome.runtime.sendMessage` for request/response and `chrome.runtime.connect` for streaming progress updates

### Package Version Issues
- `@types/uuid@^14.0.0` does not exist on npm — latest is v10
- Must use `uuid@^10.0.0` and `@types/uuid@^10.0.0`

### CORS for Chrome Extensions
- Chrome extensions use `chrome-extension://` origin
- Extension ID is stable per unpacked load but changes on reinstall
- Middleware checks `origin.startsWith("chrome-extension://")` for dev flexibility
