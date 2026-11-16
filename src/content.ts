import {Generation,hasChinese,parseQuery,validateEnglish,type Repo} from './core';
const versions=new Generation();let last='',host:HTMLElement|undefined;
async function rpc(type:string,data:object={}){const r=await chrome.runtime.sendMessage({type,...data});if(!r?.ok)throw new Error(r?.error||'扩展连接已失效，请刷新页面。');return r.data;}
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
function locationQuery(){const u=new URL(location.href);return u.pathname==='/search'&&(!u.searchParams.get('type')||u.searchParams.get('type')?.toLowerCase()==='repositories')?u.searchParams.get('q')||'':'';}
function mount(){
 const q=locationQuery();const identity=location.href;
 if(identity===last&&(!hasChinese(q)||host?.isConnected))return;
 last=identity;versions.next();host?.remove();host=undefined;
 if(!hasChinese(q))return;
 // Both anchors are observed on GitHub search; the header also supports empty results.
 const results=document.querySelector('[data-testid="results-list"]');
 const header=document.querySelector('[data-testid="search-sub-header"]');
 const anchor=results||header;
 if(!anchor || !anchor.closest('main'))return;
 const requestVersion=versions.next();
 host=el('section');host.id='github-bilingual-search';if(results)results.before(host);else header!.after(host);
 const root=host.attachShadow({mode:'open'});const css=el('style');css.textContent=`
 :host{display:block;margin:0 0 20px;color:var(--fgColor-default,#1f2328);font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif} *{box-sizing:border-box} details{border:1px solid var(--borderColor-default,#d1d9e0);border-radius:12px;background:var(--bgColor-default,#fff);overflow:hidden}summary{cursor:pointer;padding:14px 18px;font-weight:650;background:var(--bgColor-muted,#f6f8fa)}.body{padding:16px}form{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}input{flex:1;min-width:140px}input,button{font:inherit;padding:6px 10px;border:1px solid var(--borderColor-default,#d1d9e0);border-radius:6px;background:var(--bgColor-default,#fff);color:inherit}button{cursor:pointer}button:hover{background:var(--bgColor-muted,#f6f8fa)}a{color:var(--fgColor-accent,#0969da);text-decoration:none}a:hover{text-decoration:underline}.meta,.status{color:var(--fgColor-muted,#59636e);font-size:13px}.error{color:var(--fgColor-danger,#d1242f)}article{border-top:1px solid var(--borderColor-muted,#d8dee4);padding:12px 0}h3{margin:0;font-size:16px}p{margin:5px 0;overflow-wrap:anywhere}.toolbar{display:flex;gap:16px;align-items:center;flex-wrap:wrap} .status{white-space:pre-wrap}`;root.append(css);
 const details=el('details');details.open=true;details.append(el('summary','英文相关项目 · GitHub 中英搜索'));
 const body=el('div');body.className='body';details.append(body);root.append(details);
 const status=el('p','正在转换关键词…');status.className='status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const form=el('form'),input=el('input');input.placeholder='英文关键词，可修改后重新搜索';input.setAttribute('aria-label','英文搜索关键词');input.maxLength=160;
 const submit=el('button','搜索');submit.type='submit';form.append(input,submit);
 const toolbar=el('div');toolbar.className='toolbar';const link=el('a','在 GitHub 打开英文搜索');link.target='_blank';link.rel='noopener noreferrer';link.hidden=true;
 const settings=el('button','设置模型 / 清除缓存');settings.type='button';settings.onclick=()=>void rpc('openOptions').catch(()=>{});toolbar.append(link,settings);
 const list=el('div');body.append(status,form,toolbar,list);
 let sub=0;
 const active=()=>versions.current(requestVersion)&&host?.isConnected&&locationQuery()===q;
 const fail=(e:unknown)=>{status.textContent=e instanceof Error?e.message:'请求失败，请重试。';status.className='status error';};
 const run=async()=>{const n=++sub;list.replaceChildren();link.hidden=true;status.textContent='正在搜索英文项目…';status.className='status';try{
   const query=[validateEnglish(input.value),...parseQuery(q).filters].join(' ');
   link.href='https://github.com/search?'+new URLSearchParams({q:query,type:'repositories'});link.hidden=false;
   const r=await rpc('search',{original:q,english:input.value});if(!active()||n!==sub)return;
   link.href='https://github.com/search?'+new URLSearchParams({q:r.query,type:'repositories'});link.hidden=false;
   status.textContent=r.repos.length?`补充 ${r.repos.length} 个项目 · 英文查询：${r.query}`:'本次英文查询没有返回项目，可修改关键词重试。';
   for(const repo of r.repos as Repo[]){const card=el('article'),title=el('h3'),a=el('a',repo.full_name);a.href=repo.html_url;a.target='_blank';a.rel='noopener noreferrer';title.append(a);card.append(title,el('p',repo.description||'暂无项目描述'));const meta=el('p',`★ ${Number(repo.stargazers_count).toLocaleString()} · ${repo.language||'未标注语言'}`);meta.className='meta';card.append(meta);list.append(card);}
  }catch(e){if(active()&&n===sub)fail(e);}};
 form.onsubmit=e=>{e.preventDefault();void run();};
 try{parseQuery(q);}catch(e){fail(e);form.hidden=true;return;}
 const initialSub=sub;
 void rpc('translate',{query:q}).then(r=>{if(!active()||sub!==initialSub)return;input.value=r.english;input.title=r.source;void run();}).catch(e=>{if(active()&&sub===initialSub)fail(e);});
}
let timer:ReturnType<typeof setTimeout>|undefined;
const schedule=()=>{clearTimeout(timer);timer=setTimeout(mount,180);};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('popstate',schedule);document.addEventListener('turbo:load',schedule);document.addEventListener('pjax:end',schedule);mount();
