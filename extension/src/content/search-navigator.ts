export function waitForSearchResults(timeoutMs = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let lastCount = 0;
    let stableMs = 0;

    const check = () => {
      const cards = document.querySelectorAll(
        '[data-testid="item-card"], a[href*="/product/"], [class*="ItemCard"]'
      );
      const noResults = document.querySelector(
        '[data-testid="no-results"], [class*="NoResults"], [class*="no-results"]'
      );

      if (noResults) {
        cleanup();
        resolve(true);
        return;
      }

      if (cards.length > 0 && cards.length === lastCount) {
        stableMs += 500;
        if (stableMs >= 1500) {
          cleanup();
          resolve(true);
          return;
        }
      } else {
        stableMs = 0;
        lastCount = cards.length;
      }

      if (Date.now() - startTime > timeoutMs) {
        cleanup();
        resolve(cards.length > 0);
      }
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = setInterval(check, 500);

    function cleanup() {
      observer.disconnect();
      clearInterval(interval);
    }
  });
}
