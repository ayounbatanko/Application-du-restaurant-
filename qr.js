/* RestoGest - générateur de QR code (hors ligne, niveau de correction M, versions 1 à 10) */
window.RGQR=(function(){
var ECC=[10,16,26,18,24,16,18,22,22,26],BLK=[1,1,1,2,2,4,4,4,5,5];
function raw(v){var r=(16*v+128)*v+64;if(v>=2){var n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r}
function mul(x,y){var z=0;for(var i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z}
function rsDiv(d){var r=[],i,j,k=1;for(i=0;i<d-1;i++)r.push(0);r.push(1);for(i=0;i<d;i++){for(j=0;j<r.length;j++){r[j]=mul(r[j],k);if(j+1<r.length)r[j]^=r[j+1]}k=mul(k,2)}return r}
function rsRem(data,div){var r=div.map(function(){return 0});data.forEach(function(b){var f=b^r.shift();r.push(0);div.forEach(function(c,i){r[i]^=mul(c,f)})});return r}
function utf8(s){return Array.from(unescape(encodeURIComponent(s))).map(function(c){return c.charCodeAt(0)})}
function bit(x,i){return (x>>>i)&1}
function make(text){
  var bytes=utf8(text),ver,cap;
  for(ver=1;ver<=10;ver++){cap=Math.floor(raw(ver)/8)-ECC[ver-1]*BLK[ver-1];if(4+(ver<10?8:16)+8*bytes.length<=cap*8)break}
  if(ver>10)throw new Error('Texte trop long pour le QR code');
  var bits=[];function put(v,n){for(var i=n-1;i>=0;i--)bits.push(bit(v,i))}
  put(4,4);put(bytes.length,ver<10?8:16);bytes.forEach(function(b){put(b,8)});
  put(0,Math.min(4,cap*8-bits.length));while(bits.length%8)bits.push(0);
  for(var pad=0xEC;bits.length<cap*8;pad^=0xEC^0x11)put(pad,8);
  var data=[];for(var i=0;i<bits.length;i+=8){var b=0;for(var j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b)}
  var nb=BLK[ver-1],el=ECC[ver-1],rc=Math.floor(raw(ver)/8),ns=nb-rc%nb,sl=Math.floor(rc/nb),blocks=[],k=0,div=rsDiv(el);
  for(i=0;i<nb;i++){var dat=data.slice(k,k+sl-el+(i<ns?0:1));k+=dat.length;var ecc=rsRem(dat,div);if(i<ns)dat.push(0);blocks.push(dat.concat(ecc))}
  var all=[];for(i=0;i<blocks[0].length;i++)blocks.forEach(function(bl,j){if(i!=sl-el||j>=ns)all.push(bl[i])});
  var size=ver*4+17,M=[],F=[];for(i=0;i<size;i++){M.push(new Array(size).fill(false));F.push(new Array(size).fill(false))}
  function setF(x,y,d){M[y][x]=d;F[y][x]=true}
  for(i=0;i<size;i++){setF(6,i,i%2==0);setF(i,6,i%2==0)}
  function finder(x,y){for(var dy=-4;dy<=4;dy++)for(var dx=-4;dx<=4;dx++){var d=Math.max(Math.abs(dx),Math.abs(dy)),xx=x+dx,yy=y+dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)setF(xx,yy,d!=2&&d!=4)}}
  finder(3,3);finder(size-4,3);finder(3,size-4);
  var na=ver==1?0:Math.floor(ver/7)+2,ap=[];
  if(na){var step=ver==32?26:Math.ceil((ver*4+4)/(na*2-2))*2;ap=[6];for(var pos=size-7;ap.length<na;pos-=step)ap.splice(1,0,pos)}
  ap.forEach(function(a,ia){ap.forEach(function(b,ib){if((ia==0&&ib==0)||(ia==0&&ib==na-1)||(ia==na-1&&ib==0))return;
    for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++)setF(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!=1)})});
  function fmt(mask){var d=mask,r=d;for(var i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);var bits=((d<<10)|r)^0x5412;
    for(i=0;i<=5;i++)setF(8,i,bit(bits,i));setF(8,7,bit(bits,6));setF(8,8,bit(bits,7));setF(7,8,bit(bits,8));for(i=9;i<15;i++)setF(14-i,8,bit(bits,i));
    for(i=0;i<8;i++)setF(size-1-i,8,bit(bits,i));for(i=8;i<15;i++)setF(8,size-15+i,bit(bits,i));setF(8,size-8,true)}
  fmt(0);
  if(ver>=7){var r=ver;for(i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);var vb=(ver<<12)|r;for(i=0;i<18;i++){var a=size-11+i%3,b2=Math.floor(i/3);setF(a,b2,bit(vb,i));setF(b2,a,bit(vb,i))}}
  var n=0;for(var right=size-1;right>=1;right-=2){if(right==6)right=5;for(var v=0;v<size;v++)for(var j2=0;j2<2;j2++){var x=right-j2,y=((right+1)&2)==0?size-1-v:v;if(!F[y][x]&&n<all.length*8){M[y][x]=!!bit(all[n>>>3],7-(n&7));n++}}}
  function mask(m){for(var y=0;y<size;y++)for(var x=0;x<size;x++){var inv;switch(m){case 0:inv=(x+y)%2==0;break;case 1:inv=y%2==0;break;case 2:inv=x%3==0;break;case 3:inv=(x+y)%3==0;break;
    case 4:inv=(Math.floor(x/3)+Math.floor(y/2))%2==0;break;case 5:inv=x*y%2+x*y%3==0;break;case 6:inv=(x*y%2+x*y%3)%2==0;break;default:inv=((x+y)%2+x*y%3)%2==0}
    if(!F[y][x]&&inv)M[y][x]=!M[y][x]}}
  function pen(){var p=0,y,x,run,dark=0;for(var t=0;t<2;t++){for(y=0;y<size;y++){run=1;for(x=1;x<size;x++){var c=t?M[x][y]:M[y][x],pr=t?M[x-1][y]:M[y][x-1];if(c==pr){run++;if(run==5)p+=3;else if(run>5)p++}else run=1}}}
    for(y=0;y<size;y++)for(x=0;x<size;x++){if(M[y][x])dark++;if(x&&y&&M[y][x]==M[y][x-1]&&M[y][x]==M[y-1][x]&&M[y][x]==M[y-1][x-1])p+=3}
    return p+Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10}
  var best=0,bp=1e9;for(var m=0;m<8;m++){mask(m);fmt(m);var pp=pen();if(pp<bp){bp=pp;best=m}mask(m)}
  mask(best);fmt(best);return M}
function svg(text,px){var M=make(text),n=M.length,q=4,d='';M.forEach(function(row,y){var x=0;while(x<n){if(row[x]){var s=x;while(x<n&&row[x])x++;d+='M'+(s+q)+','+(y+q)+'h'+(x-s)+'v1h-'+(x-s)+'z'}else x++}});
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(n+2*q)+' '+(n+2*q)+'" width="'+(px||200)+'" height="'+(px||200)+'" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="'+d+'" fill="#14213d"/></svg>'}
return {make:make,svg:svg}})();
