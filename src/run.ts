import type { Hold, Vec2, World } from './physics/types';
import { stepFallCamera } from './physics/camera';
import { createWorld, supportCount, torsoCenter } from './physics/world';
import { TUNING } from './physics/tuning';

export type Phase='READY'|'GRIPPING'|'AIRBORNE'|'FALLING'|'RESULT';
export type DeathCause='GROUND_IMPACT'|'LOST_BELOW_ROUTE';
export interface Run { phase:Phase; world:World; identity:number; launches:number; catches:number; flightApexY:number|null; previousTorsoY:number|null; impactY:number|null; deathCause:DeathCause|null; bestHeight:number }
export const VIEWPORT_HEIGHT=960,VOID_DEPTH=1.2*VIEWPORT_HEIGHT;
export const RECOVERY_CAMERA_DROP=120,IRRECOVERABLE_APEX_DROP=528;
export const RECOVERY_ABOVE_TORSO=80,RECOVERY_BELOW_TORSO=.45*VIEWPORT_HEIGHT,RECOVERY_LATERAL_REACH=TUNING.reachableDistance;
export const RESULT_DROP_AFTER_IMPACT=180,WHOLE_RAGDOLL_BOUNDARY_CLEARANCE=40;

export function createRun(identity=1,bestHeight=0):Run{return{phase:'READY',world:createWorld(identity),identity,launches:0,catches:0,flightApexY:null,previousTorsoY:null,impactY:null,deathCause:null,bestHeight};}
export function restartRun(run:Run):Run{return createRun(run.identity+1,run.bestHeight);}
export function dynamicDeathBoundary(progressCameraY:number):{y:number;cause:DeathCause}{const voidY=progressCameraY+VOID_DEPTH;return voidY<TUNING.groundY?{y:voidY,cause:'LOST_BELOW_ROUTE'}:{y:TUNING.groundY,cause:'GROUND_IMPACT'};}
/** Existing active-route holds that a loose end limb could still plausibly recover to. */
export function viableRecoveryHolds(world:World,torso:Vec2=torsoCenter(world),boundaryY=dynamicDeathBoundary(world.progressCameraY).y):Hold[]{const occupied=new Set(world.grips.map(grip=>grip.hold));return world.holds.filter(hold=>hold.color===world.activeRoute&&!occupied.has(hold.id)&&hold.y>=torso.y-RECOVERY_ABOVE_TORSO&&hold.y<=Math.min(torso.y+RECOVERY_BELOW_TORSO,boundaryY)&&Math.abs(hold.x-torso.x)<=RECOVERY_LATERAL_REACH);}
export function hasViableRecoveryHold(world:World,torso?:Vec2,boundaryY?:number):boolean{return viableRecoveryHolds(world,torso,boundaryY).length>0;}
/** Spatial result gate, with a whole-body fallback for future collision/pinning changes. */
export function resultCompletionReached(world:World,impactY:number,boundaryY=dynamicDeathBoundary(world.progressCameraY).y):boolean{return torsoCenter(world).y>=impactY+RESULT_DROP_AFTER_IMPACT||world.particles.every(p=>p.y-p.radius>=boundaryY+WHOLE_RAGDOLL_BOUNDARY_CLEARANCE);}
function beginFlight(run:Run):void{const y=torsoCenter(run.world).y;run.phase='AIRBORNE';run.flightApexY=y;run.previousTorsoY=y;run.impactY=null;run.deathCause=null;}
function clearFlight(run:Run):void{run.flightApexY=null;run.previousTorsoY=null;run.impactY=null;run.deathCause=null;}
export function registerLaunch(run:Run):void{if((run.phase==='READY'||run.phase==='GRIPPING')&&supportCount(run.world)===0){beginFlight(run);run.launches++;}}
export function registerGripRelease(run:Run):void{if((run.phase==='READY'||run.phase==='GRIPPING')&&supportCount(run.world)===0)beginFlight(run);}
export function registerCatch(run:Run):void{if(run.phase==='AIRBORNE'&&supportCount(run.world)>0){run.phase='GRIPPING';run.catches++;clearFlight(run);}}
export function updateRun(run:Run,_realDt:number):void{
  const w=run.world;
  if(run.phase==='READY'||run.phase==='GRIPPING'||run.phase==='AIRBORNE')w.renderCameraY+=(w.progressCameraY-w.renderCameraY)*.12;
  if(run.phase==='AIRBORNE'){
    if(supportCount(w)>0){registerCatch(run);return;}
    const torso=torsoCenter(w),y=torso.y,previousY=run.previousTorsoY??y;
    run.flightApexY=Math.min(run.flightApexY??y,y);
    const descending=y>previousY,apexDrop=y-run.flightApexY;
    run.previousTorsoY=y;
    if(descending&&apexDrop>=RECOVERY_CAMERA_DROP)w.renderCameraY=stepFallCamera(w.renderCameraY,y);
    const boundary=dynamicDeathBoundary(w.progressCameraY);
    if(descending&&(y>=boundary.y||(apexDrop>=IRRECOVERABLE_APEX_DROP&&!hasViableRecoveryHold(w,torso,boundary.y)))){run.phase='FALLING';w.focus=0;if(y>=boundary.y){run.impactY=y;run.deathCause=boundary.cause;}}
  }else if(run.phase==='FALLING'){
    const y=torsoCenter(w).y;w.renderCameraY=stepFallCamera(w.renderCameraY,y);const boundary=dynamicDeathBoundary(w.progressCameraY);
    if(run.impactY===null&&y>=boundary.y){run.impactY=y;run.deathCause=boundary.cause;}
    if(run.impactY!==null&&resultCompletionReached(w,run.impactY,boundary.y)){run.phase='RESULT';run.bestHeight=Math.max(run.bestHeight,w.height);}
  }
}
export function canControl(run:Run):boolean{return run.phase==='READY'||run.phase==='GRIPPING'||run.phase==='AIRBORNE';}
