#!/usr/bin/env node
// Rebuild the transparent 80x96, four-frame sprite atlas from the game artwork.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const zlib=require('node:zlib');
const root=path.join(__dirname,'..');
const cellW=80,cellH=96,frames=4,rows=11,width=cellW*frames,height=cellH*rows;
const pixels=Buffer.alloc(width*height*4);
let originX=0,originY=0,color='#000000';
function rgba(value){
  const hex=value.replace('#','');
  if(hex.length===3)return [parseInt(hex[0]+hex[0],16),parseInt(hex[1]+hex[1],16),parseInt(hex[2]+hex[2],16),255];
  if(hex.length===6||hex.length===8)return [0,2,4,6].map((i,n)=>n===3?(hex.length===8?parseInt(hex.slice(6,8),16):255):parseInt(hex.slice(i,i+2),16));
  throw new Error(`Unsupported sprite color ${value}`);
}
const ctx={set fillStyle(v){color=v},get fillStyle(){return color},fillRect(x,y,w,h){
  const paint=rgba(color),left=Math.round(originX+x),top=Math.round(originY+y);
  for(let yy=Math.max(0,top);yy<Math.min(height,top+Math.round(h));yy++)for(let xx=Math.max(0,left);xx<Math.min(width,left+Math.round(w));xx++){
    const o=(yy*width+xx)*4;for(let c=0;c<4;c++)pixels[o+c]=paint[c];
  }
}};
const el={getContext(){return ctx},addEventListener(){},focus(){},setAttribute(){}};
const document={getElementById(){return el},addEventListener(){},querySelector(){return el}};
const window={__ARCADE_EXPORT__:true,addEventListener(){}};
const sandbox={window,document,localStorage:{getItem(){return null}},requestAnimationFrame(){},Math,console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),sandbox);
const art=window.__ARCADE_EXPORT__;
if(!art)throw new Error('Game artwork export not available');
const people=[...art.villains,...art.bystanders];
for(let row=0;row<rows;row++)for(let frame=0;frame<frames;frame++){
  originX=frame*cellW+40;originY=row*cellH+64;
  if(row===rows-1)art.drawDrone(frame);
  else if(row<art.villains.length)art.drawVillain(people[row],frame);
  else art.drawCivilian(people[row],frame);
}
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0)}return (crc^0xffffffff)>>>0}
function chunk(type,data){const name=Buffer.from(type),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([size,name,data,sum])}
const raw=Buffer.alloc(height*(1+width*4));for(let y=0;y<height;y++)pixels.copy(raw,y*(1+width*4)+1,y*width*4,(y+1)*width*4);
const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
fs.writeFileSync(path.join(root,'assets/sprites.png'),png);
const manifest={frameWidth:cellW,frameHeight:cellH,frames,origin:[40,64],rows:Object.fromEntries([...people.map((p,i)=>[p.id,i]),['drone',10]])};
fs.writeFileSync(path.join(root,'assets/sprites.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Wrote ${width}x${height} sprite sheet (${png.length} bytes)`);
