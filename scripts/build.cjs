const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'src/template.html'),'utf8');
for(const [marker,file]of Object.entries({STYLES:'styles.css',CABLES:'cables.js',MODEL:'model.js',APP:'app.js'})){
  html=html.replace(`/* {{${marker}}} */`,()=>fs.readFileSync(path.join(root,'src',file),'utf8'));
}
for(const filename of ['simulador.html','index.html']){
  const target=path.join(root,filename);
  if(process.argv.includes('--check')){
    if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==html){console.error(`${filename} desatualizado: execute npm run build.`);process.exitCode=1;}
  }else fs.writeFileSync(target,html);
}
