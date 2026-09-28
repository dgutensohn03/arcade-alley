(function(root){
  'use strict';
  function inside(target,x,y,pad=0){return target.state==='visible'&&x>=target.x-13-pad&&x<=target.x+13+pad&&y>=target.y-26-pad&&y<=target.y+17+pad;}
  function hitTest(targets,x,y,pad=0){for(let i=targets.length-1;i>=0;i--){if(inside(targets[i],x,y,pad))return targets[i];}return null;}
  function resolveShot(target){if(!target)return{kind:'miss',points:-25,strikes:0};if(target.kind==='civilian')return{kind:'civilian',points:-300,strikes:1};if(target.kind==='bonus')return{kind:'bonus',points:200,strikes:0};return{kind:'threat',points:100,strikes:0};}
  function accuracy(hits,shots){return shots?Math.round(hits/shots*100):0;}
  const api={inside,hitTest,resolveShot,accuracy};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.SignalLogic=api;
})(typeof window!=='undefined'?window:globalThis);
