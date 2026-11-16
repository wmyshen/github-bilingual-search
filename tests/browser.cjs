const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const dist=path.resolve('dist');
const fixture='<html><head><title>GitHub search fixture</title></head><body style="margin:40px"><main><h1>GitHub Repository search</h1><div data-testid="results-list"><article id="original">原生中文项目（测试夹具）</article></div></main></body></html>';
(async()=>{
const report=[];
for(const [name,exe] of [['chrome','C:/Program Files/Google/Chrome/Application/chrome.exe'],['edge','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']]){
 const ctx=await chromium.launchPersistentContext(path.resolve('.test-profiles',name),{executablePath:exe,headless:true,viewport:{width:1100,height:850},args:[`--disable-extensions-except=${dist}`,`--load-extension=${dist}`]});
 try{
 let worker=ctx.serviceWorkers()[0];if(!worker && name==='edge')worker=await ctx.waitForEvent('serviceworker',{timeout:10000});
 const integrated=!!worker;
 if(worker)await worker.evaluate(()=>{
  globalThis.fetch=async(url,init)=>{
   if(String(url).startsWith('https://api.github.com'))return new Response(JSON.stringify({items:[{id:1,full_name:'test/password-manager',description:'English password manager fixture',stargazers_count:99,language:'TypeScript',html_url:'https://github.com/test/password-manager'}]}),{status:200});
   return new Response('',{status:401});
  };
 });
 const page=await ctx.newPage();await page.route('https://github.com/**',r=>r.fulfill({contentType:'text/html',body:fixture}));
 if(!integrated)await page.addInitScript(()=>{globalThis.chrome={runtime:{sendMessage:async m=>{
  if(m.type==='translate')return m.query.includes('密码管理器')?{ok:true,data:{english:'password manager'}}:{ok:false,error:'词库未覆盖此查询，请配置模型。'};
  if(m.type==='search'){await new Promise(r=>setTimeout(r,100));return {ok:true,data:{query:m.english,repos:[{id:1,full_name:'test/password-manager',description:'English password manager fixture',stargazers_count:99,language:'TypeScript',html_url:'https://github.com/test/password-manager'}]}};}
  return {ok:true,data:{}};
 }}};});
 const go=async(q)=>{await page.goto('https://github.com/search?'+new URLSearchParams({q,type:'repositories'}));if(!integrated)await page.addScriptTag({path:path.join(dist,'content.js')});};
 await go('密码管理器');await page.getByRole('link',{name:'test/password-manager'}).waitFor();assert.equal(await page.locator('#original').count(),1);
 await page.getByLabel('英文搜索关键词').fill('password vault');await page.getByRole('button',{name:'搜索',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#github-bilingual-search')?.shadowRoot?.textContent.includes('英文查询：password vault'));
 await page.screenshot({path:path.resolve(name+'-fixture-light.png')});
 await page.evaluate(()=>{document.documentElement.style.cssText='--fgColor-default:#e6edf3;--bgColor-default:#0d1117;--bgColor-muted:#161b22;--borderColor-default:#30363d;--fgColor-muted:#9da7b3;--fgColor-accent:#58a6ff;--borderColor-muted:#30363d;background:#0d1117;color:#e6edf3';});
 await page.screenshot({path:path.resolve(name+'-fixture-dark.png')});
 await page.evaluate(()=>{history.pushState({},'','/search?q=password&type=repositories');document.body.append(document.createElement('span'));});await page.locator('#github-bilingual-search').waitFor({state:'detached'});
 await page.goBack();await page.locator('#github-bilingual-search').waitFor();
 await go('特别复杂的知识问答软件');await page.getByText(/词库未覆盖/).waitFor();
 await go('知识库 org:example');await page.getByText(/暂不支持此筛选语法/).waitFor();
 // Outstanding search must not repopulate a subsequent English page.
 await go('密码管理器');await page.evaluate(()=>{history.pushState({},'','/search?q=english&type=repositories');document.body.append(document.createElement('span'));});await page.locator('#github-bilingual-search').waitFor({state:'detached'});
 if(worker){
  const id=new URL(worker.url()).host;const options=await ctx.newPage();await options.goto(`chrome-extension://${id}/options.html`);await options.getByText('尚未保存密钥', {exact:false}).waitFor();
  // Configure only the isolated test profile; no real credentials are used.
  await options.getByLabel('API Base URL').fill('https://api.github.com');
  await options.getByLabel('模型名称').fill('test-model');await options.getByLabel('API Key',{exact:true}).fill('FAKE-TEST-KEY');
  await options.getByRole('button',{name:'授权并保存'}).click();await options.getByText('已保存。返回 GitHub 搜索页并刷新即可使用。').waitFor();
  const secrets=await worker.evaluate(async()=>({local:await chrome.storage.local.get('apiKey'),session:await chrome.storage.session.get('apiKey')}));assert.deepEqual(secrets.local,{});assert.equal(secrets.session.apiKey,'FAKE-TEST-KEY');
  await worker.evaluate(()=>{globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:'personal document organizer'}}]}),{status:200});});
  await options.getByRole('button',{name:'测试连接'}).click();await options.getByText(/连接成功/).waitFor();
  await worker.evaluate(()=>{globalThis.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:'not valid\nmultiple lines'}}]}),{status:200});});
  await options.getByRole('button',{name:'测试连接'}).click();await options.getByText(/模型返回格式无效/).waitFor();
  await worker.evaluate(()=>{globalThis.fetch=async()=>new Response('',{status:401});});
  await options.getByRole('button',{name:'测试连接'}).click();await options.getByText(/接口拒绝认证/).waitFor();
  await options.getByRole('button',{name:'清除全部配置和密钥'}).click();await options.getByText('配置、密钥、缓存和可选接口权限已清除。').waitFor();
  const data=await worker.evaluate(async()=>({local:await chrome.storage.local.get(null),session:await chrome.storage.session.get(null)}));assert.deepEqual(data,{local:{},session:{}});
 }
 report.push({browser:name,extensionLoaded:integrated,mode:integrated?'real extension with mock HTTP':'content-script injection with mock messaging',result:'passed',scenarios:['results preserve original','manual English search','light/dark screenshot','SPA English removal','history back','missing key','unsupported scope','stale navigation',...(integrated?['options page','wrong API key','clear secrets']:[])]});
 }catch(e){report.push({browser:name,result:'failed',error:e.stack});}finally{await ctx.close();}
}
await fs.writeFile('ui-test-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(report.some(r=>r.result==='failed'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});


