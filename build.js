const fs=require('fs');
fs.mkdirSync('dist/assets',{recursive:true});
fs.copyFileSync('index.html','dist/index.html');
fs.copyFileSync('shop.html','dist/shop.html');
for(const f of fs.readdirSync('.')) if(f.endsWith('.webp')) fs.copyFileSync(f,'dist/assets/'+f);
console.log('built');
