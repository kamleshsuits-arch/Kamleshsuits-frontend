const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.fulfill({json:[]}));
  await page.goto('http://127.0.0.1:5174/');
  const results = await page.evaluate(async () => {
    const { fetchLocationJson, lookupPincode, lookupCoordinates } = await import('/src/utils/locationLookup.js');
    const original = window.fetch;
    const results = [];
    const test = async (name, fn) => { try { await fn(); results.push({name,status:'PASS'}); } catch(e) {results.push({name,status:'FAIL',error:e.message});} };
    await test('Hung geocoder aborts within bounded timeout', async () => {
      window.fetch = (_url, options) => new Promise((_resolve,reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted','AbortError'))));
      const start = performance.now();
      try { await fetchLocationJson('https://test.invalid', 80); throw new Error('Did not abort'); } catch(e) { if(e.name !== 'AbortError') throw e; }
      if(performance.now()-start > 1000) throw new Error('Timeout was too slow');
    });
    await test('Successful PIN lookup cached', async () => {
      let calls=0; window.fetch=async()=>{calls++;return {ok:true,json:async()=>[{Status:'Success',PostOffice:[{District:'Gurugram'}]}]};};
      await lookupPincode('122505'); await lookupPincode('122505'); if(calls!==1) throw new Error('Duplicate fetch');
    });
    await test('Unknown PIN rejected', async()=> { window.fetch=async()=>({ok:true,json:async()=>[{Status:'Error'}]}); let rejected=false; try{await lookupPincode('999998');}catch{rejected=true;} if(!rejected)throw new Error('Accepted invalid PIN'); });
    await test('Coordinates missing PIN never invent one',async()=>{window.fetch=async()=>({ok:true,json:async()=>({address:{country_code:'in',city:'Gurugram'}})}); const place=await lookupCoordinates(28.42,76.8); if(place.postcode!=='')throw new Error('Invented postcode');});
    await test('Foreign coordinate rejected',async()=>{window.fetch=async()=>({ok:true,json:async()=>({address:{country_code:'us',postcode:'100001'}})}); let rejected=false;try{await lookupCoordinates(40,-73);}catch{rejected=true;}if(!rejected)throw new Error('Accepted foreign address');});
    await test('Invalid building postcode uses valid locality postcode', async()=>{window.fetch=async url=>({ok:true,json:async()=>({address:{country_code:'in',postcode:new URL(url).searchParams.get('zoom')==='18'?'invalid':'122504'}})}); const place=await lookupCoordinates(28.43,76.81); if(place.postcode!=='122504')throw new Error('Valid locality PIN lost');});
    window.fetch=original;
    return results;
  });
  fs.mkdirSync('audit-results',{recursive:true}); fs.writeFileSync('audit-results/location-resilience.json',JSON.stringify(results,null,2)); console.log(JSON.stringify(results,null,2)); await browser.close();
  if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
})().catch(e=>{console.error(e);process.exitCode=1;});
