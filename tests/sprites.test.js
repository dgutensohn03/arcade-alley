const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('deployed sprite atlas has four transparent frames for every character',()=>{
  const root=path.join(__dirname,'..');
  const png=fs.readFileSync(path.join(root,'assets/sprites.png'));
  const map=JSON.parse(fs.readFileSync(path.join(root,'assets/sprites.json'),'utf8'));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),map.frameWidth*map.frames);
  assert.equal(png.readUInt32BE(20),map.frameHeight*Object.keys(map.rows).length);
  assert.equal(png[25],6,'PNG must include alpha transparency');
  assert.equal(map.frames,4);
  assert.equal(Object.keys(map.rows).length,11);
});
