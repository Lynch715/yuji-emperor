async (page) => {
  // Run with playwright-cli --session yuji-batch1 run-code
  // --filename scripts/batch1-font-startup.pw.js after npm run build/serve.
  const results = [];
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  for (const width of [360, 1280]) {
    let release, pending = 0;
    const held = new Promise(resolve => { release = resolve; });
    const holdFont = async route => {
      pending++;
      await held;
      await route.abort();
    };
    await page.route('https://fonts.googleapis.com/**', holdFont);
    await page.setViewportSize({width, height: 900});
    const began = Date.now();
    try {
      await page.goto('http://127.0.0.1:4174/', {waitUntil: 'commit'});
      await page.locator('#app').waitFor({state:'visible', timeout:2000});
      await page.waitForFunction(() => document.querySelector('#app')?.textContent.trim().length > 20, null, {timeout:2000});
      await page.waitForFunction(() => performance.getEntriesByType('paint').some(e=>e.name==='first-contentful-paint'), null, {timeout:2000});
      const metrics = await page.evaluate(() => ({
        paintMs:performance.getEntriesByType('paint').find(e=>e.name==='first-contentful-paint')?.startTime,
        width:innerWidth, scrollWidth:document.documentElement.scrollWidth,
        text:document.querySelector('#app').innerText.slice(0,60),
      }));
      metrics.elapsedMs=Date.now()-began;metrics.fontRequestsHeld=pending;
      if (!pending || metrics.paintMs >= 2000 || metrics.elapsedMs >= 2000 || metrics.scrollWidth > width)
        throw new Error('A2 字体挂起首屏未通过：'+JSON.stringify(metrics));
      await page.screenshot({path:'output/playwright/batch1-font-startup-'+width+'.png'});
      results.push(metrics);
    } finally {
      release();
      await page.unroute('https://fonts.googleapis.com/**',holdFont);
    }
  }
  return {test:'A2 Google Fonts请求挂起时首屏在2秒内显示',passed:true,results};
}
