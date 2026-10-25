'use strict';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const colors=['#7ce9c3','#e8b97a','#9d9af3'];
const rules=[[.16,-.62,.48],[.48,.16,-.62],[-.62,.48,.16]];
let width=1,height=1,particles=[],paused=false,pointer=null,last=0;
const count=document.querySelector('#count'),speed=document.querySelector('#speed'),status=document.querySelector('#status');
function spawn(n){return Array.from({length:n},(_,i)=>({x:Math.random()*width,y:Math.random()*height,vx:0,vy:0,type:i%3}));}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);width=Math.max(1,r.width);height=Math.max(1,r.height);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);particles=spawn(+count.value);}
function update(dt){const next=particles.map(p=>({...p})),scale=+speed.value/100;for(let i=0;i<particles.length;i++){const a=particles[i];let fx=0,fy=0;for(let j=0;j<particles.length;j++){if(i===j)continue;const b=particles[j];let dx=b.x-a.x,dy=b.y-a.y;if(dx>width/2)dx-=width;if(dx< -width/2)dx+=width;if(dy>height/2)dy-=height;if(dy< -height/2)dy+=height;const d=Math.hypot(dx,dy);if(d<.01||d>80)continue;const f=d<12?-(12-d)*.032:rules[a.type][b.type]*(1-d/80)*.09;fx+=dx/d*f;fy+=dy/d*f;}if(pointer){const dx=pointer.x-a.x,dy=pointer.y-a.y,d=Math.hypot(dx,dy);if(d>1&&d<180){fx+=dx/d*(1-d/180)*.22;fy+=dy/d*(1-d/180)*.22;}}const q=next[i];q.vx=Math.max(-3,Math.min(3,(a.vx+fx*dt*scale)*.92));q.vy=Math.max(-3,Math.min(3,(a.vy+fy*dt*scale)*.92));q.x=((a.x+q.vx*dt*scale)%width+width)%width;q.y=((a.y+q.vy*dt*scale)%height+height)%height;}particles=next;}
function frame(t){const dt=last?Math.min((t-last)/16.67,2):1;last=t;if(!paused)update(dt);ctx.fillStyle='#071017';ctx.fillRect(0,0,width,height);for(const p of particles){ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,Math.PI*2);ctx.fillStyle=colors[p.type];ctx.fill();}status.textContent=particles.length+' nodes · '+(paused?'pausat':'actiu');requestAnimationFrame(frame);}
function position(e){const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);position(e);});canvas.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')position(e);});canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);
count.addEventListener('input',()=>{document.querySelector('#countValue').textContent=count.value;particles=spawn(+count.value);});speed.addEventListener('input',()=>document.querySelector('#speedValue').textContent=speed.value);
document.querySelector('#toggle').addEventListener('click',e=>{paused=!paused;e.target.textContent=paused?'Continua':'Pausa';});
document.querySelector('#reset').addEventListener('click',()=>particles=spawn(+count.value));
window.addEventListener('resize',resize);resize();if(matchMedia('(prefers-reduced-motion: reduce)').matches){paused=true;document.querySelector('#toggle').textContent='Continua';}requestAnimationFrame(frame);
