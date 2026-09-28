(() => {
  'use strict';
  const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const $=id=>document.getElementById(id);
  const W=480,H=270, logic=window.SignalLogic;
  const C={ink:'#111728',cream:'#f5e6b8',gold:'#ffd36f',red:'#ec655d',blue:'#6ac5d4',green:'#a8d887',white:'#fff4d4',shadow:'#27354c'};
  const districts=[
    {name:'PAPER RANGE',sub:'THE FIRST SIGNAL',sky:'#3b5271',dark:'#263449',mid:'#4d637d',ground:'#806e63',accent:'#e6b36b',slots:[[72,190],[149,183],[239,191],[321,179],[400,191]]},
    {name:'CIVIC SQUARE',sub:'PUBLIC FREQUENCY',sky:'#344b73',dark:'#202c49',mid:'#536180',ground:'#6e6775',accent:'#f1a962',slots:[[66,185],[156,191],[240,180],[320,193],[409,183]]},
    {name:'MEDIA ROW',sub:'SOMETHING ON AIR',sky:'#302e5c',dark:'#222344',mid:'#624c77',ground:'#574d69',accent:'#ef7ca3',slots:[[67,189],[151,182],[240,193],[323,181],[408,189]]},
    {name:'DATA TERMINAL',sub:'THE LAST CHANNEL',sky:'#213e57',dark:'#183045',mid:'#326175',ground:'#3d6168',accent:'#7ad9c7',slots:[[68,186],[151,191],[240,179],[324,191],[405,184]]}
  ];
  const villains=[
    {name:'THE GRIFTER',coat:'#d7835f',hair:'#f4ce7d',face:'#edb98e',hat:0},
    {name:'THE LOBBYIST',coat:'#8e82bb',hair:'#57446c',face:'#e7aa86',hat:1},
    {name:'THE SIGNALER',coat:'#619eaa',hair:'#d9d0aa',face:'#a16d5e',hat:0},
    {name:'THE SABOTEUR',coat:'#bf626e',hair:'#232c46',face:'#c9946d',hat:1}
  ];
  const bystanders=[
    {name:'PHOTOGRAPHER',coat:'#e0bf80',hair:'#443a52',face:'#db9e78',item:'camera'},
    {name:'COMMUTER',coat:'#80a6bd',hair:'#b8835b',face:'#efc29c',item:'bag'},
    {name:'REPORTER',coat:'#86b999',hair:'#2f3148',face:'#a57764',item:'mic'},
    {name:'DOG WALKER',coat:'#d68a9a',hair:'#ae6b45',face:'#f1c39d',item:'leash'},
    {name:'COURIER',coat:'#c4a673',hair:'#302b3d',face:'#d19b76',item:'parcel'}
  ];
  const state={mode:'title',previous:'playing',wave:1,volley:0,score:0,best:Number(localStorage.getItem('arcade-alley-best')||localStorage.getItem('signal-alley-best')||0),strikes:0,ammo:6,shots:0,hits:0,targets:[],phase:'',timer:0,fx:[],pointer:{x:240,y:135,inside:false},aim:true,sound:true,last:0,musicBeat:0,transition:0,flash:0,combo:0};
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
  function start(){unlock();Object.assign(state,{mode:'intro',wave:1,volley:0,score:0,strikes:0,ammo:6,shots:0,hits:0,targets:[],timer:0,transition:1.8,fx:[],combo:0,flash:0});sound('start');announce('Game started. Wave 1, Paper Range.');canvas.focus();}
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
    const d=district(),indices=[0,1,2,3,4].sort(()=>Math.random()-.5).slice(0,3).sort((a,b)=>a-b);
    state.targets=indices.map((slot,j)=>{
      const kind=bonus()?'bonus':(j===0?'threat':Math.random()<.5?'civilian':'threat');
      const person=kind==='threat'?pick(villains):pick(bystanders);
      return {x:d.slots[slot][0],y:d.slots[slot][1],kind,person,state:'visible',flip:0,slot,shot:false};
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
    state.fx=state.fx.filter(f=>(f.life-=dt)>0);
    state.flash=Math.max(0,state.flash-dt);
    if(state.mode==='intro'){
      state.transition-=dt;if(state.transition<=0){state.mode='playing';beginVolley();}
    }else if(state.mode==='playing'){
      music(dt);state.timer+=dt;
      if(state.phase==='reveal'&&state.timer>.26){state.targets.forEach(t=>t.state='visible');state.phase='active';state.timer=0;}
      else if(state.phase==='active'){
        const limit=bonus()?2.5:Math.max(1.45,2.45-state.wave*.065);
        if(state.targets.every(t=>t.state!=='visible')||state.timer>=limit){state.phase='clear';state.timer=0;}
      }else if(state.phase==='clear'&&state.timer>.27)closeVolley();
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
    if(target){target.state='hit';target.flip=0;if(result.kind==='threat'||result.kind==='bonus'){state.hits++;state.combo++;if(state.combo>1){const add=Math.min(state.combo,10)*10;state.score+=add;label=`+${result.points+add}`;}sound('hit');}else{state.combo=0;sound('bad');}}
    else state.combo=0;
    state.fx.push({x,y,life:.5,text:label,color});
    announce(`${label}. Score ${state.score}. ${state.ammo} shots left. ${state.strikes} strikes.`);
    if(state.strikes>=3)endGame(false);
  }
  function reload(){if(state.mode==='playing'&&state.ammo<6){state.ammo=6;sound('reload');state.fx.push({x:240,y:65,life:.48,text:'RELOADED',color:C.gold});announce('Reloaded. Six shots.');}}
  function togglePause(){if(state.mode==='playing'){state.previous='playing';state.mode='paused';announce('Paused.');}else if(state.mode==='paused'){state.mode='playing';announce('Resumed.');}}
  function toggleAim(){state.aim=!state.aim;$('aim').textContent=`◎ AIM ASSIST ${state.aim?'ON':'OFF'}`;$('aim').setAttribute('aria-pressed',String(state.aim));}
  function toggleSound(){state.sound=!state.sound;$('sound').textContent=`♫ SOUND ${state.sound?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(state.sound));if(state.sound)unlock();}
  function pointer(e){const r=canvas.getBoundingClientRect();state.pointer.x=clamp((e.clientX-r.left)*W/r.width,0,W);state.pointer.y=clamp((e.clientY-r.top)*H/r.height,0,H);state.pointer.inside=true;}
  canvas.addEventListener('pointermove',pointer);
  canvas.addEventListener('pointerleave',()=>state.pointer.inside=false);
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();pointer(e);fireAt(state.pointer.x,state.pointer.y,e.pointerType==='touch');});
  $('start').addEventListener('click',start);$('reload').addEventListener('click',reload);$('pause').addEventListener('click',togglePause);$('aim').addEventListener('click',toggleAim);$('sound').addEventListener('click',toggleSound);
  $('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.querySelector('.screen-shell').requestFullscreen?.();});
  window.addEventListener('keydown',e=>{if(['Space','KeyR','KeyP','KeyM','KeyC','KeyF','Enter'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='KeyR'||e.code==='Space')reload();if(e.code==='KeyP')togglePause();if(e.code==='KeyM')toggleSound();if(e.code==='KeyC')toggleAim();if(e.code==='KeyF')$('fullscreen').click();if(e.code==='Enter'&&['title','gameover','victory'].includes(state.mode))start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='playing')togglePause();});

  function skyline(d){
    rect(0,0,W,H,d.sky);
    rect(0,41,W,90,d.dark);
    for(let i=0;i<18;i++){
      const x=i*29-5,h=22+(i*13%42),w=20+(i*7%12);
      rect(x,118-h,w,h,d.mid);rect(x+3,125-h,w-6,4,d.dark);
      for(let yy=104-h;yy<110;yy+=9)for(let xx=x+4;xx<x+w-3;xx+=8)rect(xx,yy,3,3,(i+xx+yy)%3?d.accent:d.dark);
    }
    rect(0,117,W,109,d.mid);
    if(d===districts[0])range(d);
    else if(d===districts[1])square(d);
    else if(d===districts[2])media(d);
    else terminal(d);
    rect(0,223,W,47,d.ground);rect(0,222,W,3,d.dark);
    for(let i=0;i<14;i++){rect(i*38,235+(i%2)*14,18,1,d.accent);rect(i*46+8,256,20,1,d.dark);}
  }
  function range(d){
    for(let i=0;i<5;i++){const x=26+i*98;rect(x,92,68,113,'#6e7c80');rect(x+4,96,60,99,'#34485c');rect(x+11,103,46,74,'#8c8e83');rect(x+15,108,38,68,'#394b5c');rect(x+2,194,64,7,'#ad8d6f');}
    rect(180,50,120,31,'#1e3449');border(180,50,120,31,d.accent);txt('ARCADE ALLEY',240,58,11,C.gold,'center');
    for(let i=0;i<9;i++)rect(i*58,205,37,3,'#b29a78');
  }
  function square(d){
    rect(14,99,116,100,'#69748a');rect(19,107,106,85,'#354966');rect(350,93,117,108,'#6b7388');rect(355,101,107,91,'#354966');
    for(let i=0;i<3;i++){rect(29+i*33,119,22,29,d.accent);rect(365+i*32,117,22,29,d.accent);rect(30+i*33,122,20,25,'#263b58');rect(366+i*32,120,20,25,'#263b58');}
    rect(146,92,190,111,'#8e8990');rect(154,99,174,96,'#455675');rect(170,105,144,8,d.accent);rect(224,77,32,18,'#9c9da1');rect(233,62,14,15,d.accent);rect(210,133,60,67,'#293d59');rect(218,139,44,61,'#bba98e');rect(221,142,38,58,'#344760');
    txt('CIVIC  06',240,115,9,C.cream,'center');rect(4,209,472,7,'#a29a92');
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
  function pixelPerson(t){
    const {x,y,kind,person:p}=t;
    if(t.state==='hidden')return;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    const flip=state.phase==='reveal'?Math.max(.15,state.timer/.26):state.phase==='clear'?Math.max(.12,1-state.timer/.27):1;
    ctx.scale(flip,1);
    if(t.state==='hit'){ctx.rotate(kind==='civilian'?.13:-.22);ctx.globalAlpha=.55;}
    if(kind==='bonus'){
      rect(-12,-20,24,28,'#183750');rect(-9,-17,18,22,C.gold);rect(-5,-13,10,14,C.ink);rect(-2,-9,4,6,C.gold);rect(-10,8,20,4,'#dae39c');rect(-5,-24,10,4,C.blue);
    }else{
      rect(-8,8,7,10,'#273344');rect(2,8,7,10,'#273344');
      rect(-10,-13,20,24,C.ink);rect(-8,-11,16,20,p.coat);rect(-5,-9,10,4,'#ffffff55');
      rect(-13,-10,5,14,p.coat);rect(8,-10,5,14,p.coat);
      rect(-6,-25,12,15,C.ink);rect(-5,-24,10,13,p.face);
      rect(-6,-25,12,5,p.hair);rect(-9,-20,4,5,p.hair);
      rect(-3,-17,2,2,C.ink);rect(3,-17,2,2,C.ink);rect(-1,-11,3,1,'#804d54');
      if(p.hat){rect(-9,-27,18,3,p.hair);rect(-6,-31,12,5,p.hair);}
      if(kind==='threat'){
        rect(12,-9,7,5,C.ink);rect(17,-11,5,3,'#c9d0c5');rect(12,-5,4,6,C.ink);rect(-13,-28,26,2,C.red);rect(-15,-30,3,6,C.red);rect(12,-30,3,6,C.red);
      }else{
        if(p.item==='camera'){rect(11,-8,9,7,'#303b55');rect(14,-10,3,3,C.cream);rect(14,-6,3,3,C.blue);}
        if(p.item==='bag'){rect(12,-3,9,11,'#8d6a50');rect(14,-7,5,5,C.cream);}
        if(p.item==='mic'){rect(12,-12,3,13,C.ink);rect(11,-15,5,5,'#adb9c5');}
        if(p.item==='leash'){rect(11,-4,10,2,C.cream);rect(20,-2,2,10,C.cream);}
        if(p.item==='parcel'){rect(10,-4,11,10,'#bb9765');rect(15,-4,2,10,C.gold);}
      }
    }
    ctx.restore();
  }
  function drawHud(){
    rect(0,0,480,38,C.ink);rect(0,37,480,2,C.gold);
    txt('ARCADE ALLEY',10,7,11,C.gold);txt(`DISTRICT ${Math.ceil(state.wave/3)}  /  WAVE ${String(state.wave).padStart(2,'0')}`,11,23,7,C.blue);
    txt(`SCORE ${String(state.score).padStart(6,'0')}`,256,7,9,C.cream);
    txt(`BEST ${String(state.best).padStart(6,'0')}`,258,23,7,'#9cafc1');
    for(let i=0;i<3;i++){rect(432+i*13,9,9,10,i<3-state.strikes?C.red:'#4c5265');}
    rect(0,247,480,23,C.ink);rect(0,246,480,2,C.gold);
    txt(district().name,10,254,8,C.cream);txt(bonus()?'BONUS DRONES':`SET ${state.volley}/3`,167,254,7,C.blue);
    for(let i=0;i<6;i++){rect(360+i*18,254,10,9,i<state.ammo?C.gold:'#515366');rect(364+i*18,251,2,3,i<state.ammo?C.gold:'#515366');}
  }
  function drawFx(){
    for(const f of state.fx){ctx.globalAlpha=clamp(f.life*2,0,1);rect(f.x-5,f.y,11,2,f.color);rect(f.x,f.y-5,2,11,f.color);txt(f.text,f.x,f.y-21,8,f.color,'center');}ctx.globalAlpha=1;
    if(state.flash)rect(0,40,W,2,'#fff3d0');
  }
  function overlay(title,lines,button){
    rect(72,67,336,151,'#111827');border(72,67,336,151,C.gold);rect(76,71,328,4,C.red);
    txt(title,240,84,20,C.gold,'center');
    lines.forEach((s,i)=>txt(s,240,119+i*16,9,i===0?C.cream:'#a8c6cb','center'));
    rect(140,184,200,22,C.gold);txt(button,240,190,9,C.ink,'center');
  }
  function draw(){
    const d=district();skyline(d);
    if(state.mode==='title'){
      rect(0,0,W,H,'#121c2d');
      for(let i=0;i<5;i++){const x=68+i*87;rect(x,76,50,97,'#33475a');rect(x+6,82,38,81,'#73818a');}
      [{x:93,y:148,kind:'civilian',person:bystanders[0],state:'visible'}, {x:239,y:151,kind:'threat',person:villains[1],state:'visible'}, {x:400,y:148,kind:'threat',person:villains[2],state:'visible'}].forEach(pixelPerson);
      rect(0,0,W,55,C.ink);rect(0,54,W,3,C.gold);txt('A R C A D E   A L L E Y',240,14,24,C.gold,'center');txt('AN ORIGINAL 8-BIT SHOOTING GALLERY',240,43,8,C.blue,'center');
      rect(63,182,354,61,C.ink);border(63,182,354,61,C.gold);txt('IDENTIFY FIRST. SHOOT SECOND.',240,190,12,C.cream,'center');txt('12 WAVES  /  4 DISTRICTS  /  3 STRIKES',240,207,8,C.blue,'center');txt('CLICK, TAP, OR PRESS START',240,225,9,C.gold,'center');
      return;
    }
    state.targets.forEach(pixelPerson);drawHud();drawFx();
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
  requestAnimationFrame(frame);
})();
