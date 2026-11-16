import {dictionary} from '../src/core.ts';
import {writeFile} from 'node:fs/promises';
const cases:[string,string[]][]=[
 ['密码管理器',['bitwarden','keepass','passbolt']],['截图工具',['flameshot','sharex','ksnip','shottr']],['笔记软件',['joplin','logseq','trilium','notesnook']],['文件同步',['syncthing','rclone','freefilesync']],['文件管理器',['files-community','spacedrive','yazi','ranger']],
 ['下载工具',['aria2','motrix','persepolis','filecentipede']],['视频下载',['yt-dlp','youtube-dl','lux','cobalt']],['音乐播放器',['music','player','mopidy','navidrome']],['视频播放器',['mpv','vlc','video','player']],['图片压缩',['squoosh','imageoptim','compress','image']],
 ['录屏工具',['obs','screen','record','capture']],['剪贴板管理',['copyq','clipboard','ditto','maccy']],['远程桌面',['rustdesk','remote','desktop','guacamole']],['思维导图',['mind','markmap']],['电子书阅读器',['foliate','koreader','ebook','reader']],
 ['文字识别',['tesseract','paddleocr','easyocr','ocr']],['语音识别',['whisper','vosk','speech','funasr']],['向量数据库',['milvus','qdrant','weaviate','chroma','vector']],['浏览器自动化',['playwright','puppeteer','selenium','browser']],['终端模拟器',['alacritty','kitty','wezterm','terminal','termux']]
];
const records:any[]=[];let previous=0;
for(const [chinese,expected] of cases){
 const record:any={chinese,english:dictionary[chinese],expected};
 for(const [name,q] of [['original',chinese],['expanded',dictionary[chinese]]]){
  await new Promise(r=>setTimeout(r,Math.max(0,7000-(Date.now()-previous))));previous=Date.now();
  try{const r=await fetch('https://api.github.com/search/repositories?'+new URLSearchParams({q,per_page:'10'}),{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});
   if(!r.ok){record[name]={error:`HTTP ${r.status}`,reset:r.headers.get('x-ratelimit-reset')};}
   else {const data=await r.json();record[name]={items:data.items.map((x:any)=>({name:x.full_name,description:x.description,url:x.html_url}))};}
  }catch(e){record[name]={error:e instanceof Error?e.message:String(e)};}
 }
 const matches=(record.expanded.items||[]).filter((x:any)=>expected.some(s=>x.name.toLowerCase().includes(s)));
 record.keywordCandidateMatch=matches.length>0;
 record.newCandidates=matches.filter((x:any)=>!record.original.items?.some((a:any)=>a.name===x.name)).map((x:any)=>x.name);
 records.push(record);console.log(chinese,record.original.error||'中文完成',record.expanded.error||'英文完成');
 await writeFile('benchmark-results.json',JSON.stringify({date:new Date().toISOString(),note:'预选关键词命中仅为候选，不等于人工语义评价。',records},null,2));
}
