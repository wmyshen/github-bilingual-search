import {endpoint} from './core';
const byId=(id:string)=>document.getElementById(id)!;
const input=(id:string)=>byId(id) as HTMLInputElement;
async function rpc(type:string,data:object={}){const r=await chrome.runtime.sendMessage({type,...data});if(!r?.ok)throw new Error(r?.error||'扩展未响应。');return r.data;}
function status(text:string,error=false){byId('status').textContent=text;byId('status').className=error?'error':'';}
async function load(){const r=await rpc('config');input('base').value=r.config?.base||'';input('model').value=r.config?.model||'';input('remember').checked=!!r.config?.remember;input('key').value='';byId('key-state').textContent=r.hasKey?'已保存密钥，留空表示保留。':'尚未保存密钥，词库搜索仍可使用。';}
async function action(fn:()=>Promise<void>){const buttons=[...document.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{await fn();}catch(e){status(e instanceof Error?e.message:'操作失败。',true);}finally{buttons.forEach(b=>b.disabled=false);}}
byId('settings').onsubmit=e=>{e.preventDefault();void action(async()=>{
 const url=endpoint(input('base').value);
 if(!await chrome.permissions.request({origins:[url.origin+'/*']}))throw new Error('未授权接口域名，配置未保存。');
 await rpc('save',{base:input('base').value,model:input('model').value,key:input('key').value,remember:input('remember').checked});await load();status('已保存。返回 GitHub 搜索页并刷新即可使用。');
});};
byId('test').onclick=()=>void action(async()=>{status('正在测试已保存的配置…');const r=await rpc('test');status('连接成功，测试转换结果：'+r.english);});
byId('cache').onclick=()=>void action(async()=>{await rpc('clearCache');status('缓存已清除。');});
byId('clear').onclick=()=>void action(async()=>{await rpc('clear');await load();status('配置、密钥、缓存和可选接口权限已清除。');});
void load().catch(e=>status(String(e),true));
