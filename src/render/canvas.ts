import {BODY} from '../physics/world';
import {TUNING} from '../physics/tuning';
import type {Hold,Vec2,World} from '../physics/types';
import {ROUTE_COLORS,holdVisual,midpoint,seededUnit} from './design';

type Ctx=CanvasRenderingContext2D;
const segment=(ctx:Ctx,a:Vec2,b:Vec2,width:number,color:string)=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.lineCap='round';ctx.stroke()};

export function drawGym(ctx:Ctx,cameraY:number):void{
  const top=cameraY-40,bottom=cameraY+1000;
  const sky=ctx.createLinearGradient(0,top,0,bottom);sky.addColorStop(0,'#1a2430');sky.addColorStop(1,'#0c121b');ctx.fillStyle=sky;ctx.fillRect(0,top,720,1040);
  ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=24;ctx.fillStyle='#caa978';ctx.fillRect(92,top,536,1040);ctx.shadowBlur=0;
  const firstPanel=Math.floor(top/240)*240;
  for(let y=firstPanel;y<bottom;y+=240)for(let column=0;column<2;column++){
    const x=92+column*268,shade=(Math.floor(y/240)+column)%2;ctx.fillStyle=shade?'#cda976':'#d7b784';ctx.fillRect(x+1,y+1,266,238);ctx.strokeStyle='rgba(73,47,25,.28)';ctx.lineWidth=2;ctx.strokeRect(x,y,268,240);
    ctx.strokeStyle='rgba(255,245,218,.18)';ctx.lineWidth=1;for(let grain=0;grain<5;grain++){const gy=y+30+grain*42+seededUnit(y+column*97+grain)*12;ctx.beginPath();ctx.moveTo(x+18,gy);ctx.bezierCurveTo(x+85,gy-9,x+170,gy+10,x+248,gy-2);ctx.stroke()}
  }
  ctx.fillStyle='rgba(70,47,29,.38)';const firstNut=Math.floor(top/48)*48;for(let y=firstNut;y<bottom;y+=48)for(let x=116;x<=604;x+=48){ctx.beginPath();ctx.arc(x+(Math.floor(y/48)%2)*8,y,2.2,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='rgba(244,236,215,.1)';for(let y=Math.floor(top/180)*180;y<bottom;y+=180){const x=160+seededUnit(y*13)*360;ctx.beginPath();ctx.ellipse(x,y+75,42,12,.25,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle='#253448';ctx.fillRect(72,TUNING.groundY,576,70);ctx.fillStyle='#52677f';ctx.fillRect(72,TUNING.groundY,576,12);ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=2;for(let x=72;x<648;x+=144){ctx.beginPath();ctx.moveTo(x,TUNING.groundY);ctx.lineTo(x,TUNING.groundY+70);ctx.stroke()}
}

function holdPath(ctx:Ctx,h:Hold):void{
  const r=h.radius,rotation=(seededUnit(h.id)-.5)*.7;ctx.save();ctx.translate(h.x,h.y);ctx.rotate(rotation);ctx.beginPath();
  switch(holdVisual(h)){case'jug':ctx.moveTo(-r*.95,-r*.15);ctx.bezierCurveTo(-r*.8,-r,r*.55,-r*1.05,r*.95,-r*.25);ctx.bezierCurveTo(r*1.15,r*.55,r*.25,r*.95,-r*.65,r*.72);ctx.bezierCurveTo(-r*1.05,r*.5,-r*1.08,r*.1,-r*.95,-r*.15);break;case'crimp':ctx.roundRect(-r*1.15,-r*.38,r*2.3,r*.76,r*.22);break;case'pinch':ctx.roundRect(-r*.55,-r*1.1,r*1.1,r*2.2,r*.45);break;case'sloper':ctx.ellipse(0,0,r*1.1,r*.72,0,0,Math.PI*2);break;}ctx.closePath();ctx.restore();
}

export function drawHold(ctx:Ctx,h:Hold,state:{active:boolean;next:boolean;gripped:boolean;hovered:boolean;pressed:boolean}):void{
  const palette=ROUTE_COLORS[h.color],alpha=state.active||state.gripped?1:state.next?.34:.22;ctx.save();ctx.globalAlpha=alpha;if(state.active||state.hovered||state.gripped){ctx.shadowColor=state.gripped?'#ffe178':palette.light;ctx.shadowBlur=state.hovered?18:11}
  holdPath(ctx,h);const gradient=ctx.createLinearGradient(h.x-h.radius,h.y-h.radius,h.x+h.radius,h.y+h.radius);gradient.addColorStop(0,state.gripped?'#ffd95a':palette.light);gradient.addColorStop(.5,state.gripped?'#f5a623':palette.base);gradient.addColorStop(1,state.gripped?'#a95e00':palette.dark);ctx.fillStyle=gradient;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=state.hovered?'#fffdf2':state.active?'rgba(255,255,255,.88)':'rgba(32,28,25,.5)';ctx.lineWidth=state.hovered?4:2;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.38)';ctx.beginPath();ctx.ellipse(h.x-h.radius*.22,h.y-h.radius*.28,h.radius*.28,h.radius*.12,-.3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(state.pressed){ctx.beginPath();ctx.arc(h.x,h.y,h.radius+15,0,Math.PI*2);ctx.strokeStyle='#fff1a8';ctx.lineWidth=4;ctx.stroke()}ctx.restore();
}

export function drawClimber(ctx:Ctx,w:World):void{
  const p=w.particles,skin='#e9b68f',shirt='#f5c542',pants='#24445f',shoe='#151c24';const limb=(a:number,b:number,width:number,color:string)=>segment(ctx,p[a],p[b],width,color);ctx.save();ctx.shadowColor='rgba(10,18,24,.3)';ctx.shadowBlur=7;
  limb(BODY.hipL,BODY.kneeL,18,pants);limb(BODY.kneeL,BODY.footL,15,pants);limb(BODY.hipR,BODY.kneeR,18,pants);limb(BODY.kneeR,BODY.footR,15,pants);limb(BODY.shoulderL,BODY.elbowL,15,skin);limb(BODY.elbowL,BODY.handL,12,skin);limb(BODY.shoulderR,BODY.elbowR,15,skin);limb(BODY.elbowR,BODY.handR,12,skin);
  const shoulders=midpoint(p[BODY.shoulderL],p[BODY.shoulderR]),hips=midpoint(p[BODY.hipL],p[BODY.hipR]),dx=hips.x-shoulders.x,dy=hips.y-shoulders.y,angle=Math.atan2(dy,dx)-Math.PI/2,length=Math.hypot(dx,dy);ctx.save();ctx.translate((shoulders.x+hips.x)/2,(shoulders.y+hips.y)/2);ctx.rotate(angle);ctx.beginPath();ctx.roundRect(-31,-length/2-7,62,length+14,20);const shirtGradient=ctx.createLinearGradient(-30,0,30,0);shirtGradient.addColorStop(0,'#bb7920');shirtGradient.addColorStop(.45,shirt);shirtGradient.addColorStop(1,'#ffe17a');ctx.fillStyle=shirtGradient;ctx.fill();ctx.fillStyle='#1c344a';ctx.beginPath();ctx.roundRect(-29,length/2-10,58,23,9);ctx.fill();ctx.restore();
  for(const [id,isHand] of [[BODY.handL,true],[BODY.handR,true],[BODY.footL,false],[BODY.footR,false]] as const){const part=p[id],gripped=w.grips.some(g=>g.limb===id);ctx.beginPath();ctx.ellipse(part.x,part.y,isHand?9:13,isHand?10:7,0,0,Math.PI*2);ctx.fillStyle=isHand?(gripped?'#fff0c9':skin):shoe;ctx.fill();ctx.strokeStyle=gripped?'#ffe56d':'#a95f45';ctx.lineWidth=gripped?3:1.5;ctx.stroke()}
  const physicalHead=p[BODY.head],neck=p[BODY.neck],hx=physicalHead.x-neck.x,hy=physicalHead.y-neck.y,headDistance=Math.hypot(hx,hy)||1,visualDistance=Math.min(27,headDistance),head={x:neck.x+hx/headDistance*visualDistance,y:neck.y+hy/headDistance*visualDistance},bodyAngle=Math.atan2(head.y-neck.y,head.x-neck.x);segment(ctx,neck,head,10,skin);ctx.translate(head.x,head.y);ctx.rotate(bodyAngle-Math.PI/2);ctx.beginPath();ctx.ellipse(0,0,18,21,0,0,Math.PI*2);ctx.fillStyle=skin;ctx.fill();ctx.fillStyle='#39281f';ctx.beginPath();ctx.arc(0,-5,18,Math.PI,Math.PI*2);ctx.lineTo(16,0);ctx.quadraticCurveTo(2,-2,-17,4);ctx.closePath();ctx.fill();ctx.fillStyle='#24303a';ctx.beginPath();ctx.arc(-6,2,1.7,0,Math.PI*2);ctx.arc(6,2,1.7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8d4d3b';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,7,5,.15,Math.PI-.15);ctx.stroke();ctx.restore();
}
