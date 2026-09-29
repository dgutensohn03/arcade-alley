const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

test('title roster renders and targets visibly rise into a round',()=>{
  const nodes=new Map(),frames=[];
  let translations=[],labels=[];
  const node=id=>{
    if(!nodes.has(id))nodes.set(id,{
      textContent:'',handlers:{},addEventListener(type,handler){this.handlers[type]=handler},
      setAttribute(){},focus(){},getBoundingClientRect(){return {left:0,top:0,width:480,height:270}}
    });
    return nodes.get(id);
  };
  const numeric=(...values)=>values.forEach(value=>assert.ok(Number.isFinite(value),`invalid canvas coordinate: ${value}`));
  const context={fillRect(x,y,w,h){numeric(x,y,w,h)},fillText(label,x,y){numeric(x,y);labels.push(label)},
    save(){},restore(){},translate(x,y){numeric(x,y);translations.push([x,y])},
    scale(x,y){numeric(x,y)},rotate(angle){numeric(angle)}};
  node('game').getContext=()=>context;
  const document={getElementById:node,addEventListener(){},querySelector(){return node('shell')}};
  const window={addEventListener(){}};
  const sandbox={document,window,localStorage:{getItem(){return null},setItem(){}},Math,console,
    requestAnimationFrame(callback){frames.push(callback)}};
  vm.createContext(sandbox);
  const root=path.join(__dirname,'..');
  vm.runInContext(fs.readFileSync(path.join(root,'logic.js'),'utf8'),sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),sandbox);
  function frame(i){translations=[];frames.shift()(i*50);return translations.map(pair=>[...pair]);}
  frame(0);
  assert.ok(labels.includes('ARCADE'));
  assert.ok(labels.includes('STRONGMAN'));
  assert.ok(labels.includes('ALGORITHM'));
  node('start').handlers.click();
  for(let i=1;i<39;i++)frame(i);
  const entering=frame(39),settled=(frame(40),frame(41),frame(42),frame(43));
  assert.ok(entering.length>=2&&entering.length<3,'targets enter one lane at a time');
  assert.equal(settled.length,3);
  assert.deepEqual(settled.map(pair=>pair[0]),[72,239,400],'targets use the marked training lanes');
  assert.ok(entering.some(pair=>settled.some(end=>end[0]===pair[0]&&pair[1]-end[1]>15)),'sprites should visibly rise into view');
  frame(44);const active=frame(45);
  const [x,y]=active[0];
  node('game').handlers.pointerdown({preventDefault(){},clientX:x,clientY:y-20,pointerType:'touch'});
  const firstFall=frame(46),laterFall=(frame(47),frame(48),frame(49));
  const fallOffset=pairs=>pairs.find(pair=>pair[0]===0&&pair[1]>0)?.[1]||0;
  assert.ok(fallOffset(laterFall)-fallOffset(firstFall)>4,'hit targets should visibly fall away');
});
