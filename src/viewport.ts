import type { Vec2 } from './physics/types';
export const LOGICAL_WIDTH=720,LOGICAL_HEIGHT=960;
export interface ViewportTransform { scale:number; offsetX:number; offsetY:number; width:number; height:number }
export function viewportTransform(width:number,height:number):ViewportTransform{const scale=Math.min(width/LOGICAL_WIDTH,height/LOGICAL_HEIGHT);return{scale,offsetX:(width-LOGICAL_WIDTH*scale)/2,offsetY:(height-LOGICAL_HEIGHT*scale)/2,width,height};}
export function screenToLogical(point:Vec2,v:ViewportTransform):Vec2{return{x:(point.x-v.offsetX)/v.scale,y:(point.y-v.offsetY)/v.scale};}
export function logicalToWorld(point:Vec2,cameraY:number):Vec2{return{x:point.x,y:point.y+cameraY};}
export function logicalToScreen(point:Vec2,v:ViewportTransform):Vec2{return{x:point.x*v.scale+v.offsetX,y:point.y*v.scale+v.offsetY};}
