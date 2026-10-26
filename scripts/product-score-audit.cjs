const {chromium}=require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:5181';
const products=Array.from({length:9},(_,i)=>({suitId:`score-${i}`,title:`Score Suit ${i}`,price:1500,discount:15,stock:1,colors:['Red'],product_category:'suits',images:['/icons/pwa-512.png'],rating:0,reviews:0}));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.addInitScript(()=>{for(const key of ['hasSeenLaunch','kamlesh_location_prompt_seen','kamlesh_notification_prompt_seen'])sessionStorage.setItem(key,'true');});
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin===base)return route.continue();if(url.pathname==='/api/products')return route.fulfill({json:products});return route.fulfill({json:[]});});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/new-arrivals');await page.locator('[data-product-score]').first().waitFor();
  const before=await page.locator('[data-product-score] > span.font-bold').allTextContents();
  assert.equal(before.length,9);assert.ok(new Set(before).size>1);assert.ok(before.every(v=>+v>=4&&+v<=4.8));
  assert.equal(await page.locator('[data-product-score="style"]').count(),9);
  for(const badge of await page.locator('[data-product-score]').all()){
   const b=await badge.boundingBox();const plus=await badge.locator('..').getByRole('button',{name:/Add .* to cart/}).boundingBox();assert.ok(b.x+b.width<=plus.x,`Badge overlaps cart button at ${width}px`);
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(width===320){await page.locator('[data-product-score]').first().scrollIntoViewIfNeeded();await page.screenshot({path:'audit-results/product-score-320.png'});}
  await page.reload();await page.locator('[data-product-score]').first().waitFor();
  assert.deepEqual(await page.locator('[data-product-score] > span.font-bold').allTextContents(),before);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,scores:before,stable:true,noOverlap:true,passed:true}));await context.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
