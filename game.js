(() => {
  'use strict';
  const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const $=id=>document.getElementById(id);
  const W=480,H=270, logic=window.SignalLogic;
  const C={ink:'#080e1d',cream:'#fff3d0',gold:'#ffe45e',red:'#ff394d',blue:'#24bcff',green:'#3eea8b',pink:'#f440cf',white:'#fff9e7',shadow:'#162445'};
  const districts=[
    {name:'TRAINING BLOCK',sub:'LEARN THE ALLEY',sky:'#182e5a',dark:'#101b3a',mid:'#273f70',ground:'#223052',accent:'#ffb957',slots:[[72,190],[239,191],[400,191]]},
    {name:'CIVIC SQUARE',sub:'CITY UNDER THE LIGHTS',sky:'#162b65',dark:'#101c49',mid:'#274779',ground:'#1d315d',accent:'#ffd35d',slots:[[70,185],[240,180],[405,184]]},
    {name:'MEDIA ROW',sub:'WHO CONTROLS THE FEED?',sky:'#2c205b',dark:'#1a1a48',mid:'#47387b',ground:'#302657',accent:'#fa55cc',slots:[[67,189],[240,193],[408,189]]},
    {name:'DATA TERMINAL',sub:'THE LAST CHANNEL',sky:'#133952',dark:'#0e233c',mid:'#1b566d',ground:'#173e53',accent:'#5affb0',slots:[[68,186],[240,179],[405,184]]}
  ];
  const villains=[
    {id:'strongman',name:'THE STRONGMAN',color:C.red},
    {id:'oligarch',name:'THE OLIGARCH',color:C.blue},
    {id:'propagandist',name:'THE PROPAGANDIST',color:C.pink},
    {id:'algorithm',name:'THE ALGORITHM',color:C.green}
  ];
  const bystanders=[
    {id:'journalist',name:'JOURNALIST',color:C.red},
    {id:'commuter',name:'COMMUTER',color:C.blue},
    {id:'musician',name:'MUSICIAN',color:'#ad70ff'},
    {id:'rider',name:'DELIVERY RIDER',color:C.green},
    {id:'tourist',name:'TOURIST',color:'#ff9b40'},
    {id:'photographer',name:'PHOTOGRAPHER',color:C.pink}
  ];
  const formations=[
    ['threat','civilian','civilian'],
    ['civilian','threat','threat'],
    ['threat','civilian','threat'],
    ['civilian','civilian','threat'],
    ['threat','threat','civilian']
  ];
  const spriteRows={strongman:0,oligarch:1,propagandist:2,algorithm:3,journalist:4,commuter:5,musician:6,rider:7,tourist:8,photographer:9,drone:10};
  const spriteSheet=typeof Image!=='undefined'?new Image():null;
  if(spriteSheet)spriteSheet.src='assets/sprites.png?v=3';
  const state={mode:'title',previous:'playing',wave:1,volley:0,score:0,best:Number(localStorage.getItem('arcade-alley-best')||localStorage.getItem('signal-alley-best')||0),strikes:0,ammo:6,shots:0,hits:0,targets:[],phase:'',timer:0,clock:0,fx:[],sparks:[],pointer:{x:240,y:135,inside:false},aim:true,sound:true,last:0,musicBeat:0,transition:0,flash:0,combo:0};
  let audio=null;
  const rand=n=>Math.floor(Math.random()*n);
  const pick=a=>a[rand(a.length)];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function announce(s){$('announcer').textContent=s;}
  function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function txt(t,x,y,size=8,color=C.cream,align='left'){
    ctx.fillStyle=color;ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(t,Math.round(x),Math.round(y));
  }
  function border(x,y,w,h,c=C.cream){rect(x,y,w,1,c);rect(x,y+h-1,w,1,c);rect(x,y,1,h,c);rect(x+w-1,y,1,h,c);}
  function tone(freq,dur=.08,type='square',vol=.045,at=0){
    if(!state.sound||!audio)return;
    const now=audio.currentTime+at,o=audio.createOscillator(),g=audio.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(vol,now);g.gain.exponentialRampToValueAtTime(.001,now+dur);
    o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+dur+.01);
  }
  function unlock(){if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audio=new AC();}if(audio?.state==='suspended')audio.resume();}
  function sound(kind){if(kind==='shot'){tone(170,.055,'square',.08);tone(65,.12,'sawtooth',.035,.035);}else if(kind==='hit'){tone(520,.07);tone(780,.11,'square',.04,.08);}else if(kind==='bad'){tone(220,.16);tone(140,.23,'square',.04,.12);}else if(kind==='reload'){tone(230,.055);tone(330,.055,'square',.03,.09);tone(480,.075,'square',.03,.17);}else if(kind==='start'){[330,440,550,740].forEach((v,i)=>tone(v,.12,'square',.04,i*.1));}}
  function music(dt){
    if(!state.sound||!audio||state.mode!=='playing')return;
    state.musicBeat+=dt;
    if(state.musicBeat<.19)return;
    state.musicBeat-=.19;
    const notes=[196,0,294,392,0,294,220,0,196,0,330,294,0,220,147,0],i=(state.beatIndex=(state.beatIndex+1)%16);
    if(notes[i])tone(notes[i],.095,'square',.012);
    if(i%4===0)tone(98,.13,'triangle',.035);
    if(i%4===2)tone(3900,.025,'sawtooth',.004);
  }
  function start(){unlock();if(window.matchMedia?.('(pointer: coarse)').matches)enterImmersive();Object.assign(state,{mode:'intro',wave:1,volley:0,score:0,strikes:0,ammo:6,shots:0,hits:0,targets:[],timer:0,transition:1.8,fx:[],sparks:[],combo:0,flash:0});sound('start');announce('Game started. Wave 1, Training Block.');canvas.focus();}
  function district(){return districts[Math.floor((state.wave-1)/3)];}
  function bonus(){return state.wave%4===0;}
  function nextWave(){
    state.targets=[];state.volley=0;state.ammo=6;state.mode='intro';state.transition=1.65;state.phase='';
    announce(`Wave ${state.wave}: ${district().name}${bonus()?', bonus round':''}.`);
    sound('start');
  }
  function endGame(won){
    state.mode=won?'victory':'gameover';state.targets=[];
    if(state.score>state.best){state.best=state.score;try{localStorage.setItem('arcade-alley-best',String(state.best));}catch(e){}}
    announce(`${won?'Mission complete':'Game over'}. Score ${state.score}. Best ${state.best}.`);
    sound(won?'start':'bad');
  }
  function beginVolley(){
    state.volley++;
    const d=district(),pattern=formations[((state.wave-1)*2+state.volley-1)%formations.length];
    state.targets=d.slots.map(([x,y],lane)=>{
      const kind=bonus()?'bonus':pattern[lane];
      const person=kind==='threat'?villains[Math.min(3,Math.floor((state.wave-1)/3))]:bystanders[((state.wave-1)*3+state.volley+lane)%bystanders.length];
      return {x,y,kind,person,state:'visible',lane,delay:lane*.085,hitTime:0};
    });
    state.phase='reveal';state.timer=0;
  }
  function closeVolley(){
    const escaped=state.targets.filter(t=>t.kind==='threat'&&t.state==='visible').length;
    if(escaped){state.strikes+=Math.min(escaped,2);state.combo=0;announce(`${escaped} threat${escaped===1?'':'s'} escaped. Strike ${state.strikes} of 3.`);sound('bad');}
    state.targets.forEach(t=>t.state='hidden');
    if(state.strikes>=3){endGame(false);return;}
    if(state.volley>=3){
      state.score+=Math.max(0,150-state.strikes*30);
      if(state.wave>=12){endGame(true);return;}
      state.wave++;nextWave();
    }else{state.phase='interlude';state.timer=0;}
  }
  function update(dt){
    state.clock+=dt;
    state.fx=state.fx.filter(f=>(f.life-=dt)>0);
    state.sparks=state.sparks.filter(p=>(p.life-=dt)>0);
    state.sparks.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt;});
    state.targets.forEach(t=>{if(t.state==='hit'&&(t.hitTime+=dt)>.38)t.state='hidden';});
    state.flash=Math.max(0,state.flash-dt);
    if(state.mode==='intro'){
      state.transition-=dt;if(state.transition<=0){state.mode='playing';beginVolley();}
    }else if(state.mode==='playing'){
      music(dt);state.timer+=dt;
      if(state.phase==='reveal'&&state.timer>.36){state.phase='active';state.timer=0;}
      else if(state.phase==='active'){
        const limit=bonus()?2.5:Math.max(1.45,2.45-state.wave*.065);
        if(state.targets.every(t=>t.state!=='visible')||state.timer>=limit){state.phase='clear';state.timer=0;}
      }else if(state.phase==='clear'&&state.timer>.32)closeVolley();
      else if(state.phase==='interlude'&&state.timer>.62)beginVolley();
    }
  }
  function fireAt(x,y,touch=false){
    unlock();
    if(state.mode==='title'||state.mode==='gameover'||state.mode==='victory'){start();return;}
    if(state.mode==='paused'){togglePause();return;}
    if(state.mode!=='playing'||state.phase!=='active')return;
    if(state.ammo===0){sound('bad');state.fx.push({x,y,life:.48,text:'RELOAD!',color:C.gold});announce('Out of ammo. Reload.');return;}
    state.ammo--;state.shots++;state.flash=.06;sound('shot');
    const target=logic.hitTest(state.targets,x,y,touch?7:0),result=logic.resolveShot(target);
    state.score=Math.max(0,state.score+result.points);state.strikes+=result.strikes;
    const color=result.kind==='threat'?C.green:result.kind==='bonus'?C.gold:result.kind==='civilian'?C.red:C.blue;
    let label=result.kind==='threat'?'+100':result.kind==='bonus'?'+200':result.kind==='civilian'?'CIVILIAN!':'MISS';
    if(target){target.state='hit';target.hitTime=0;if(result.kind==='threat'||result.kind==='bonus'){state.hits++;state.combo++;if(state.combo>1){const add=Math.min(state.combo,10)*10;state.score+=add;label=`+${result.points+add}`;}sound('hit');}else{state.combo=0;sound('bad');}}
    else state.combo=0;
    state.fx.push({x,y,life:.5,text:label,color});
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9;state.sparks.push({x,y,vx:Math.cos(a)*(45+i%3*19),vy:Math.sin(a)*(45+i%3*19),life:.2+i%3*.05,color:i%2?color:C.white});}
    announce(`${label}. Score ${state.score}. ${state.ammo} shots left. ${state.strikes} strikes.`);
    if(state.strikes>=3)endGame(false);
  }
  function reload(){if(state.mode==='playing'&&state.ammo<6){state.ammo=6;sound('reload');state.fx.push({x:240,y:65,life:.48,text:'RELOADED',color:C.gold});announce('Reloaded. Six shots.');}}
  function togglePause(){if(state.mode==='playing'){state.previous='playing';state.mode='paused';announce('Paused.');}else if(state.mode==='paused'){state.mode='playing';announce('Resumed.');}}
  function toggleAim(){state.aim=!state.aim;$('aim').textContent=`◎ AIM ASSIST ${state.aim?'ON':'OFF'}`;$('aim').setAttribute('aria-pressed',String(state.aim));}
  function toggleSound(){state.sound=!state.sound;$('sound').textContent=`♫ SOUND ${state.sound?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(state.sound));if(state.sound)unlock();}
  function enterImmersive(){
    document.body.classList.add('immersive');
    const shell=document.querySelector('.screen-shell');
    if(shell.requestFullscreen&&!document.fullscreenElement){
      try{Promise.resolve(shell.requestFullscreen()).then(()=>{
        if(document.fullscreenElement&&screen.orientation?.lock)return screen.orientation.lock('landscape');
      }).catch(()=>{});}catch(e){} // CSS still fills the viewport when native fullscreen is unavailable.
    }
  }
  function exitImmersive(){
    document.body.classList.remove('immersive');
    try{screen.orientation?.unlock?.();}catch(e){}
    if(document.fullscreenElement)document.exitFullscreen?.().catch?.(()=>{});
  }
  function pointer(e){const r=canvas.getBoundingClientRect();state.pointer.x=clamp((e.clientX-r.left)*W/r.width,0,W);state.pointer.y=clamp((e.clientY-r.top)*H/r.height,0,H);state.pointer.inside=true;}
  canvas.addEventListener('pointermove',pointer);
  canvas.addEventListener('pointerleave',()=>state.pointer.inside=false);
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();pointer(e);fireAt(state.pointer.x,state.pointer.y,e.pointerType==='touch');});
  $('start').addEventListener('click',start);$('reload').addEventListener('click',reload);$('pause').addEventListener('click',togglePause);$('aim').addEventListener('click',toggleAim);$('sound').addEventListener('click',toggleSound);
  $('touch-reload').addEventListener('click',reload);$('touch-pause').addEventListener('click',togglePause);$('touch-exit').addEventListener('click',exitImmersive);
  $('fullscreen').addEventListener('click',()=>document.body.classList.contains('immersive')?exitImmersive():enterImmersive());
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('immersive'))document.body.classList.remove('immersive');});
  window.addEventListener('keydown',e=>{if(['Space','KeyR','KeyP','KeyM','KeyC','KeyF','Enter'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='KeyR'||e.code==='Space')reload();if(e.code==='KeyP')togglePause();if(e.code==='KeyM')toggleSound();if(e.code==='KeyC')toggleAim();if(e.code==='KeyF')$('fullscreen').click();if(e.code==='Escape'&&document.body.classList.contains('immersive'))exitImmersive();if(e.code==='Enter'&&['title','gameover','victory'].includes(state.mode))start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='playing')togglePause();});

  function skyline(d){
    rect(0,0,W,H,d.sky);
    rect(0,41,W,90,d.dark);
    for(let i=0;i<26;i++){const x=(i*79+31)%480,y=42+(i*31)%70;rect(x,y,i%4===0?2:1,1,i%3?C.blue:C.pink);}
    for(let i=0;i<18;i++){
      const x=i*29-5,h=22+(i*13%42),w=20+(i*7%12);
      rect(x,118-h,w,h,d.mid);rect(x+3,125-h,w-6,4,d.dark);
      for(let yy=104-h;yy<110;yy+=9)for(let xx=x+4;xx<x+w-3;xx+=8)rect(xx,yy,3,3,(i+xx+yy+Math.floor(state.clock*2))%4?d.accent:C.pink);
    }
    rect(0,117,W,109,d.mid);
    if(d===districts[0])range(d);
    else if(d===districts[1])square(d);
    else if(d===districts[2])media(d);
    else terminal(d);
    rect(0,223,W,47,d.ground);rect(0,222,W,3,d.dark);
    for(let i=0;i<14;i++){rect(i*38,235+(i%2)*14,18,1,d.accent);rect(i*46+8,256,20,1,d.dark);}
    for(let i=0;i<8;i++){const x=(i*71+Math.floor(state.clock*16))%515-18;rect(x,213,11,2,i%2?C.pink:C.blue);}
  }
  function range(d){
    for(let i=0;i<5;i++){const x=26+i*98;rect(x,92,68,113,'#172e5b');rect(x+3,95,62,104,C.blue);rect(x+6,98,56,98,'#13244a');rect(x+12,103,44,75,'#24416e');rect(x+15,108,38,68,'#101c39');rect(x+2,194,64,7,'#375b91');rect(x+6,100,4,85,i%2?C.pink:C.blue);}
    rect(180,50,120,31,C.ink);border(180,50,120,31,C.red);txt('ARCADE ALLEY',240,58,11,C.gold,'center');
    for(let i=0;i<9;i++)rect(i*58,205,37,3,i%2?C.blue:'#5578a1');
  }
  function square(d){
    rect(14,99,116,100,'#274581');rect(19,107,106,85,'#142a56');rect(350,93,117,108,'#274581');rect(355,101,107,91,'#142a56');
    for(let i=0;i<3;i++){rect(29+i*33,119,22,29,C.blue);rect(365+i*32,117,22,29,C.pink);rect(30+i*33,122,20,25,'#162c55');rect(366+i*32,120,20,25,'#162c55');}
    rect(146,92,190,111,'#29518e');rect(154,99,174,96,'#182f60');rect(170,105,144,8,C.gold);rect(224,77,32,18,'#418aca');rect(233,62,14,15,C.gold);rect(210,133,60,67,C.blue);rect(218,139,44,61,'#172d55');rect(221,142,38,58,'#284b83');
    txt('CIVIC  06',240,115,9,C.cream,'center');rect(4,209,472,7,'#3e70a9');
  }
  function media(d){
    for(let i=0;i<4;i++){let x=i*126-9;rect(x,82,109,125,'#4b3b65');rect(x+7,90,95,106,'#252e56');rect(x+13,98,83,48,i%2?'#59447d':'#445477');rect(x+17,102,75,40,'#1c294d');rect(x+8,180,93,8,d.accent);}
    rect(164,49,151,37,'#24334d');border(164,49,151,37,d.accent);txt('THE DAILY SIGNAL',240,56,10,C.gold,'center');txt('LIVE / 24:00',240,70,7,d.accent,'center');
    for(let i=0;i<4;i++){rect(14+i*126,153,70,5,d.accent);rect(32+i*126,160,32,8,'#394c63');}
  }
  function terminal(d){
    for(let i=0;i<6;i++){let x=3+i*81;rect(x,86,73,120,'#2e586a');rect(x+4,90,65,108,'#183449');for(let r=0;r<5;r++){rect(x+10,98+r*19,53,10,'#326b72');rect(x+15,101+r*19,3,3,d.accent);rect(x+23,101+r*19,22,2,'#86bdab');}}
    rect(137,53,206,27,'#17354a');border(137,53,206,27,d.accent);txt('THE NETWORK IS WATCHING',240,62,9,C.green,'center');
    rect(0,210,480,4,'#7ba7a0');
  }
  function drawLanes(d){
    d.slots.forEach(([x,y],i)=>{
      rect(x-31,y+20,62,4,'#0b1935');rect(x-28,y+20,56,2,d.accent);
      rect(x-34,y-73,3,18,d.accent);rect(x+31,y-73,3,18,d.accent);
      rect(x-34,y-74,12,3,d.accent);rect(x+22,y-74,12,3,d.accent);
      rect(x-14,y+25,28,10,C.ink);border(x-14,y+25,28,10,d.accent);
      txt(`0${i+1}`,x,y+27,7,d.accent,'center');
    });
  }
  function face(x,y,skin,hair,eyes=C.ink,blink=false){
    rect(x-1,y-1,22,23,C.ink);rect(x+1,y+1,18,19,skin);
    rect(x-2,y-3,24,7,hair);rect(x-3,y+2,5,8,hair);
    rect(x+4,y+9,3,blink?1:2,eyes);rect(x+13,y+9,3,blink?1:2,eyes);
    rect(x+9,y+14,3,2,'#ad635e');rect(x+7,y+18,7,1,'#783f51');
  }
  function feet(color,walk){
    rect(-12,5+walk,9,14,C.ink);rect(4,5-walk,9,14,C.ink);
    rect(-10,6+walk,6,10,color);rect(5,6-walk,6,10,color);
    rect(-15,17+walk,13,4,C.ink);rect(3,17-walk,13,4,C.ink);
  }
  function drawCivilian(p,frame){
    const id=p.id,walk=frame%2?2:0,blink=frame%12===0;
    const coat={journalist:'#d72b45',commuter:'#26518b',musician:'#6632b6',rider:'#18a852',tourist:'#ef8537',photographer:'#242c42'}[id];
    const skin={journalist:'#d99a72',commuter:'#e8ad82',musician:'#a76c4e',rider:'#dba27e',tourist:'#f0bb88',photographer:'#b67e6b'}[id];
    const hair={journalist:'#492635',commuter:'#212b43',musician:'#422641',rider:'#172d32',tourist:'#d19a4c',photographer:'#252338'}[id];
    feet(id==='tourist'?'#e4bd84':'#243047',walk);
    rect(-15,-28,30,35,C.ink);rect(-12,-26,24,30,coat);rect(-4,-25,8,25,id==='commuter'?C.cream:'#273752');
    rect(-17,-25,5,24,C.ink);rect(12,-25,5,24,C.ink);rect(-16,-23,5,21,coat);rect(12,-23,5,20,coat);
    face(-10,-49,skin,hair,C.ink,blink);
    if(id==='journalist'){rect(-12,-54,24,5,hair);rect(-16,-11,7,4,skin);rect(15,-12,9,8,C.ink);rect(17,-15,6,3,'#9fb3cb');rect(18,-10,3,3,C.blue);rect(-8,1,7,2,C.white);}
    if(id==='commuter'){rect(-11,-40,22,3,C.ink);rect(-7,-40,6,2,C.blue);rect(4,-40,6,2,C.blue);rect(14,-5,8,12,'#bf8a55');rect(17,-8,3,4,C.gold);rect(-17,-20,7,11,'#ccae85');}
    if(id==='musician'){rect(-13,-54,26,5,C.gold);rect(-9,-58,18,6,C.gold);rect(-14,-22,6,19,'#823cdb');rect(-7,-9,20,9,'#b97135');rect(5,-7,22,3,C.gold);rect(-2,-11,9,12,'#e59a40');rect(0,-7,3,3,C.ink);}
    if(id==='rider'){rect(-13,-55,26,9,'#087b41');rect(-10,-58,20,6,C.green);rect(-7,-54,5,3,C.white);rect(7,-54,4,3,C.white);rect(13,-22,12,23,'#126441');rect(15,-18,8,3,C.green);rect(-16,-9,7,3,C.green);}
    if(id==='tourist'){rect(-13,-55,26,7,C.gold);rect(-10,-58,20,4,'#aa6b24');rect(1,-52,8,4,C.blue);rect(-17,-20,5,15,C.blue);rect(13,-20,5,15,C.blue);rect(15,-8,9,12,'#d9d5bc');rect(17,-6,5,4,C.blue);}
    if(id==='photographer'){rect(-13,-55,26,7,'#242238');rect(-8,-58,17,5,'#3d2945');rect(-19,-20,7,19,'#1a283e');rect(12,-20,7,19,'#1a283e');rect(13,-14,14,9,C.ink);rect(16,-17,7,3,C.cream);rect(18,-12,6,5,C.blue);rect(-12,1,8,5,'#906641');}
  }
  function drawVillain(p,frame){
    const id=p.id,move=frame%4===0?2:0,blink=frame%14===0;
    if(id==='algorithm'){
      feet('#216a9c',move);rect(-15,-29,30,36,C.ink);rect(-12,-26,24,29,'#1d5f91');
      rect(-9,-23,18,19,'#102f54');rect(-6,-19,12,8,C.blue);rect(-4,-16,8,3,C.green);
      rect(-21,-25,8,26,'#20527a');rect(13,-25,8,26,'#20527a');rect(-20,-21,5,5,C.blue);rect(15,-21,5,5,C.blue);
      rect(-17,-56,34,28,C.ink);rect(-14,-53,28,22,C.blue);rect(-11,-50,22,16,'#122846');
      rect(-7,-45,6,3,C.green);rect(3,-45,6,3,C.green);rect(-4,-38,8,2,C.green);
      rect(-3,-62,6,7,'#85eaf3');rect(20,-33,4,4,C.green);rect(-24,-13,4,4,C.green);
      return;
    }
    const skin=id==='propagandist'?'#e2a385':id==='oligarch'?'#e1b18d':'#dfa27b';
    const hair=id==='oligarch'?'#d5dfdc':id==='propagandist'?'#54213b':'#392536';
    feet('#19213c',move);
    if(id==='strongman'){
      rect(-21,-29,42,37,C.ink);rect(-18,-27,36,32,'#203d7a');rect(-17,-26,7,31,'#bf8d38');rect(10,-26,7,31,'#bf8d38');
      rect(-6,-25,12,25,C.cream);rect(-3,-23,6,24,C.red);rect(-7,2,14,4,C.gold);
      rect(-26,-25-move*6,9,24,'#294a86');rect(17,-25,9,24,'#294a86');rect(-29,-8-move*6,9,8,skin);rect(21,-8,9,8,skin);
      face(-11,-53,skin,hair,C.ink,blink);rect(-13,-56,26,5,hair);rect(14,-48,5,9,skin);
      rect(-7,-44,6,2,C.ink);rect(3,-44,6,2,C.ink);rect(-4,-34,9,2,'#9d3e45');rect(-3,-32,7,1,C.white);
      rect(19,-10,10,4,C.ink);rect(28,-12,7,3,'#b9c8d5');rect(22,-6,4,6,C.ink);
    }else if(id==='oligarch'){
      rect(-18,-29,36,39,C.ink);rect(-16,-27,32,35,'#142c59');rect(-14,-25,5,32,C.gold);rect(9,-25,5,32,C.gold);
      rect(-6,-25,12,25,'#1f477f');rect(-3,-22,6,8,C.blue);
      rect(-22,-23,6,25,'#142c59');rect(16,-23,6,25,'#142c59');rect(-22,-4,7,7,skin);rect(17,-4,7,7,skin);
      face(-10,-52,skin,hair,C.ink,blink);rect(-12,-55,23,5,C.cream);
      rect(-7,-42,7,4,'#0a2545');rect(2,-42,7,4,'#0a2545');rect(-6,-41,5,2,C.blue);rect(3,-41,5,2,C.blue);
      rect(20,-28-move*2,11,6,'#233e62');rect(23,-30-move*2,6,3,C.blue);rect(24,-25-move*2,3,3,C.red);
      rect(18,-8,10,4,C.ink);rect(27,-10,6,3,'#aabccb');
    }else{
      rect(-17,-30,34,38,C.ink);rect(-14,-28,28,33,'#c72570');rect(-11,-26,5,28,'#f75aa4');rect(6,-26,5,28,'#f75aa4');rect(-4,-25,8,16,C.cream);
      rect(-20,-25,6,23,'#a51b66');rect(14,-25,6,23,'#a51b66');rect(-20,-6,7,7,skin);rect(15,-6,7,7,skin);
      rect(-14,-53,28,32,hair);face(-10,-50,skin,hair,C.ink,blink);rect(-14,-50,5,24,hair);rect(10,-50,5,23,hair);
      rect(-5,-33,10,2,'#b72158');rect(-2,-31,5,1,C.white);rect(-17,-34,4,14,'#7d244e');rect(13,-34,4,14,'#7d244e');
      rect(19,-19-move*3,11,17,C.ink);rect(21,-17-move*3,7,12,C.pink);rect(22,-14-move*3,5,3,C.white);
      if(frame%4<2){rect(-30,-41,6,5,C.pink);rect(-27,-44,4,4,C.pink);rect(-24,-41,6,5,C.pink);}
    }
  }
  function drawDrone(frame){
    const wing=frame%2?2:0;
    rect(-14,-29,28,22,C.ink);rect(-11,-27,22,17,'#12507a');rect(-7,-23,14,11,C.blue);rect(-4,-21,8,7,C.red);
    rect(-28,-23-wing,15,4,'#537daa');rect(13,-23+wing,15,4,'#537daa');rect(-32,-27-wing,9,3,C.cream);rect(23,-27+wing,9,3,C.cream);
    rect(-10,-9,6,8,'#8bb8c9');rect(4,-9,6,8,'#8bb8c9');
  }
  function pixelPerson(t,preview=false,scale=1.25){
    if(t.state==='hidden')return;
    const frame=Math.floor(state.clock*6),bob=frame%4===0?-1:0;
    let emerge=1;
    if(!preview&&state.phase==='reveal')emerge=clamp((state.timer-(t.delay||0))/.29,0,1);
    if(!preview&&state.phase==='clear')emerge=1-clamp(state.timer/.32,0,1);
    if(emerge<=0)return;
    ctx.save();ctx.translate(Math.round(t.x),Math.round(t.y+(1-emerge)*57+bob));ctx.scale(scale,scale);
    if(t.state==='hit'){ctx.translate(0,t.hitTime*38);ctx.rotate((t.kind==='civilian'?1:-1)*t.hitTime*1.8);ctx.globalAlpha=clamp(1-t.hitTime*2.2,0,1);}
    if(spriteSheet?.complete&&spriteSheet.naturalWidth>=320){
      const row=t.kind==='bonus'?spriteRows.drone:spriteRows[t.person.id];
      ctx.drawImage(spriteSheet,(frame%4)*80,row*96,80,96,-40,-64,80,96);
    }else if(t.kind==='bonus')drawDrone(frame);else if(t.kind==='threat')drawVillain(t.person,frame);else drawCivilian(t.person,frame);
    ctx.restore();
    if(t.kind==='threat'&&t.state==='visible'&&emerge>.85&&!preview){
      const y=t.y-78+(1-emerge)*57;rect(t.x-5,y,10,2,C.red);rect(t.x-3,y+2,6,4,C.red);rect(t.x-1,y+6,2,3,C.red);
    }
  }
  function drawHud(){
    rect(0,0,480,40,C.ink);rect(0,38,480,2,C.blue);
    txt('ARCADE',9,5,10,C.white);txt('ALLEY',9,19,10,C.red);
    txt(`SCORE ${String(state.score).padStart(6,'0')}`,95,5,10,C.gold);
    txt(`COMBO x${state.combo}`,95,23,8,state.combo>1?C.pink:C.blue);
    txt(`WAVE ${String(state.wave).padStart(2,'0')} / 12`,270,5,9,C.white);
    txt(district().name,270,23,7,C.blue);
    for(let i=0;i<3;i++){const x=435+i*14;rect(x,9,9,8,i<3-state.strikes?C.red:'#46516a');rect(x+2,17,5,3,i<3-state.strikes?C.red:'#46516a');}
    rect(0,244,480,26,C.ink);rect(0,243,480,2,C.blue);
    txt(bonus()?'BONUS · DRONES':`SET ${state.volley}/3 · IDENTIFY FIRST`,11,252,8,C.cream);
    if(state.ammo<=2&&state.mode==='playing'&&Math.floor(state.clock*3)%2)txt('R RELOAD',228,252,8,C.red);
    for(let i=0;i<6;i++){const x=358+i*18;rect(x,251,10,13,i<state.ammo?C.gold:'#3d4a65');rect(x+3,248,4,4,i<state.ammo?C.cream:'#3d4a65');}
  }
  function drawFx(){
    for(const p of state.sparks){ctx.globalAlpha=clamp(p.life*3,0,1);rect(p.x,p.y,3,3,p.color);}
    for(const f of state.fx){ctx.globalAlpha=clamp(f.life*2,0,1);rect(f.x-7,f.y,15,2,f.color);rect(f.x,f.y-7,2,15,f.color);txt(f.text,f.x,f.y-25,9,f.color,'center');}ctx.globalAlpha=1;
    if(state.flash)rect(0,40,W,2,'#fff3d0');
  }
  function overlay(title,lines,button){
    rect(68,65,344,158,C.ink);border(68,65,344,158,C.blue);rect(73,70,334,4,C.red);
    txt(title,242,84,20,C.red,'center');txt(title,240,82,20,C.white,'center');
    lines.forEach((s,i)=>txt(s,240,119+i*16,9,i===0?C.cream:'#a8c6cb','center'));
    rect(140,187,200,24,C.red);border(140,187,200,24,C.white);txt(button,240,194,9,C.white,'center');
  }
  function drawTitle(){
    rect(0,0,W,H,'#080d20');
    for(let i=0;i<32;i++){const x=(i*67+11)%480,y=10+(i*43)%122;rect(x,y,i%5===0?2:1,1,i%3?C.blue:C.pink);}
    rect(425,17,20,20,C.gold);rect(423,20,2,13,C.gold);rect(445,20,2,13,C.gold);
    for(let i=0;i<16;i++){
      const x=i*34-6,h=25+(i*17%54);rect(x,178-h,28,h,i%2?'#183567':'#12264c');
      rect(x+3,175-h,22,3,i%3===0?C.pink:C.blue);
      for(let yy=161-h;yy<165;yy+=8)for(let xx=x+5;xx<x+23;xx+=7)rect(xx,yy,2,3,(i+xx+Math.floor(state.clock*3))%3?C.gold:'#263d6e');
    }
    rect(0,0,480,17,C.ink);txt('▣  ORIGINAL 8-BIT ARCADE  /  2026',10,5,8,C.blue);txt(`HI ${String(state.best).padStart(6,'0')}`,470,5,8,C.gold,'right');
    rect(26,24,428,93,C.ink);border(26,24,428,93,C.blue);rect(30,28,420,3,C.red);
    txt('ARCADE',243,36,32,C.red,'center');txt('ARCADE',240,33,32,C.white,'center');
    txt('ALLEY',243,73,32,C.blue,'center');txt('ALLEY',240,70,32,C.gold,'center');
    txt('IDENTIFY FIRST  •  SHOOT SECOND',240,104,7,C.pink,'center');
    const cards=[villains[0],villains[1],villains[2],villains[3]];
    cards.forEach((p,i)=>{
      const x=9+i*119;
      rect(x,124,105,100,C.ink);border(x,124,105,100,p.color);rect(x+3,127,99,3,p.color);
      rect(x+4,132,97,69,i%2?'#14224a':'#1a2447');
      pixelPerson({x:x+52,y:194,kind:'threat',person:p,state:'visible'},true,1.18);
      rect(x+2,202,101,20,C.ink);txt(p.name.replace('THE ',''),x+52,208,7,p.color,'center');
    });
    rect(125,230,230,29,Math.floor(state.clock*3)%2?C.red:'#d82b45');border(125,230,230,29,C.white);
    txt('▶  START GAME',240,236,15,C.white,'center');
    txt('TAP / CLICK TO PLAY     R RELOAD',240,262,7,C.blue,'center');
  }
  function draw(){
    const d=district();skyline(d);
    if(state.mode==='title'){
      drawTitle();
      return;
    }
    drawLanes(d);
    state.targets.forEach(t=>pixelPerson(t));drawHud();drawFx();
    if(state.mode==='intro'){
      rect(80,83,320,89,C.ink);border(80,83,320,89,C.gold);txt(`WAVE ${String(state.wave).padStart(2,'0')}`,240,96,21,C.gold,'center');txt(d.name,240,124,12,C.cream,'center');txt(bonus()?'BONUS ROUND · SHOOT THE SIGNAL DRONES':d.sub,240,146,8,C.blue,'center');
    }
    if(state.mode==='paused')overlay('PAUSED',['Take a breath.','The clock is stopped.'],'CLICK GAME OR PRESS P');
    if(state.mode==='gameover')overlay('GAME OVER',[`FINAL SCORE ${state.score}`,`BEST SCORE ${state.best}`,`ACCURACY ${logic.accuracy(state.hits,state.shots)}%`],'CLICK GAME TO RETRY');
    if(state.mode==='victory')overlay('ALLEY CLEARED',[`YOU CLEARED ALL 12 WAVES`,`SCORE ${state.score}  ·  BEST ${state.best}`,`ACCURACY ${logic.accuracy(state.hits,state.shots)}%`],'CLICK GAME TO PLAY AGAIN');
    if(state.aim&&state.pointer.inside&&state.mode==='playing'){
      const x=state.pointer.x,y=state.pointer.y;rect(x-8,y,5,1,C.cream);rect(x+4,y,5,1,C.cream);rect(x,y-8,1,5,C.cream);rect(x,y+4,1,5,C.cream);rect(x,y,1,1,C.red);
    }
  }
  function frame(t){const dt=Math.min(.05,(t-state.last)/1000||0);state.last=t;update(dt);draw();requestAnimationFrame(frame);}
  if(window.__ARCADE_EXPORT__)window.__ARCADE_EXPORT__={drawVillain,drawCivilian,drawDrone,villains,bystanders};
  requestAnimationFrame(frame);
})();
