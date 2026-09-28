const test=require('node:test');
const assert=require('node:assert/strict');
const {hitTest,resolveShot,accuracy}=require('../logic.js');
test('visible targets can be hit within their sprite bounds; hidden targets cannot',()=>{
  const targets=[{x:100,y:100,state:'visible',kind:'threat'},{x:100,y:100,state:'hidden',kind:'civilian'}];
  assert.equal(hitTest(targets,100,100),targets[0]);
  assert.equal(hitTest(targets,126,100),null);
  assert.equal(hitTest(targets,100,22),targets[0]);
});
test('civilian hits cost a strike, while a miss only costs score',()=>{
  assert.deepEqual(resolveShot({kind:'civilian'}),{kind:'civilian',points:-300,strikes:1});
  assert.deepEqual(resolveShot(null),{kind:'miss',points:-25,strikes:0});
  assert.deepEqual(resolveShot({kind:'threat'}),{kind:'threat',points:100,strikes:0});
});
test('accuracy handles no shots and whole percentage',()=>{
  assert.equal(accuracy(0,0),0);
  assert.equal(accuracy(2,3),67);
});
test('touch expands the hit area without reaching the neighboring target',()=>{
  const targets=[{x:100,y:100,state:'visible',kind:'threat'},{x:180,y:100,state:'visible',kind:'civilian'}];
  assert.equal(hitTest(targets,130,100),null);
  assert.equal(hitTest(targets,130,100,7),targets[0]);
  assert.equal(hitTest(targets,140,100,7),null);
});
