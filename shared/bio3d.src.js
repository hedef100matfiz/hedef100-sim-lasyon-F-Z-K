import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const colors={A:0x80e5ae,T:0xf5cf79,G:0xed91bf,C:0x78c9ef};
class BioScene{
 constructor(canvas,id){
 this.id=id;this.original=canvas.parentElement;this.host=document.createElement('div');this.host.className='bio3d-host';
 this.host.innerHTML='<div class="bio3d-toolbar"><strong>ETKİLEŞİMLİ 3B</strong><button data-camera="front">Önden</button><button data-camera="perspective">Perspektif</button><button data-camera="top">Üstten</button><button class="bio-toggle" aria-pressed="false">2B şema</button></div><div class="bio3d-stage"></div><p class="bio3d-note"></p><label class="bio3d-select">Yapıyı incele <select aria-label="3B yapı seçimi"></select></label><p class="bio3d-info" role="status">Bir yapıyı seçerek açıklamasını okuyun.</p><small>Sürükle: döndür · Tekerlek / iki parmak: yakınlaştır. Renkler ve ölçek temsilidir.</small>';
 this.renderer=new T.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setClearColor(0x0a1626);
 this.original.before(this.host);this.original.hidden=true;this.stage=this.host.querySelector('.bio3d-stage');this.stage.append(this.renderer.domElement);
 this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(40,1,.1,100);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enablePan=false;this.controls.minDistance=5;this.controls.maxDistance=25;this.scene.add(new T.HemisphereLight(0xc3ebff,0x33415a,2.5));let light=new T.DirectionalLight(0xffffff,3);light.position.set(3,5,6);this.scene.add(light);this.group=new T.Group();this.scene.add(this.group);this.pick=[];
 this.controls.addEventListener('change',()=>this.paint());this.host.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>this.view(b.dataset.camera));
 this.host.querySelector('.bio-toggle').onclick=e=>{this.flat=!this.flat;this.original.hidden=!this.flat;this.stage.hidden=!!this.flat;e.target.setAttribute('aria-pressed',String(!!this.flat));e.target.textContent=this.flat?'3B görünüme dön':'2B şema';if(!this.flat)this.resize();};
 this.selector=this.host.querySelector('select');this.selector.onchange=()=>this.select(+this.selector.value);
 const ray=new T.Raycaster();let down;this.renderer.domElement.onpointerdown=e=>{down=[e.clientX,e.clientY]};this.renderer.domElement.onpointerup=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;let r=this.renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),this.camera);let hits=ray.intersectObjects(this.pick,false);if(hits.length)this.select(this.pick.indexOf(hits[0].object));};
 new ResizeObserver(()=>this.resize()).observe(this.stage);this.view('perspective');
 }
 paint(){if(!this.flat)this.renderer.render(this.scene,this.camera)}
 resize(){let w=this.stage.clientWidth,h=this.stage.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(w<h&&this.camera.position.length()<17)this.camera.position.setLength(17);this.paint()}
 view(v){this.controls.target.set(0,0,0);this.camera.position.set(...(v==='front'?[0,0,13]:v==='top'?[0,13,.01]:[2,1.5,13]));this.controls.update();this.resize()}
 select(i){const o=this.pick[i];if(!o)return;this.selector.value=String(i);this.host.querySelector('.bio3d-info').textContent=o.userData.info;this.paint()}
 ball(pos,color,info,r=.14){const o=new T.Mesh(new T.SphereGeometry(r,20,14),new T.MeshStandardMaterial({color,roughness:.28}));o.position.set(...pos);this.group.add(o);if(info){o.userData.info=info;this.pick.push(o)}return o}
 rod(a,b,color,r=.035){let av=new T.Vector3(...a),bv=new T.Vector3(...b),dir=bv.clone().sub(av);const o=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),10),new T.MeshStandardMaterial({color}));o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());this.group.add(o);return o}
 text(s,x,y,color='#d9edf7'){let c=document.createElement('canvas');c.width=512;c.height=64;let cx=c.getContext('2d');cx.font='bold 30px system-ui';cx.textAlign='center';cx.fillStyle=color;cx.fillText(s,256,43);let o=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:false}));o.scale.set(3.6,.45,1);o.position.set(x,y,.8);this.group.add(o)}
 update(p,r){let key=JSON.stringify(p);if(key===this.key)return;this.key=key;this.group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose()}});this.group.clear();this.pick=[];
 if(this.id==='dna')this.dna(p,r.data);else this.division(p,r.data);
 this.selector.replaceChildren(...this.pick.map((o,i)=>{let e=document.createElement('option');e.value=i;e.textContent=o.userData.info.split(' — ')[0];return e}));this.select(0);if(this.id==='hucre-bolunmesi'){this.camera.position.setLength(r.data.cells===1?7:13);this.resize()}this.renderer.domElement.setAttribute('aria-label',this.host.querySelector('.bio3d-note').textContent);this.renderer.domElement.setAttribute('role','img');this.paint();
 }
 dna(p,d){let n=+p.stage,old=[[],[]],fresh=[[],[]];for(let i=0;i<8;i++){let a=i*.65,y=(i-3.5)*.6,x=Math.cos(a)*.65,z=Math.sin(a)*.65,split=i<n;let pos=[[x-(split?2.1:0),y,z],[-x+(split?2.1:0),y,-z]];let bases=[d.seq[i],d.complement[i]];
 for(let j=0;j<2;j++){old[j].push(pos[j]);this.ball(pos[j],colors[bases[j]],`${i+1}. çift · ${bases[j]} · eski zincir — ${bases[j]} bazı ${j?bases[0]:bases[1]} ile eşleşir.`);}
 if(split){let np=[[-2.1-x,y,-z],[2.1+x,y,z]];for(let j=0;j<2;j++){fresh[j].push(np[j]);this.ball(np[j],colors[bases[1-j]],`${i+1}. çift · ${bases[1-j]} · yeni zincir — Eski zincir kalıp olarak kullanılır.`);this.rod(pos[j],np[j],0x879dad,.022)}}else this.rod(pos[0],pos[1],0x879dad,.022);
 }
 for(let j=0;j<2;j++){for(let i=1;i<old[j].length;i++)this.rod(old[j][i-1],old[j][i],j?0x9995ed:0x6ccbd7,.055);for(let i=1;i<fresh[j].length;i++)this.rod(fresh[j][i-1],fresh[j][i],0xf6cc78,.055)}
 this.text(n===8?'Eski + yeni':n?'1. yavru DNA':'Başlangıç DNA’sı',n? -2.1:0,2.9);if(n)this.text(n===8?'Yeni + eski':'2. yavru DNA',2.1,2.9);
 this.host.querySelector('.bio3d-note').textContent=`${n}/8 baz çifti eşlendi. A: yeşil · T: sarı · G: pembe · C: mavi. Eski omurgalar turkuaz/mor; yeni omurgalar altın renkli. ${n===8?'Her DNA bir eski ve bir yeni zincir içerir.':'Sürgüyü ilerleterek iki DNA oluşumunu izle.'} Enzimler ve gerçek eşlenme geometrisi modellenmez.`;
 }
 division(p,d){let n=d.cells,coords=n===1?[[0,0]]:n===2?[[-2.3,0],[2.3,0]]:[[-2.3,1.8],[2.3,1.8],[-2.3,-1.8],[2.3,-1.8]];
 coords.forEach(([cx,cy],c)=>{let shell=this.ball([cx,cy,-.15],0x7bd7e3,null,1.5);shell.scale.set(1.25,1,.6);shell.material.transparent=true;shell.material.opacity=.09;shell.material.depthWrite=false;
 let cols=Math.min(4,d.chrom),rows=Math.ceil(d.chrom/cols);for(let j=0;j<d.chrom;j++){let x=cx+(j%cols-(cols-1)/2)*.65,y=cy+(Math.floor(j/cols)-(rows-1)/2)*.65;let hap=+p.type&&+p.stage>=2,color=(hap?(Math.floor(c/(+p.stage===3?2:1))+j)%2:j%2)?0xf0a4c5:0x80c9ed;let len=.32-(hap?j:Math.floor(j/2))*.025;
 let rod=this.rod([x-.12,y-len,0],[x+.12,y+len,0],color,.065);rod.userData.info=`Hücre ${c+1} · kromozom ${j+1} — ${d.duplicated?'İki kardeş kromatit; birlikte bir kromozom.':'Tek kromatitli bir kromozom.'}`;this.pick.push(rod);if(d.duplicated){let other=this.rod([x+.12,y-len,0],[x-.12,y+len,0],color,.065);other.userData.info=rod.userData.info;this.pick.push(other)}this.ball([x,y,.03],0xfff0c8,null,.08)}this.text(`${haploid(p)?'n':'2n'} = ${d.chrom}`,cx,cy-1.48);
 });
 let names=+p.type?['Başlangıç: diploit hücre','DNA eşlendi: kromozom sayısı aynı','Mayoz I: homologlar ayrıldı','Mayoz II: kardeş kromatitler ayrıldı']:['Başlangıç: diploit hücre','DNA eşlendi: kromozom sayısı aynı','Mitoz ve sitoplazma bölünmesi tamamlandı','Sonuç: iki hücre'];
 this.host.querySelector('.bio3d-note').textContent=`${names[p.stage]}. ${n} hücre; hücre başına ${d.chrom} kromozom. Renkler homolog kökenini ayırt eder. Bunlar özet basamaklardır; bütün bölünme evrelerinin animasyonu değildir. Parça değişimi ve hatalı ayrılma modellenmez.`;
 }
}
function haploid(p){return +p.type&&+p.stage>=2}
const old=window.LabScenes.draw,instances=new WeakMap(),failed=new WeakSet();window.LabScenes.draw=function(canvas,id,p,r,t,view){old.call(this,canvas,id,p,r,t,view);if(!['dna','hucre-bolunmesi'].includes(id)||failed.has(canvas))return;try{let s=instances.get(canvas);if(!s){s=new BioScene(canvas,id);instances.set(canvas,s)}s.update(p,r);canvas.dataset.renderer='3d'}catch(e){failed.add(canvas);canvas.parentElement.hidden=false;let host=canvas.parentElement.previousElementSibling;if(host?.classList.contains('bio3d-host'))host.remove();let msg=document.createElement('p');msg.textContent='3B görünüm bu cihazda açılamadı. Etkileşimli 2B şema kullanılabilir.';canvas.parentElement.before(msg);console.warn('3B fallback',e.message)}};
