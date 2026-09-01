import { describe,expect,it,vi } from 'vitest';
import { beginDrag,finalizeDrag,updateDrag } from './drag';

describe('drag finalization',()=>{
  it.each(['outside pointerup','pointercancel','lost capture','blur'])('launches exactly once using the last valid point on %s',()=>{const state=beginDrag({x:10,y:10},7),launch=vi.fn(()=>true);updateDrag(state,{x:40,y:10});expect(finalizeDrag(state,launch)).toBe(true);expect(finalizeDrag(state,launch)).toBe(false);expect(launch).toHaveBeenCalledOnce();expect(launch).toHaveBeenCalledWith({x:30,y:0});});
  it('finalizes a below-minimum drag without launching',()=>{const state=beginDrag({x:0,y:0},1),launch=vi.fn(()=>true);updateDrag(state,{x:3,y:4});expect(finalizeDrag(state,launch)).toBe(false);expect(launch).not.toHaveBeenCalled();expect(finalizeDrag(state,launch)).toBe(false);});
});
