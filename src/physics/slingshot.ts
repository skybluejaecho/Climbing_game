import { TUNING } from './tuning';
import type { Vec2 } from './types';

export type PullGauge={rawLength:number;length:number;ratio:number;capped:Vec2};

/** The single source of truth for launch strength and its visual gauge. */
export function pullGauge(pull:Vec2):PullGauge{
  const rawLength=Math.hypot(pull.x,pull.y);
  if(!Number.isFinite(rawLength)||rawLength===0)return{rawLength:0,length:0,ratio:0,capped:{x:0,y:0}};
  const length=Math.min(rawLength,TUNING.maximumTorsoDrag),scale=length/rawLength;
  return{rawLength,length,ratio:length/TUNING.maximumTorsoDrag,capped:{x:pull.x*scale,y:pull.y*scale}};
}
export function previewEndpoint(center:Vec2,pull:Vec2):Vec2{const capped=pullGauge(pull).capped;return{x:center.x-capped.x,y:center.y-capped.y};}
