/* Presentation only: model.js owns motion, forces and energy. */
(function(root){'use strict';
const C={gold:'#f4c768',blue:'#77b5f6',green:'#5ee0ad',purple:'#c9a2f6',orange:'#f6a05c',ink:'#0b1421',text:'#dce7f4'};
const num=(v,n=2)=>v.toLocaleString('tr-TR',{maximumFractionDigits:n,minimumFractionDigits:n});
function geometry(r,s,width=1000){const p=r.p,mode=p.scenario,st=mode==='static',double=mode==='double',spring=mode==='spring',sin=st?Math.sin(p.angle*Math.PI/180):.5,cos=st?Math.cos(p.angle*Math.PI/180):Math.sqrt(3)/2,maxH=double?r.E0/(p.mass*p.g):p.height,rightL=double?maxH/.5:0,compression=spring?Math.sqrt(2*r.E0/p.k):0;
 const worldWidth=r.ramp*cos+(st||mode==='ideal'?0:p.length)+(double?rightL*cos:0)+(spring?compression+1.3:0),scale=Math.min((width-160)/Math.max(worldWidth,1),235/Math.max(maxH,1)),start=80+(width-160-worldWidth*scale)/2,base=335,xRamp=start+r.ramp*cos*scale,xEnd=xRamp+(st?0:p.length*scale);
 let x,rotation=0;if(st||mode==='ideal'||s.q<r.ramp){x=start+s.q*cos*scale;rotation=st?p.angle*Math.PI/180:Math.PI/6;}else if(double&&s.q>r.end){x=xEnd+(s.q-r.end)*cos*scale;rotation=-Math.PI/6;}else x=xRamp+(s.q-r.ramp)*scale;
 return {width,scale,start,base,xRamp,xEnd,x,y:base-s.h*scale,rotation,sin,cos,maxH,rightL,compression,st,double,spring};}
function draw(canvas,r,s,view={}){
 const mobile=canvas.getBoundingClientRect().width<520,W=mobile?620:1000,H=460,dpr=Math.min(root.devicePixelRatio||1,2);if(canvas.width!==W*dpr||canvas.height!==H*dpr){canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.aspectRatio=W+'/'+H;}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const z=geometry(r,s,W),p=r.p;
 const line=(x,y,X,Y,col,w=2,dash=[])=>{c.save();c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash);c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();c.restore();};
 const poly=(points,fill,stroke)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}};
 const txt=(text,x,y,col=C.text,size=17,align='left')=>{c.font=`500 ${size}px Inter,sans-serif`;c.textAlign=align;c.fillStyle=col;c.fillText(text,x,y);};
 const arrow=(x,y,X,Y,col,w=3)=>{if(Math.hypot(X-x,Y-y)<.1)return;line(x,y,X,Y,col,w);const a=Math.atan2(Y-y,X-x);line(X,Y,X-10*Math.cos(a-.42),Y-10*Math.sin(a-.42),col,w);line(X,Y,X-10*Math.cos(a+.42),Y-10*Math.sin(a+.42),col,w);};
 c.clearRect(0,0,W,H);const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#101f32');bg.addColorStop(1,'#08111d');c.fillStyle=bg;c.fillRect(0,0,W,H);
 for(let x=20;x<W;x+=40)line(x,50,x,370,'#b9d5f407',1);for(let y=70;y<370;y+=40)line(20,y,W-20,y,'#b9d5f407',1);
 const floor=c.createLinearGradient(0,345,0,390);floor.addColorStop(0,'#1d2a3d');floor.addColorStop(1,'#101b2b');poly([[32,355],[W-32,355],[W-10,381],[10,381]],floor);line(10,381,W-10,381,'#33445b',2);
 function rail(x,y,X,Y,rough){const length=Math.hypot(X-x,Y-y);if(length<.1)return;const a=Math.atan2(Y-y,X-x),nx=-Math.sin(a),ny=Math.cos(a),col=rough?C.orange:C.blue;
 const shade=c.createLinearGradient(0,y,0,Math.max(y,Y)+16);shade.addColorStop(0,rough?'#68472c':'#344b65');shade.addColorStop(1,'#172436');poly([[x,y],[X,Y],[X+nx*13,Y+ny*13],[x+nx*13,y+ny*13]],shade,'#506174');
 for(const f of [.08,.5,.92]){const px=x+(X-x)*f,py=y+(Y-y)*f+12;if(py<347){line(px,py,px,351,'#31455d',7);line(px-7,351,px+7,351,'#546981',3);}}
 line(x,y,X,Y,col,3);line(x+nx*13,y+ny*13,X+nx*13,Y+ny*13,'#0a101b',2);
 if(rough)for(let k=6;k<length;k+=10){const px=x+(X-x)*k/length,py=y+(Y-y)*k/length;line(px,py+2,px+nx*6+3*Math.cos(a),py+ny*6+3*Math.sin(a),'#f2bd7f8a',1);}
 }
 rail(z.start,z.base-p.height*z.scale,z.xRamp,z.base,z.st&&p.mu>0);
 if(!z.st&&p.scenario!=='ideal')rail(z.xRamp,z.base,z.xEnd,z.base,p.mu>0);
 if(z.double)rail(z.xEnd,z.base,z.xEnd+z.rightL*z.cos*z.scale,z.base-z.maxH*z.scale,false);
 // The orange trace is cumulative converted energy, never a temperature scale.
 if(s.thermal>1e-8&&!view.reduce){const candidates=r.samples.filter(q=>q.t<=s.t+1e-9),maxQ=Math.max(0,...candidates.map(q=>q.q));const f=Math.min(1,s.thermal/Math.max(r.E0,1));c.save();c.shadowColor=C.orange;c.shadowBlur=8+10*f;c.globalAlpha=.3+.5*f;
 if(z.st)line(z.start,z.base-p.height*z.scale,z.start+Math.min(maxQ,r.ramp)*z.cos*z.scale,z.base-(p.height-Math.min(maxQ,r.ramp)*z.sin)*z.scale,C.orange,6);
 else line(z.xRamp,z.base,z.xRamp+Math.min(p.length,Math.max(0,maxQ-r.ramp))*z.scale,z.base,C.orange,6);c.restore();}
 if(z.spring){const wall=z.xEnd+(z.compression+1.3)*z.scale,left=Math.max(z.xEnd,z.x),cy=z.base-19;line(z.xEnd,z.base,wall,z.base,'#506078',3);poly([[wall,cy-27],[wall+12,cy-22],[wall+12,z.base+10],[wall,z.base+6]],'#697b91');let X=left,Y=cy;for(let n=1;n<=28;n++){const xx=left+(wall-left)*n/28,yy=cy+(n===28?0:n%2?11:-11);line(X,Y,xx,yy,C.purple,3);X=xx;Y=yy;}if(s.Uy>1e-8){line(z.xEnd,z.base+30,z.x,z.base+30,C.purple,2);txt('x = '+num(Math.max(0,s.q-r.end))+' m',Math.min(W-175,z.xEnd),z.base+58,C.purple,15);}}
 if(z.double){const y0=z.base-p.height*z.scale;line(z.start,y0,W-55,y0,'#9aabc05c',1,[5,6]);txt('h₀',45,y0+5,'#9aabc0',16);if(r.firstPeak!==null){const X=z.xEnd+r.firstPeak/.5*z.cos*z.scale,Y=z.base-r.firstPeak*z.scale,observed=s.t>=r.peakTime-1e-8;c.beginPath();c.arc(X,Y,8,0,Math.PI*2);c.fillStyle=observed?C.purple:'#142238';c.strokeStyle=C.purple;c.lineWidth=2;c.fill();c.stroke();}}
 // Height dimension follows the contact point; the model particle has no finite-size collision geometry.
 if(s.h>.01){const mx=Math.max(30,z.x-44);line(mx,z.y,mx,z.base,C.blue,1,[3,4]);line(mx-5,z.y,mx+5,z.y,C.blue,2);line(mx-5,z.base,mx+5,z.base,C.blue,2);}
 c.save();c.translate(z.x,z.y);c.rotate(z.rotation);c.fillStyle='#00000060';c.beginPath();c.ellipse(1,3,29,5,0,0,2*Math.PI);c.fill();const metal=c.createLinearGradient(-22,-37,22,0);metal.addColorStop(0,'#e4e9ee');metal.addColorStop(.35,'#8c9fb2');metal.addColorStop(1,'#40546d');poly([[-23,-35],[20,-35],[23,-3],[-23,-3]],metal,'#e8effa');poly([[-23,-35],[-16,-42],[27,-42],[20,-35]],'#c8d4de');poly([[20,-35],[27,-42],[30,-10],[23,-3]],'#566b82');line(-22,-4,23,-4,C.gold,3);for(const x of [-16,14]){c.beginPath();c.arc(x,-24,2,0,2*Math.PI);c.fillStyle='#314257';c.fill();}c.restore();
 if(Math.abs(s.v)>1e-7){const length=Math.min(120,Math.abs(s.v)*6),sign=Math.sign(s.v),vx=Math.cos(z.rotation)*sign,vy=Math.sin(z.rotation)*sign;arrow(z.x,z.y-54,z.x+vx*length,z.y-54+vy*length,C.green,3);}
 if(z.st&&view.forces){const px=z.x,py=z.y-20,k=48/(p.mass*p.g);arrow(px,py,px,py+p.mass*p.g*k,C.blue);arrow(px,py,px+s.N*z.sin*k,py-s.N*z.cos*k,C.green);arrow(px,py,px-s.friction*z.cos*k,py-s.friction*z.sin*k,C.orange);}
 // A true length bar, shown without screen-pixel units; block size is symbolic.
 const unit=100/z.scale;line(55,424,155,424,'#94a3b8',2);line(55,419,55,429,'#94a3b8',2);line(155,419,155,429,'#94a3b8',2);txt(num(unit)+' m',175,430,'#a8b9cf',16);
 txt(z.st?p.angle+'° eğim':'30° eğim',W-55,430,'#a8b9cf',16,'right');
 canvas.setAttribute('aria-label',`${s.phase}. Yükseklik ${num(s.h)} metre, hız ${num(s.v)} metre/saniye, termal enerji artışı ${num(s.thermal)} joule.`);
 canvas.visualGeometry=z;
}
function forceSVG(s,p){const angle=p.angle*Math.PI/180,scale=62/(p.mass*p.g),x=175,y=95;
 const vectors=[['mg',0,p.mass*p.g*scale,C.blue],['N',s.N*Math.sin(angle)*scale,-s.N*Math.cos(angle)*scale,C.green],[s.moving?'Fk':'Fs',-s.friction*Math.cos(angle)*scale,-s.friction*Math.sin(angle)*scale,C.orange]];
 const paths=vectors.filter(v=>Math.hypot(v[1],v[2])>.1).map(([label,dx,dy,color],i)=>{const X=x+dx,Y=y+dy,a=Math.atan2(dy,dx),x1=X-8*Math.cos(a-.4),y1=Y-8*Math.sin(a-.4),x2=X-8*Math.cos(a+.4),y2=Y-8*Math.sin(a+.4);return `<path d="M${x},${y} L${X},${Y} M${x1},${y1} L${X},${Y} L${x2},${y2}" fill="none" stroke="${color}" stroke-width="3"/><text x="${X+(dx<0?-20:8)}" y="${Y+(dy>0?20:-8)}" fill="${color}" font-size="17">${label}</text>`;}).join('');
 return `<svg viewBox="0 0 350 210" role="img" aria-label="Serbest cisim diyagramı: ağırlık aşağı, normal yüzeye dik, sürtünme eğim boyunca yukarı."><circle cx="175" cy="95" r="6" fill="#e2e8f0"/>${paths}</svg>`;
}
root.EnergyVisual={draw,geometry,forceSVG};
})(window);
