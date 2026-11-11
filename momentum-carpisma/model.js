/* One-dimensional isolated system; instantaneous collision, independent impulse pulse illustration. */
(function(root){'use strict';
function build(raw={}){const p={m1:2,m2:2,u1:4,u2:0,e:1,contact:.2,...raw};for(const k of Object.keys(p))if(typeof p[k]!=='number'||!Number.isFinite(p[k]))throw Error('Geçersiz parametre: '+k);if(p.m1<=0||p.m2<=0||p.e<0||p.e>1||p.contact<=0)throw Error('Parametre sınırı');
const M=p.m1+p.m2,relative=p.u1-p.u2,hit=relative>0,tc=hit?6/relative:null,P=p.m1*p.u1+p.m2*p.u2,K0=(p.m1*p.u1**2+p.m2*p.u2**2)/2,cm=P/M;
const v1=hit?(P-p.m2*p.e*relative)/M:p.u1,v2=hit?(P+p.m1*p.e*relative)/M:p.u2,J1=p.m1*(v1-p.u1),J2=-J1,Kf=(p.m1*v1*v1+p.m2*v2*v2)/2,loss=hit?.5*(p.m1*p.m2/M)*(1-p.e*p.e)*relative*relative:0,duration=hit?tc+2:4;
function at(t){t=Math.max(0,Math.min(duration,t));const after=hit&&t>=tc,x=hit?-3+p.u1*tc:0,a=after?v1:p.u1,b=after?v2:p.u2;return {t,after,x1:after?x+v1*(t-tc):-3+p.u1*t,x2:after?x+v2*(t-tc):3+p.u2*t,v1:a,v2:b,p1:p.m1*a,p2:p.m2*b,P:p.m1*a+p.m2*b,K:(p.m1*a*a+p.m2*b*b)/2,internal:after?loss:0};}
function force(tau,shape='triangle'){if(!hit||tau<0||tau>p.contact)return 0;return J1/p.contact*(shape==='rectangle'?1:4*Math.min(tau/p.contact,1-tau/p.contact));}
return {p,hit,tc,duration,P,K0,Kf,loss,v1,v2,J1,J2,cm,at,force};}
const api={build,VERSION:'2026.11.01-M1'};if(typeof module!=='undefined')module.exports=api;else root.MomentumModel=api;
})(typeof window==='undefined'?globalThis:window);
