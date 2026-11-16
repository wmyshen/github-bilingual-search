export const dictionary: Record<string,string> = Object.fromEntries([
 ['本地知识库','local knowledge base'],['密码管理器','password manager'],['截图工具','screenshot tool'],['笔记软件','note taking'],['任务管理','task manager'],['待办事项','todo'],['时间追踪','time tracking'],['文件同步','file sync'],['文件管理器','file manager'],['网盘','cloud storage'],
 ['下载工具','download manager'],['下载器','downloader'],['视频下载','video downloader'],['音乐播放器','music player'],['视频播放器','video player'],['图片压缩','image compression'],['图片编辑','image editor'],['录屏工具','screen recorder'],['剪贴板管理','clipboard manager'],['远程桌面','remote desktop'],
 ['思维导图','mind map'],['流程图','flowchart'],['电子书阅读器','ebook reader'],['翻译工具','translator'],['文字识别','OCR'],['语音识别','speech recognition'],['语音合成','text to speech'],['聊天机器人','chatbot'],['机器学习框架','machine learning framework'],['深度学习','deep learning'],
 ['向量数据库','vector database'],['数据库管理','database management'],['数据库客户端','database client'],['接口测试','API testing'],['负载测试','load testing'],['性能监控','performance monitoring'],['日志管理','log management'],['网站分析','web analytics'],['静态博客','static blog'],['静态网站生成器','static site generator'],
 ['文档生成器','documentation generator'],['低代码平台','low code'],['自动化工作流','workflow automation'],['爬虫框架','web scraping framework'],['浏览器自动化','browser automation'],['单元测试','unit testing'],['代码编辑器','code editor'],['终端模拟器','terminal emulator'],['反向代理','reverse proxy'],['内网穿透','reverse tunnel'],
 ['个人知识管理','personal knowledge management'],['本地大模型','local LLM'],['文档问答','document RAG'],['备份工具','backup'],['书签管理','bookmark manager'],['自托管','self hosted']
]);
export const hasChinese = (s:string) => /\p{Script=Han}/u.test(s);
export function parseQuery(q:string) {
 if(q.length>500) throw new Error('查询过长，请缩短到 500 字以内。');
 if(/["'()]/.test(q) || /(?:^|\s)(AND|OR|NOT)(?:\s|$)/.test(q)) throw new Error('暂不支持引号、括号或布尔表达式，请使用简单关键词。');
 const words:string[]=[], filters:string[]=[];
 for(const token of q.trim().split(/\s+/)) {
  if(token.includes(':')) {
   if(!/^(language:[\w+#.-]+|stars:(?:[<>]=?)?\d+(?:\.\.\d+)?|fork:(?:true|false|only)|archived:(?:true|false)|topic:[a-zA-Z0-9-]+)$/.test(token)) throw new Error('暂不支持此筛选语法；原生结果保持不变。支持 language、stars、fork、archived、topic。');
   filters.push(token);
  } else words.push(token);
 }
 const text=words.join(' ').trim();
 if(!text) throw new Error('请填写项目关键词。');
 return {text,filters};
}
export function validateEnglish(value:unknown):string {
 if(typeof value!=='string') throw new Error('模型未返回有效英文关键词。');
 const s=value.trim();
 if(!s || s.length>160 || hasChinese(s) || /[\r\n:"`{}()[\]<>]/.test(s) || !/[a-zA-Z]/.test(s) || /(?:^|\s)(AND|OR|NOT)(?:\s|$)/.test(s)) throw new Error('模型返回格式无效；请手动输入英文关键词或调整模型。');
 return s;
}
export function endpoint(base:string) {
 const u=new URL(base.trim());
 if(u.protocol!=='https:' || u.username || u.password || u.search || u.hash) throw new Error('Base URL 必须是无账号、查询参数的 HTTPS 地址。');
 u.pathname=u.pathname.replace(/\/$/,'')+'/chat/completions';
 return u;
}
export type Repo={id:number;full_name:string;description:string|null;stargazers_count:number;language:string|null;html_url:string};
export function reposFrom(data:unknown):Repo[] {
 if(!data || !Array.isArray((data as {items?:unknown}).items)) throw new Error('GitHub 响应格式无效。');
 const seen=new Set<number>();
 return (data as {items:Repo[]}).items.filter(r=>{
  if(!r || !Number.isInteger(r.id) || seen.has(r.id) || typeof r.full_name!=='string' || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(r.html_url)) return false;
  seen.add(r.id); return true;
 }).slice(0,10);
}
export class Generation {
 private value=0;
 next(){return ++this.value;}
 current(n:number){return n===this.value;}
}
export type Entry<T>={expires:number;value:T};
export function cached<T>(entry:Entry<T>|undefined,now=Date.now()):T|undefined {return entry && entry.expires>now ? entry.value:undefined;}
export class SingleFlight {
 private tasks=new Map<string,Promise<unknown>>();
 run<T>(key:string,fn:()=>Promise<T>):Promise<T>{
  const existing=this.tasks.get(key);if(existing)return existing as Promise<T>;
  const p=Promise.resolve().then(fn).finally(()=>this.tasks.delete(key));this.tasks.set(key,p);return p;
 }
}
export async function fetchJson(url:string,init:RequestInit={},timeout=15000):Promise<any> {
 let response:Response;
 try {response=await fetch(url,{...init,credentials:'omit',redirect:'error',signal:AbortSignal.timeout(timeout)});}
 catch(e){throw new Error(e instanceof Error && (e.name==='TimeoutError'||e.name==='AbortError')?'请求超时，请稍后重试。':'网络请求失败，请检查网络、接口地址及域名权限。');}
 if(!response.ok){
  if(response.status===429 || (response.status===403 && response.headers.get('x-ratelimit-remaining')==='0')) {
   const retry=response.headers.get('retry-after');
   const seconds=retry && /^\d+$/.test(retry) ? Date.now()+Number(retry)*1000 : retry ? Date.parse(retry):NaN;
   const reset=Number(response.headers.get('x-ratelimit-reset'))*1000;
   const time=Number.isFinite(seconds)?seconds:reset;
   throw new Error(`请求达到限额。${time>Date.now()?'可在 '+new Date(time).toLocaleTimeString()+' 后重试。':'请稍后手动重试。'}`);
  }
  if(response.status===401) throw new Error('接口拒绝认证，请检查 API Key。');
  throw new Error(`服务请求失败（HTTP ${response.status}），请检查配置或稍后重试。`);
 }
 try{return await response.json();}catch{throw new Error('服务返回的内容不是有效 JSON。');}
}

