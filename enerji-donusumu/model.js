/* Piecewise analytic motion, SI units. Ramp: 30°, friction only on the flat patch.
   Spring is ideal. Thermal energy is retained in the selected block+surface system. */
(function(root){'use strict';
const VERSION='2026.10.29-2B1',SIN=.5,COS=Math.sqrt(3)/2;
function build(input){
 if(input?.scenario==='static')return buildIncline(input);
 const p={mass:2,height:5,speed:0,mu:.2,length:6,k:200,g:10,scenario:'spring',...input,angle:30};
 for(const [key,min,max] of [['mass',.5,10],['height',0,10],['speed',0,10],['mu',0,.8],['length',1,12],['k',50,500],['g',9.81,10]])if(!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw Error('Geçersiz parametre: '+key);
 const ramp=p.height/SIN,end=ramp+p.length,E0=p.mass*p.g*p.height+.5*p.mass*p.speed**2;
 const segments=[];let time=0,q=0,v=p.speed,thermal=0,finished=false,reason='';
 const heightAt=q=>Math.max(0,p.height-Math.min(q,ramp)*SIN)+(p.scenario==='double'?Math.max(0,q-end)*SIN:0);
 let firstPeak=null,peakTime=null;
 const energy=(q,v,th)=>{const Ug=p.mass*p.g*heightAt(q),Uy=p.scenario==='spring'?.5*p.k*Math.max(0,q-end)**2:0,K=.5*p.mass*v*v;return {K,Ug,Uy,thermal:th,mechanical:K+Ug+Uy,total:K+Ug+Uy+th};};
 function append(duration,kind,a=0){if(duration<1e-12)return;const seg={start:time,duration,q,v,thermal,kind,a};segments.push(seg);const z=sampleSegment(seg,duration);q=z.q;v=z.v;thermal=z.thermal;time+=duration;}
 function sampleSegment(seg,t){let Q,V,th=seg.thermal;if(seg.kind==='spring'){const w=Math.sqrt(p.k/p.mass);Q=end+seg.v/w*Math.sin(w*t);V=seg.v*Math.cos(w*t);}else{Q=seg.q+seg.v*t+.5*seg.a*t*t;V=seg.v+seg.a*t;if(seg.kind==='rough')th+=p.mu*p.mass*p.g*Math.abs(Q-seg.q);}return {q:Q,v:V,thermal:th};}
 function travelFlat(direction){const speed=Math.abs(v),acc=p.mu*p.g;if(speed<1e-10){v=0;finished=true;reason='Cisim durdu';return;}if(acc>0&&speed*speed/(2*acc)<=p.length+1e-10){append(speed/acc,'rough',-direction*acc);v=0;finished=true;reason='Cisim sürtünmeli bölümde durdu';return;}const dt=acc?2*p.length/(speed+Math.sqrt(Math.max(0,speed*speed-2*acc*p.length))):p.length/speed;append(dt,'rough',-direction*acc);q=direction>0?end:ramp;}
 const a=p.g*SIN;
 if(ramp>0)append(2*ramp/(v+Math.sqrt(v*v+2*a*ramp)),'ramp',a);
 q=ramp;
 if(p.scenario==='ideal'){finished=true;reason='Rampa sonuna ulaşıldı';}
 for(let cycles=0;!finished&&cycles<100;cycles++){
  travelFlat(1);if(finished)break;
  if(!['spring','double'].includes(p.scenario)){finished=true;reason='Pürüzlü bölümün sonuna ulaşıldı';break;}
  if(p.scenario==='double'){append(v/a,'right-ramp',-a);v=0;if(firstPeak===null){firstPeak=heightAt(q);peakTime=time;}append(Math.sqrt(2*(q-end)/a),'right-ramp',-a);q=end;}else{append(Math.PI/Math.sqrt(p.k/p.mass),'spring');q=end;}
  travelFlat(-1);if(finished)break;
  if(ramp===0){finished=true;reason='Parkurun sol sınırına ulaşıldı';break;}
  const upDistance=v*v/(2*a);
  if(upDistance>ramp+1e-9){const dt=2*ramp/(-v+Math.sqrt(v*v-2*a*ramp));append(dt,'ramp',a);q=0;finished=true;reason='Cisim üst sınırdan çıkıyor; parkur dışı modellenmez';break;}
  append(-v/a,'ramp',a);v=0;
  const down=ramp-q;append(Math.sqrt(2*down/a),'ramp',a);q=ramp;
  if(time>=30){reason='30 saniyelik inceleme aralığı tamamlandı';break;}
 }
 const final={q,v,thermal};const duration=Math.min(time,30);if(time>30)reason='30 saniyelik inceleme aralığı tamamlandı';
 function at(t){t=Math.min(Math.max(0,t),duration);let z={q:0,v:p.speed,thermal:0},phase='Başlangıç';for(const seg of segments){if(t>=seg.start){z=sampleSegment(seg,Math.min(t-seg.start,seg.duration));phase=seg.kind==='ramp'?'Sürtünmesiz rampa':seg.kind==='spring'?'İdeal yay':seg.kind==='right-ramp'?'Karşı rampa · sürtünmesiz':'Yatay bölüm';}if(t<seg.start+seg.duration)break;}if(t>=time-1e-9)z=final;const h=heightAt(z.q);return {...z,h,t,phase,done:t>=duration-1e-9,...energy(z.q,z.v,z.thermal)};}
 const samples=[];for(let t=0;t<duration;t+=1/60)samples.push(at(t));samples.push(at(duration));
 return {p,E0,ramp,end,duration,reason,segments,samples,at,firstPeak,peakTime};
}
// Initially resting block on a rough straight incline. The equality threshold stays at rest.
function buildIncline(input){
 const p={mass:2,length:6,g:10,angle:30,mus:.4,mu:.2,k:200,...input,scenario:'static',speed:0};
 for(const [key,min,max] of [['mass',.5,10],['length',1,12],['g',9.81,10],['angle',0,60],['mus',0,1],['mu',0,.8]])if(!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw Error('Geçersiz parametre: '+key);
 if(p.mu>p.mus+1e-12)throw Error('Kayma katsayısı statik katsayıyı aşamaz');
 const angle=p.angle*Math.PI/180,sin=Math.sin(angle),cos=Math.cos(angle),N=p.mass*p.g*cos,down=p.mass*p.g*sin,limit=p.mus*N,moving=down>limit+1e-10,friction=moving?p.mu*N:down,a=moving?(down-friction)/p.mass:0;
 p.height=p.length*sin;const E0=p.mass*p.g*p.height,arrival=moving?Math.sqrt(2*p.length/a):0,duration=Math.min(arrival,30),critical=Math.atan(p.mus)*180/Math.PI;
 const reason=!moving?'Statik denge: cisim hareket etmiyor':arrival>30?'30 saniyelik inceleme aralığı tamamlandı':'Eğik düzlemin sonuna ulaşıldı; sonraki hareket modellenmez';
 function at(t){t=Math.min(Math.max(0,t),duration);const q=moving?Math.min(p.length,.5*a*t*t):0,v=moving?a*t:0,h=Math.max(0,(p.length-q)*sin),K=.5*p.mass*v*v,Ug=p.mass*p.g*h,thermal=moving?friction*q:0;return {t,q,v,h,K,Ug,Uy:0,thermal,mechanical:K+Ug,total:K+Ug+thermal,phase:moving?'Kayma sürtünmesi':'Statik denge',done:t>=duration-1e-9,N,down,friction,limit,a,moving,critical};}
 const samples=[];for(let t=0;t<duration;t+=1/60)samples.push(at(t));samples.push(at(duration));
 return {p,E0,ramp:p.length,end:p.length,duration,reason,segments:[],samples,at,firstPeak:null,peakTime:null};
}
const api={build,VERSION,SIN,COS};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.EnergyModel=api;
})(typeof window!=='undefined'?window:globalThis);
