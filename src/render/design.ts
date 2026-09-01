import type { Hold, RouteColor, Vec2 } from '../physics/types';

export const ROUTE_COLORS:Record<RouteColor,{base:string;light:string;dark:string;ink:string}>={
  pink:{base:'#ef4f91',light:'#ff91bd',dark:'#9f1d57',ink:'#fff7fb'},
  blue:{base:'#1ba8e5',light:'#76d9ff',dark:'#086893',ink:'#f4fcff'},
  green:{base:'#38bd78',light:'#91e8b8',dark:'#177047',ink:'#f5fff9'},
};

export type HoldVisual='jug'|'crimp'|'sloper'|'pinch';
export function holdVisual(hold:Pick<Hold,'id'|'profile'>):HoldVisual{
  if(hold.profile==='SAFE'||hold.id<1000)return'jug';
  if(hold.profile==='RISK')return'crimp';
  if(hold.profile==='RECOVERY')return'sloper';
  return hold.id%2?'pinch':'sloper';
}
export function seededUnit(seed:number):number{let value=Math.imul(seed^0x9e3779b9,0x85ebca6b);value=Math.imul(value^(value>>>13),0xc2b2ae35);return((value^(value>>>16))>>>0)/4294967295;}
export function midpoint(a:Vec2,b:Vec2):Vec2{return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
