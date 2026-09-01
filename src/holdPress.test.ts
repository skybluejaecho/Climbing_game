import { describe,expect,it } from 'vitest';
import { BODY,STARTING_HOLD_IDS,interactWithHold } from './physics/world';
import { createWorld } from './physics/world';
import { beginHoldPress,clearHoldPress,updateHoldPress } from './holdPress';

describe('persistent hold press',()=>{
  it('releases a pre-gripped starting hold on pointer-down without retaining a press that can detach again',()=>{
    const world=createWorld(),started=beginHoldPress(world,STARTING_HOLD_IDS.left,3,0);
    expect(started).toEqual({press:null,interaction:'released'});
    expect(world.grips).toEqual([{limb:BODY.handR,hold:STARTING_HOLD_IDS.right}]);
    expect(world.floorSupports).toEqual([BODY.footL,BODY.footR]);
  });

  it('retains a missed target, catches on later overlap, and never repeats the impulse or detaches',()=>{
    const world=createWorld(),hold=world.holds.find(candidate=>candidate.row===2&&candidate.profile==='SAFE')!,foot=world.particles[BODY.footL];world.grips=[{limb:BODY.handL,hold:STARTING_HOLD_IDS.left}];
    const started=beginHoldPress(world,hold.id,7,100);expect(started.interaction).toBe('flicked');expect(started.press).not.toBeNull();
    const velocity={x:foot.x-foot.previous.x,y:foot.y-foot.previous.y};world.launchTargets[0].missed=true;
    expect(updateHoldPress(world,started.press!,110)).toBe(false);expect(foot.x-foot.previous.x).toBe(velocity.x);expect(foot.y-foot.previous.y).toBe(velocity.y);expect(world.launchTargets.some(t=>t.hold===hold.id&&!t.missed)).toBe(true);
    Object.assign(foot,{x:hold.x,y:hold.y});expect(updateHoldPress(world,started.press!,120)).toBe(true);expect(started.press!.consumed).toBe(true);expect(world.grips).toContainEqual({limb:BODY.footL,hold:hold.id});
    expect(updateHoldPress(world,started.press!,1000)).toBe(false);expect(world.grips).toContainEqual({limb:BODY.footL,hold:hold.id});
    expect(clearHoldPress(started.press,7)).toBeNull();expect(world.grips).toContainEqual({limb:BODY.footL,hold:hold.id});
    expect(interactWithHold(world,hold.id,1000)).toBe('released');
  });

  it('tracks pointer identity and supports cancel, blur, and reset-style unconditional cleanup',()=>{
    const world=createWorld(),pink=world.holds.find(hold=>hold.row===2)!,started=beginHoldPress(world,pink.id,12).press!;
    expect(clearHoldPress(started,11)).toBe(started);expect(clearHoldPress(started,12)).toBeNull();expect(clearHoldPress(started)).toBeNull();
  });

  it('never targets a wrong-route hold',()=>{
    const world=createWorld(),wrong=world.holds.find(hold=>hold.color!==world.activeRoute)!;
    const result=beginHoldPress(world,wrong.id,4);expect(result.interaction).toBe('wrong-route');expect(result.press).toBeNull();expect(world.launchTargets).toHaveLength(0);
  });
});
