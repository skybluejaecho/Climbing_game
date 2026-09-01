import {describe,expect,it} from 'vitest';
import {CAMERA_CONFIG,cameraTarget,stepCamera,stepFallCamera} from './camera';
import {createWorld,generateDecisionRow,torsoCenter,updateCamera} from './world';

describe('upward camera',()=>{
  it('is monotonic and converges smoothly without snapping',()=>{let state={y:0,targetY:0};const target=cameraTarget(state,{torsoY:-300,velocityY:-900});const ys:number[]=[];for(let i=0;i<80;i++){state=stepCamera(state,target);ys.push(state.y);}expect(ys.every((y,i)=>i===0||y<=ys[i-1])).toBe(true);expect(ys[0]).toBeGreaterThan(target);expect(ys[0]).toBeGreaterThanOrEqual(-CAMERA_CONFIG.maxStep);expect(ys.at(-1)).toBeLessThan(ys[0]);});
  it('bounds look-ahead and target lag for strong launches',()=>{const state={y:0,targetY:0},fast=cameraTarget(state,{torsoY:-100,velocityY:-100000}),faster=cameraTarget(state,{torsoY:-100,velocityY:-200000});expect(fast).toBe(faster);expect(fast).toBeGreaterThanOrEqual(-CAMERA_CONFIG.maxTargetLag);});
  it('is deterministic across repeated fixed steps',()=>{const run=()=>{let s={y:0,targetY:0};for(let i=0;i<120;i++){const target=cameraTarget(s,{torsoY:200-i*5,velocityY:-600});s=stepCamera(s,target);}return s;};expect(run()).toEqual(run());});
  it('does not move for low or downward torso motion',()=>{for(const velocityY of [0,-CAMERA_CONFIG.minimumUpwardSpeed+1,300]){const state={y:-40,targetY:-40},target=cameraTarget(state,{torsoY:-500,velocityY});expect(stepCamera(state,target)).toEqual(state);}});
  it('resets split cameras and keeps an upcoming row visible at launch speeds',()=>{const reset=createWorld();expect(reset.progressCameraY).toBe(0);expect(reset.renderCameraY).toBe(0);const w=createWorld(7);w.floorSupports=[];for(let step=0;step<90;step++){for(const p of w.particles){p.y-=5;p.previous.y=p.y+5;}updateCamera(w);}const torso=torsoCenter(w),upcoming=generateDecisionRow(Math.max(0,Math.ceil((20-torso.y)/110)+1),7);expect(upcoming.some(h=>h.y-w.progressCameraY>=0&&h.y-w.progressCameraY<=960)).toBe(true);});
  it('fall camera can smoothly follow downward',()=>{const a=stepFallCamera(-500,500),b=stepFallCamera(a,700);expect(a).toBeGreaterThan(-500);expect(b).toBeGreaterThan(a);});
});
