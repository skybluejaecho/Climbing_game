import { interactWithHold, retainCatchTarget, tryGrip } from './physics/world';
import type { World } from './physics/types';

export interface HoldPress { pointerId:number; holdId:number; consumed:boolean }
export interface HoldPressStart { press:HoldPress|null; interaction:ReturnType<typeof interactWithHold> }

export function beginHoldPress(world:World,holdId:number,pointerId:number,inputTimeMs=0):HoldPressStart{
  const hold=world.holds.find(candidate=>candidate.id===holdId);
  if(!hold||hold.color!==world.activeRoute||world.grips.some(grip=>grip.hold===holdId))return{press:null,interaction:interactWithHold(world,holdId,inputTimeMs)};
  const interaction=interactWithHold(world,holdId,inputTimeMs);
  return{press:{pointerId,holdId,consumed:interaction==='attached'},interaction};
}

export function updateHoldPress(world:World,press:HoldPress,inputTimeMs=0):boolean{
  if(press.consumed)return false;
  if(world.grips.some(grip=>grip.hold===press.holdId)){press.consumed=true;return false;}
  if(!retainCatchTarget(world,press.holdId))return false;
  const caught=tryGrip(world,inputTimeMs);
  if(world.grips.some(grip=>grip.hold===press.holdId))press.consumed=true;
  return caught&&press.consumed;
}

export function clearHoldPress(press:HoldPress|null,pointerId?:number):HoldPress|null{
  return press&&(pointerId===undefined||press.pointerId===pointerId)?null:press;
}
