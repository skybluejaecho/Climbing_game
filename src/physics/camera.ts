export interface CameraSample { torsoY:number; velocityY:number }
export interface CameraState { y:number; targetY:number }
export interface CameraConfig {
  settleY:number; lookAheadSeconds:number; maxLookAhead:number; minimumUpwardSpeed:number;
  convergence:number; maxStep:number; maxTargetLag:number;
}

export const CAMERA_CONFIG:CameraConfig={
  settleY:365,
  lookAheadSeconds:.16,
  maxLookAhead:130,
  minimumUpwardSpeed:18,
  convergence:.1,
  maxStep:4,
  maxTargetLag:210,
};

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

/** Selects an upward-only target. Low or downward motion cannot advance it. */
export function cameraTarget(state:CameraState,sample:CameraSample,config:CameraConfig=CAMERA_CONFIG):number{
  const upwardSpeed=Math.max(0,-sample.velocityY);
  if(upwardSpeed<config.minimumUpwardSpeed)return state.y;
  const lookAhead=clamp(upwardSpeed*config.lookAheadSeconds,0,config.maxLookAhead);
  const requested=sample.torsoY-config.settleY-lookAhead;
  return Math.max(state.y-config.maxTargetLag,Math.min(state.targetY,requested));
}

/** One deterministic fixed-step camera update; y can only decrease (move upward). */
export function stepCamera(state:CameraState,targetY:number,config:CameraConfig=CAMERA_CONFIG):CameraState{
  const target=Math.min(targetY,state.y);
  const distance=state.y-target;
  if(distance<=0)return{y:state.y,targetY:target};
  const movement=Math.min(config.maxStep,distance*config.convergence);
  return{y:state.y-movement,targetY:target};
}

/** Downward-capable presentation camera used while the body falls. */
export function stepFallCamera(y:number,torsoY:number,settleY=480,convergence=.08,maxStep=12):number{
  const distance=torsoY-settleY-y;
  return y+Math.sign(distance)*Math.min(Math.abs(distance)*convergence,maxStep);
}
