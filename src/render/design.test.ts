import {describe,expect,it} from 'vitest';
import {holdVisual,midpoint,seededUnit} from './design';
describe('visual design helpers',()=>{
  it('maps gameplay profiles to stable silhouettes',()=>{expect(holdVisual({id:1004,profile:'SAFE'})).toBe('jug');expect(holdVisual({id:1006,profile:'RISK'})).toBe('crimp');expect(holdVisual({id:1007,profile:'RECOVERY'})).toBe('sloper');expect(holdVisual({id:1005,profile:'STANDARD'})).toBe('pinch');});
  it('keeps decoration deterministic and bounded',()=>{expect(seededUnit(42)).toBe(seededUnit(42));expect(seededUnit(42)).toBeGreaterThanOrEqual(0);expect(seededUnit(42)).toBeLessThanOrEqual(1);});
  it('finds a segment midpoint',()=>expect(midpoint({x:2,y:4},{x:8,y:12})).toEqual({x:5,y:8}));
});
