import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/utils/editAlgorithms.js", import.meta.url), "utf8");
const { connectedArea, pattern, ellipseContains } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const group = id => id >= 48 && id < 384 ? Math.floor(id / 48) : id;
for (let seed = 0; seed < 30; seed++) {
  const layer = Array.from({length:9}, (_,y)=>Array.from({length:13},(_,x)=>[0,48,94,96,143,384][(x*x+y*7+seed)%6]));
  const x=seed%13,y=seed%9, seen=new Set(), expected=new Set(), queue=[[x,y]];
  while(queue.length) {
    const [cx,cy]=queue.pop(), key=cy*13+cx;
    if(cx<0||cx>=13||cy<0||cy>=9||seen.has(key)) continue;
    seen.add(key);
    if(group(layer[cy][cx])!==group(layer[y][x])) continue;
    expected.add(key);queue.push([cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]);
  }
  const result=connectedArea(layer,x,y);
  assert.equal(result.length,new Set(result).size);
  assert.deepEqual(new Set(result),expected);
}
const tiles=Array.from({length:64},(_,i)=>({x:10+i%8,y:20+Math.floor(i/8),id:i}));
const at=pattern(tiles);
for(let y=-16;y<16;y++) for(let x=-16;x<16;x++) assert.equal(at(x,y).id,((y%8+8)%8)*8+(x%8+8)%8);
for(let x1=0;x1<12;x1++) for(let y1=0;y1<12;y1++) {
  const w=x1+1,h=y1+1,c=Math.sqrt(Math.abs((w/2)**2-(h/2)**2));
  for(let y=0;y<=y1;y++) for(let x=0;x<=x1;x++) {
    const dx=w>h?c:0,dy=w>h?0:c;
    const old=Math.round(Math.sqrt((x-x1/2+dx)**2+(y-y1/2+dy)**2)+Math.sqrt((x-x1/2-dx)**2+(y-y1/2-dy)**2))<Math.max(w,h);
    assert.equal(ellipseContains(x,y,0,0,x1,y1),old);
  }
}
for(const size of [50,256,512]) {
  const layer=Array.from({length:size},()=>Array(size).fill(384));
  connectedArea(layer,0,0);
  const times=[];
  for(let i=0;i<5;i++){const t=performance.now();assert.equal(connectedArea(layer,0,0).length,size*size);times.push(+(performance.now()-t).toFixed(2));}
  console.log(JSON.stringify({size,timesMs:times}));
}
console.log("Algorithms: connectivity, unique visits, pattern origin and ellipse parity passed");
