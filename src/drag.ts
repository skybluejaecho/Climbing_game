import { TUNING } from './physics/tuning';
import { pullGauge } from './physics/slingshot';
import type { Vec2 } from './physics/types';

export type DragState={start:Vec2;last:Vec2;pointerId:number;finalized:boolean};
export function beginDrag(start:Vec2,pointerId:number):DragState{return{start:{...start},last:{...start},pointerId,finalized:false};}
export function updateDrag(state:DragState,point:Vec2):void{if(!state.finalized)state.last={...point};}
export function dragPull(state:DragState):Vec2{return{x:state.last.x-state.start.x,y:state.last.y-state.start.y};}
/** Finalizes at most once. The last in-bounds point is retained for outside releases. */
export function finalizeDrag(state:DragState|undefined,launch:(pull:Vec2)=>boolean):boolean{
  if(!state||state.finalized)return false;
  state.finalized=true;
  const pull=dragPull(state);
  return pullGauge(pull).length>=TUNING.minimumTorsoDrag&&launch(pull);
}
