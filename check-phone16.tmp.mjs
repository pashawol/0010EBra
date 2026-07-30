import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
await page.setContent(`
<form id="f" novalidate onsubmit="return false">
  <input id="name" type="text" required>
  <input id="phone" type="tel" required>
  <button id="submit" type="submit">Go</button>
</form>
<script>
document.getElementById('f').addEventListener('submit', function(e){
  e.preventDefault();
  setTimeout(function() { document.getElementById('name').focus(); }, 0);
});
</script>
`, { waitUntil: 'load' })

await page.click('#submit')
await page.waitForTimeout(50)
console.log('active after submit:', await page.evaluate(() => document.activeElement.id))

await page.click('#phone')
console.log('active after click phone:', await page.evaluate(() => document.activeElement.id))
await browser.close()
