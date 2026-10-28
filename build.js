const fs=require('fs');
fs.mkdirSync('dist/assets',{recursive:true});
for(const f of fs.readdirSync('.')){
  if(f==='build.js') continue;
  if(f.endsWith('.html')||f==='sound.js') fs.copyFileSync(f,'dist/'+f);
  else if(f.endsWith('.webp')) fs.copyFileSync(f,'dist/assets/'+f);
}
console.log('built');
