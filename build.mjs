import {build} from 'vite';
import {mkdir,copyFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
for (const name of ['background','content','options']) {
  await build({configFile:false,publicDir:false,build:{outDir:'dist',emptyOutDir:false,lib:{entry:`src/${name}.ts`,name:`GBS_${name}`,formats:[name==='content'?'iife':'es'],fileName:()=>`${name}.js`},minify:false}});
}
await mkdir('dist',{recursive:true});
for (const file of ['manifest.json','options.html']) await copyFile(`public/${file}`,`dist/${file}`);
