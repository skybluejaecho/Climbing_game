import { TUNING } from './tuning';
import type { GripGrade, Hold, HoldProfile, Link, Particle, RouteColor, Vec2, World } from './types';
import { pullGauge } from './slingshot';
import { cameraTarget, stepCamera } from './camera';

export const BODY = { head:0,neck:1,shoulderL:2,shoulderR:3,elbowL:4,elbowR:5,handL:6,handR:7,hipL:8,hipR:9,kneeL:10,kneeR:11,footL:12,footR:13 } as const;
export const LIMBS = [BODY.handL,BODY.handR,BODY.footL,BODY.footR] as const;
export const STARTING_HOLD_IDS = { left:8,right:9 } as const;
export const COURSE_ROW_ZERO_Y = 400;
export const START_TORSO_Y = 740;
const holdById=(w:World,id:number)=>w.holds.find(h=>h.id===id);
const length=(a:Vec2,b:Vec2)=>Math.hypot(b.x-a.x,b.y-a.y);
const particle=(x:number,y:number,radius:number=TUNING.particleRadius):Particle=>({x,y,previous:{x,y},radius,inverseMass:1});
const link=(p:Particle[],a:number,b:number,stiffness=1):Link=>({a,b,length:length(p[a],p[b]),stiffness});
export const ROUTE_SEQUENCE:readonly RouteColor[]=['pink','blue','green'];
export function nextRouteAfter(route:RouteColor):RouteColor{return ROUTE_SEQUENCE[(ROUTE_SEQUENCE.indexOf(route)+1)%ROUTE_SEQUENCE.length];}

export function createWorld(runId=1):World {
  const p=[particle(290,650,15),particle(290,680),particle(262,700),particle(318,700),particle(250,635),particle(330,635),particle(245,575),particle(335,575),particle(274,780),particle(306,780),particle(266,840),particle(314,840),particle(258,903),particle(322,903)];
  const holds:Hold[]=[
    {id:STARTING_HOLD_IDS.left,x:p[BODY.handL].x,y:p[BODY.handL].y,radius:TUNING.holdRadius,color:'pink'},
    {id:STARTING_HOLD_IDS.right,x:p[BODY.handR].x,y:p[BODY.handR].y,radius:TUNING.holdRadius,color:'pink'},
  ];
  const pairs:Array<[number,number,number?]>=[[0,1],[1,2],[1,3],[2,3],[2,4],[4,6],[3,5],[5,7],[1,8],[1,9],[8,9],[2,8],[3,9],[8,10],[10,12],[9,11],[11,13]];
  const world:World={particles:p,links:pairs.map(([a,b,s])=>link(p,a,b,s)),holds,grips:[{limb:BODY.handL,hold:STARTING_HOLD_IDS.left},{limb:BODY.handR,hold:STARTING_HOLD_IDS.right}],launchTargets:[],feedback:null,gripProtectedUntil:{},activeRoute:'pink',nextRoute:'blue',time:0,focus:TUNING.focusCapacity,progressCameraY:0,progressTargetY:0,renderCameraY:0,height:0,highestChunk:-1,pruneCutoffY:null,floorSupports:[BODY.footL,BODY.footR],runId};
  pinGrips(world);maintainCourse(world);return world;
}

function pinGrips(w:World):void {for(const limb of w.floorSupports){const p=w.particles[limb];p.y=TUNING.groundY-p.radius;p.previous.y=p.y;}for(const g of w.grips){if(!LIMBS.includes(g.limb as typeof LIMBS[number]))throw Error('Only an end limb can grip');const p=w.particles[g.limb],h=holdById(w,g.hold);if(!h)throw Error(`Unknown hold ${g.hold}`);p.x=h.x;p.y=h.y;p.previous.x=h.x;p.previous.y=h.y;} }
function solveLink(w:World,l:Link):void {const a=w.particles[l.a],b=w.particles[l.b],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.0001,c=(d-l.length)/d*l.stiffness,total=a.inverseMass+b.inverseMass;if(!total)return;a.x+=dx*c*a.inverseMass/total;a.y+=dy*c*a.inverseMass/total;b.x-=dx*c*b.inverseMass/total;b.y-=dy*c*b.inverseMass/total;}
function collide(_w:World,p:Particle):void {const minX=TUNING.wallX+p.radius;if(p.x<minX){const vx=p.x-p.previous.x;p.x=minX;p.previous.x=p.x+vx*TUNING.wallRestitution;}}
export function stabilizeHead(w:World):void{
  const head=w.particles[BODY.head],sl=w.particles[BODY.shoulderL],sr=w.particles[BODY.shoulderR],hl=w.particles[BODY.hipL],hr=w.particles[BODY.hipR];
  const sx=(sl.x+sr.x)/2,sy=(sl.y+sr.y)/2,hx=(hl.x+hr.x)/2,hy=(hl.y+hr.y)/2,dx=sx-hx,dy=sy-hy,d=Math.hypot(dx,dy);
  if(!Number.isFinite(d)||d<1e-6)return;
  const ux=dx/d,uy=dy/d,targetX=sx+ux*TUNING.headShoulderClearance,targetY=sy+uy*TUNING.headShoulderClearance;
  let moveX=(targetX-head.x)*TUNING.headStability,moveY=(targetY-head.y)*TUNING.headStability;
  const projected=(head.x-sx)*ux+(head.y-sy)*uy,shortfall=TUNING.headMinimumClearance-projected;
  if(shortfall>0){moveX+=ux*shortfall;moveY+=uy*shortfall;}
  if(!Number.isFinite(moveX)||!Number.isFinite(moveY))return;
  head.x+=moveX;head.y+=moveY;head.previous.x+=moveX;head.previous.y+=moveY;
}
export function stepWorld(w:World,dt=TUNING.fixedStep):void {const dt2=dt*dt;for(const p of w.particles){const vx=(p.x-p.previous.x)*TUNING.airDamping,vy=(p.y-p.previous.y)*TUNING.airDamping;p.previous.x=p.x;p.previous.y=p.y;p.x+=vx;p.y+=vy+TUNING.gravity*dt2;}for(let i=0;i<TUNING.constraintIterations;i++){for(const l of w.links)solveLink(w,l);for(const p of w.particles)collide(w,p);pinGrips(w);}stabilizeHead(w);collide(w,w.particles[BODY.head]);w.time+=dt;updateCamera(w);maintainCourse(w);}

export function supportCount(w:World):number{return w.grips.length+w.floorSupports.length;}
export function updateFocus(w:World,realDt:number,spaceHeld:boolean):number{const airborne=supportCount(w)===0;if(spaceHeld&&airborne&&w.focus>0){w.focus=Math.max(0,w.focus-realDt*TUNING.focusDrainPerSecond);return TUNING.slowMotionScale;}if(!airborne)w.focus=Math.min(TUNING.focusCapacity,w.focus+realDt*TUNING.focusRechargePerSecond);return 1;}
function hash(n:number):number{n=Math.imul(n^0x9e3779b9,0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return (n^(n>>>16))>>>0;}
const GENERATED_ID_BASE=1000,ROWS_PER_CHUNK=4,HOLDS_PER_ROW=4;
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const holdXMin=TUNING.wallX+TUNING.holdRadius,holdXMax=TUNING.wallRight-TUNING.holdRadius;

/** Seeded, bounded SAFE walk. Recomputed from row zero so chunks remain independently deterministic. */
export function safeHoldPosition(row:number,runId=1):Vec2{
  let x=250+(hash(runId*13007+97)%221);
  for(let current=0;current<=row;current++){
    const delta=(hash(runId*7919+current*104729+31)%105)-52;
    x=clamp(x+delta,holdXMin+145,holdXMax-145);
  }
  return{x,y:COURSE_ROW_ZERO_Y-row*TUNING.safeRise};
}
export function rowColor(row:number):RouteColor{return ROUTE_SEQUENCE[(row+1)%ROUTE_SEQUENCE.length];}
export function generateDecisionRow(row:number,runId=1):Hold[]{
  const safe=safeHoldPosition(row,runId),direction=(hash(runId*3571+row*65537)&1)?1:-1;
  const specs:Array<[HoldProfile,number,number]>=[['SAFE',0,0],['STANDARD',direction*76,-18],['RISK',direction*-145,-40]];
  if(row%4===0)specs.push(['RECOVERY',direction*-20,44]);
  return specs.map(([profile,dx,dy],slot)=>({id:GENERATED_ID_BASE+row*HOLDS_PER_ROW+slot,row,profile,x:clamp(safe.x+dx,holdXMin,holdXMax),y:safe.y+dy,radius:TUNING.holdRadius,color:rowColor(row)}));
}
export function generateChunk(chunk:number,runId=1):Hold[]{return Array.from({length:ROWS_PER_CHUNK},(_,i)=>generateDecisionRow(chunk*ROWS_PER_CHUNK+i,runId)).flat();}
export function updateCamera(w:World):void{const torso=torsoCenter(w),previousY=torsoCenterPreviousY(w),state={y:w.progressCameraY,targetY:w.progressTargetY},target=cameraTarget(state,{torsoY:torso.y,velocityY:(torso.y-previousY)/TUNING.fixedStep}),next=stepCamera(state,target);w.progressCameraY=next.y;w.progressTargetY=next.targetY;w.height=Math.max(w.height,Math.max(0,START_TORSO_Y-torso.y));}
function torsoCenterPreviousY(w:World):number{const ids=[BODY.shoulderL,BODY.shoulderR,BODY.hipL,BODY.hipR];return ids.reduce((s,i)=>s+w.particles[i].previous.y,0)/ids.length;}
export function maintainCourse(w:World):void{const needed=Math.max(0,Math.floor((-w.progressCameraY+TUNING.cameraTopMargin)/TUNING.chunkHeight)+TUNING.chunksAhead);while(w.highestChunk<needed){w.highestChunk++;w.holds.push(...generateChunk(w.highestChunk,w.runId));}if(-w.progressCameraY>=TUNING.pruneStartAscent){const cutoff=w.progressCameraY+TUNING.pruneDistance;w.pruneCutoffY=w.pruneCutoffY===null?cutoff:Math.min(w.pruneCutoffY,cutoff);}if(w.pruneCutoffY!==null){const protectedIds=new Set([...w.grips.map(g=>g.hold),...w.launchTargets.map(t=>t.hold)]);w.holds=w.holds.filter(h=>h.y<=w.pruneCutoffY!||protectedIds.has(h.id));}w.launchTargets=w.launchTargets.filter(t=>w.holds.some(h=>h.id===t.hold));}

export function gradeApproach(q:number):GripGrade{return q>=TUNING.perfectApproach?'PERFECT':q>=TUNING.goodApproach?'GOOD':'BARELY';}
function quality(p:Particle,h:Hold):number{const vx=p.x-p.previous.x,vy=p.y-p.previous.y,dx=h.x-p.x,dy=h.y-p.y,s=Math.hypot(vx,vy),d=Math.hypot(dx,dy);return !s||!d?1:Math.max(0,Math.min(1,(vx*dx+vy*dy)/(s*d)));}
function attach(w:World,limb:number,h:Hold,inputTimeMs:number):boolean{if(h.color!==w.activeRoute||w.grips.some(g=>g.limb===limb||g.hold===h.id))return false;const p=w.particles[limb];w.grips.push({limb,hold:h.id});w.grips.sort((a,b)=>a.limb-b.limb);w.gripProtectedUntil[h.id]=inputTimeMs+TUNING.gripProtectionMs;w.launchTargets=w.launchTargets.filter(t=>t.limb!==limb);w.feedback={kind:'grip',grade:gradeApproach(quality(p,h)),limb,hold:h.id,time:w.time};pinGrips(w);return true;}

export function interactWithHold(w:World,holdId:number,inputTimeMs=0):'attached'|'released'|'protected'|'flicked'|'wrong-route'|'none'{
  const h=holdById(w,holdId);if(!h)return'none';if(h.color!==w.activeRoute){w.feedback={kind:'wrong-route',hold:holdId,time:w.time};return'wrong-route';}
  const occupied=w.grips.find(g=>g.hold===holdId);if(occupied){if(inputTimeMs<(w.gripProtectedUntil[holdId]??0)){w.feedback={kind:'protected',limb:occupied.limb,hold:holdId,time:w.time};return'protected';}w.grips=w.grips.filter(g=>g!==occupied);delete w.gripProtectedUntil[holdId];return'released';}
  const loose=LIMBS.filter(l=>!w.grips.some(g=>g.limb===l));
  const overlap=loose.map(limb=>({limb,d:length(w.particles[limb],h)})).filter(v=>v.d<=w.particles[v.limb].radius+h.radius).sort((a,b)=>a.d-b.d||a.limb-b.limb)[0];
  if(overlap){attach(w,overlap.limb,h,inputTimeMs);return'attached';}
  const best=loose.map(limb=>({limb,d:length(w.particles[limb],h)})).sort((a,b)=>a.d-b.d||a.limb-b.limb)[0];if(!best){w.feedback={kind:'occupied',hold:holdId,time:w.time};return'none';}
  const p=w.particles[best.limb],dx=h.x-p.x,dy=h.y-p.y,m=Math.hypot(dx,dy)||1;p.previous.x-=dx/m*TUNING.limbFlickSpeed*TUNING.fixedStep;p.previous.y-=dy/m*TUNING.limbFlickSpeed*TUNING.fixedStep;w.launchTargets=w.launchTargets.filter(t=>t.limb!==best.limb);w.launchTargets.push({limb:best.limb,hold:holdId,launchedAt:w.time,missed:false});return'flicked';
}
export function tryGrip(w:World,inputTimeMs=0):boolean{let caught=false;for(const t of [...w.launchTargets].sort((a,b)=>a.limb-b.limb)){const h=holdById(w,t.hold),p=w.particles[t.limb];if(!h||t.missed)continue;if(length(p,h)<=TUNING.gripSnapDistance&&attach(w,t.limb,h,inputTimeMs)){caught=true;continue;}const vx=p.x-p.previous.x,vy=p.y-p.previous.y;t.missed=vx*(h.x-p.x)+vy*(h.y-p.y)<=0;}return caught;}

/** Keeps a held pointer's catch intent alive without applying another flick impulse. */
export function retainCatchTarget(w:World,holdId:number):boolean{
  const h=holdById(w,holdId);if(!h||h.color!==w.activeRoute||w.grips.some(g=>g.hold===holdId))return false;
  const best=LIMBS.filter(limb=>!w.grips.some(g=>g.limb===limb)).map(limb=>({limb,d:length(w.particles[limb],h)})).sort((a,b)=>a.d-b.d||a.limb-b.limb)[0];
  if(!best)return false;
  w.launchTargets=w.launchTargets.filter(t=>t.limb!==best.limb&&t.hold!==holdId);
  w.launchTargets.push({limb:best.limb,hold:holdId,launchedAt:w.time,missed:false});return true;
}

export function torsoCenter(w:World):Vec2{const ids=[BODY.shoulderL,BODY.shoulderR,BODY.hipL,BODY.hipR];return{x:ids.reduce((s,i)=>s+w.particles[i].x,0)/4,y:ids.reduce((s,i)=>s+w.particles[i].y,0)/4};}
export function torsoLaunchPower(count:number):number{return TUNING.torsoLaunchBase*(1+(Math.max(1,Math.min(4,count))-1)*TUNING.torsoGripBonus);}
export function launchTorso(w:World,pull:Vec2):boolean{const count=supportCount(w),gauge=pullGauge(pull);if(!count||gauge.length<TUNING.minimumTorsoDrag)return false;const scale=torsoLaunchPower(count)*TUNING.fixedStep;for(const p of w.particles){p.previous.x+=gauge.capped.x*scale;p.previous.y+=gauge.capped.y*scale;}w.grips=[];w.floorSupports=[];w.gripProtectedUntil={};w.launchTargets=[];w.activeRoute=w.nextRoute;w.nextRoute=nextRouteAfter(w.activeRoute);return true;}
