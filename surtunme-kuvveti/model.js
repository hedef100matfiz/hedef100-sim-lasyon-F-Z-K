/* Coulomb friction on a fixed plane. +x is right/up the slope.
   Piecewise constant force: solve each interval analytically, splitting at v=0. */
(function(root){'use strict';const EPS=1e-10;
function parameters(raw={}){const p={m:5,mus:.5,muk:.3,angle:0,v0:0,g:10,...raw};for(const k of ['m','mus','muk','angle','v0','g'])if(!Number.isFinite(p[k]))throw Error('Geçersiz '+k);if(p.m<=0||p.g<=0||p.muk<0||p.mus<p.muk||p.angle<0||p.angle>60)throw Error('Parametre sınırı');return p;}
function forces(p,v,F){if(!Number.isFinite(F)||!Number.isFinite(v))throw Error('Geçersiz kuvvet/hız');const theta=p.angle*Math.PI/180,N=p.m*p.g*Math.cos(theta),G=-p.m*p.g*Math.sin(theta),drive=F+G,limit=p.mus*N,kinetic=p.muk*N,tol=1e-10*Math.max(1,limit,Math.abs(drive));let friction,regime;
if(Math.abs(v)>EPS){friction=-Math.sign(v)*kinetic;regime=kinetic>0?'kinetic':'free';}else if(Math.abs(drive)<=limit+tol){friction=-drive;regime='static';}else{friction=-Math.sign(drive)*kinetic;regime='starting';}
const net=drive+friction;return {F,N,G,drive,limit,kinetic,friction,net,a:net/p.m,regime};}
class Simulation{
constructor(raw,F=0){this.p=parameters(raw);this.t=0;this.x=0;this.v=this.p.v0;this.segments=[];this.events=[];this.setForce(F);}
setForce(F){if(!Number.isFinite(F))throw Error('Geçersiz kuvvet');this.F=F;const last=this.events.at(-1);if(last&&last.t===this.t)last.F=F;else if(!last||last.F!==F)this.events.push({t:this.t,F});}
current(){return {t:this.t,x:this.x,v:this.v,...forces(this.p,this.v,this.F)};}
advance(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Geçersiz zaman');let left=dt,guard=0;while(left>1e-12){if(++guard>4)throw Error('Durma çözümü');const f=forces(this.p,this.v,this.F),a=f.a,stop=this.v*a<0?-this.v/a:Infinity,h=Math.min(left,stop);this.segments.push({t:this.t,h,x:this.x,v:this.v,a,F:this.F});this.x+=this.v*h+.5*a*h*h;this.v+=a*h;this.t+=h;left-=h;if(stop<=h+1e-12)this.v=0;}return this.current();}
at(time){const t=Math.max(0,Math.min(this.t,time));let x=0,v=this.p.v0;let lo=0,hi=this.segments.length-1,index=-1;while(lo<=hi){const mid=(lo+hi)>>1;if(this.segments[mid].t<=t){index=mid;lo=mid+1;}else hi=mid-1;}if(index>=0){const s=this.segments[index],dt=Math.min(s.h,t-s.t);x=s.x+s.v*dt+.5*s.a*dt*dt;v=s.v+s.a*dt;if(Math.abs(v)<EPS)v=0;}let F=this.events[0].F;for(let i=this.events.length-1;i>=0;i--)if(this.events[i].t<=t+1e-12){F=this.events[i].F;break;}return {t,x,v,...forces(this.p,v,F)};}
}
const api={Simulation,forces,parameters,VERSION:'2026.11.02-F1'};if(typeof module!=='undefined')module.exports=api;else root.FrictionModel=api;
})(typeof window==='undefined'?globalThis:window);
