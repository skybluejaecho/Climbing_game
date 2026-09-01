import { describe,expect,it } from 'vitest';
import { pullGauge,previewEndpoint } from './slingshot';
import { TUNING } from './tuning';
import { BODY,createWorld,launchTorso } from './world';

describe('shared capped slingshot gauge',()=>{
  it('is monotonic through the cap and exactly equal beyond it',()=>{const values=[0,25,100,150,300].map(x=>pullGauge({x,y:0}));expect(values.map(v=>v.length)).toEqual([0,25,100,TUNING.maximumTorsoDrag,TUNING.maximumTorsoDrag]);expect(values[3].capped).toEqual(values[4].capped);expect(values[4].ratio).toBe(1);});
  it('uses the same capped vector for preview endpoint and physics impulse',()=>{const center={x:10,y:20},pull={x:300,y:0};expect(previewEndpoint(center,pull)).toEqual({x:center.x-TUNING.maximumTorsoDrag,y:center.y});const a=createWorld(),b=createWorld(),pa=a.particles[BODY.head],pb=b.particles[BODY.head];expect(launchTorso(a,{x:150,y:0})).toBe(true);expect(launchTorso(b,pull)).toBe(true);expect(pa.x-pa.previous.x).toBeCloseTo(pb.x-pb.previous.x,12);});
});
