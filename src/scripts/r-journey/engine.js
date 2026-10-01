// The R journey: one set of particles that travels through the page.
// States (see data-stage in the markup): 0 hero "Pixel", 1 pitch "Fragment", 2 projects "Craft",
// 3 services "Parts" (the R rebuilds into 4 icons), 4 footer "Play".
// Pipeline per frame: scroll -> state blend -> 3D targets per particle (springs) -> lighting -> draw
// (glyph dither by default, raw pixels as fallback; toggle with the dev HUD or the G key).
// Instances: every <canvas data-r-canvas> runs its own R. `scope` limits which [data-stage] elements and anchors it
// uses (home: the whole page; subpages: one R in the header, a separate one in the footer). `cull` skips all work
// while the scope is off screen.
import { R_PATH } from './r-shape.js';

// The page loader and page swaps (global/pageTransitions.js) borrow the page's R: while `rIntro.t` is 1 the engine with
// `intro` draws it as the small R on `rIntro.el` (state 5, a copy of stage 2 on its own anchor); as t goes to 0 it
// blends, with a full turn, into wherever the page has it (home: the hero, subpages: the header). Page swaps first take
// it from 0 to 1. onDraw: called once after the next frame drawn in intro (a page swap then drops its still of the old R).
// drift: how far (px, average) the intro R's particles still are from where they're heading; ~0 = at rest.
export const rIntro = { el: null, t: 0, onDraw: null, drift: 0 };
// the smoothed mouse, kept across page swaps: the next page's R starts turned exactly like the old one
const mouse = { mx: 0, my: 0, smx: 0, smy: 0 };
// page swaps: the R's static particle data is built once per size (geo) and reused by every next engine, and the intro
// R hands its particle positions over (carry), so the next page's R is ready at once and goes on mid-flight
let geo = null, carry = null;
// shared by all engines (nothing is rebuilt after a page swap): glyph sprites per cell size, the glyph grid buffers
const spriteCache = new Map(), grid = { GC: null, GS: null, GN: null, GO: null, OCC: null };

// `follow`: the small R (stage 2: projects on home, header on subpages) turns with the mouse like the hero R.
export function initREngine({ canvas = document.getElementById('r-canvas'), scope = document, cull = false, follow = true, intro = false } = {}) {
  if (!canvas || !scope) return null;
  // page swaps: every window listener goes through this signal, destroy() stops the frame loop
  const ac=new AbortController(),signal=ac.signal;let alive=true,raf=0;

  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches,motion=reduce?0:1;
  const cvs=canvas,ctx=cvs.getContext('2d');
  let W=0,H=0,DPR=1;
  // the CSS size follows innerWidth/innerHeight exactly (100vh is taller than the visible area on iOS while the toolbar shows,
  // which would stretch the drawing)
  function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cvs.width=W*DPR;cvs.height=H*DPR;cvs.style.width=W+'px';cvs.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
  addEventListener('resize',resize,{signal});resize();

  let {mx,my,smx,smy}=mouse,mpx=-9999,mpy=-9999;
  addEventListener('pointermove',e=>{mx=e.clientX/W*2-1;my=e.clientY/H*2-1;mpx=e.clientX;mpy=e.clientY},{passive:true,signal});
  // touch: a finger pushes the footer's pixels away too (pointermove stops as soon as the browser starts scrolling);
  // it doesn't turn the R, or every scroll would tilt it
  const touch=e=>{const t=e.touches[0];if(t){mpx=t.clientX;mpy=t.clientY}};
  addEventListener('touchstart',touch,{passive:true,signal});addEventListener('touchmove',touch,{passive:true,signal});
  addEventListener('touchend',()=>{mpx=mpy=-9999},{passive:true,signal});
  let hoverQ=-1;
  scope.querySelectorAll('[data-service]').forEach(r=>{const q=+r.dataset.service;
    r.addEventListener('mouseenter',()=>hoverQ=q);r.addEventListener('mouseleave',()=>hoverQ=-1);
    r.addEventListener('focus',()=>hoverQ=q);r.addEventListener('blur',()=>hoverQ=-1)});

  // stages include the scope itself when it is a stage (e.g. the footer)
  const stages=[...(scope.matches?.('[data-stage]')?[scope]:[]),...scope.querySelectorAll('[data-stage]')],SV=stages.map(e=>+e.dataset.stage);
  if(!stages.length)return null;
  // A scope may have only one anchor (header: #a-craft, footer: #a-foot): every missing anchor falls back to it.
  const find=(id)=>scope.querySelector?.('#'+id)||null;
  const main=find('a-craft')||find('a-foot')||find('a-hero');if(!main)return null;
  const byId=(id)=>find(id)||main;
  const aHero=byId('a-hero'),aPitch=byId('a-pitch'),aCraft=byId('a-craft'),aFoot=byId('a-foot');
  const slots=[...scope.querySelectorAll('[data-service-slot]')],svcSlots=slots.length===4?slots:[main,main,main,main];
  const NAMES=['Pixel','Fragment','Craft','Parts','Play'];
  const hudName=cull?null:scope.querySelector('#hud-name'),hudBar=cull?null:scope.querySelector('#hud-bar');
  function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;

  // particles: [0,NC) = front/back cap cells, [NC,N) = side-wall cells
  let BR,N=0,NC=0,GH=0,U,V,DZ,NX,NY,EDGE,BY,CH,QD,K,X,Y,OR,IU,IV,IZ,INX,INY,IE,LV;
  let CU,CV,CC,CS,OX,OY,OZ,QU,QV,ICON_G=44,inited=false;
  const DEPTH=.075; // half thickness, in glyph heights

  async function build(){
    const gh=innerWidth<760?84:112;
    if(geo&&geo.GH===gh){({GH,N,NC,U,V,DZ,NX,NY,EDGE,BY,CH,QD,K,K2,IU,IV,IZ,INX,INY,IE,CU,CV,CC,CS,OX,OY,OZ,QU,QV,ICON_G}=geo);return ready()}
    GH=gh;const GW=Math.round(GH*103/99);
    const oc=document.createElement('canvas');oc.width=GW;oc.height=GH;const o=oc.getContext('2d');
    const sc=Math.min(GW*.96/103,GH*.96/99);
    o.setTransform(sc,0,0,sc,(GW-103*sc)/2,(GH-99*sc)/2);o.fillStyle='#fff';o.fill(new Path2D(R_PATH));
    const d=o.getImageData(0,0,GW,GH).data;
    const inside=(x,y)=>x>=0&&y>=0&&x<GW&&y<GH&&d[(y*GW+x)*4+3]>110;
    const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    const caps=[],bnd=[];
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
      if(!inside(x,y))continue;
      let nx=0,ny=0,out=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if((dx||dy)&&!inside(x+dx,y+dy)){nx+=dx;ny+=dy;out++}}
      const edge=!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1);
      caps.push([x,y,edge?1:0]);
      if(out){const l=Math.hypot(nx,ny)||1;bnd.push([x,y,nx/l,ny/l])}
    }
    const LAY=innerWidth<760?7:10;
    NC=caps.length;N=NC+bnd.length*LAY;
    U=new Float32Array(N);V=new Float32Array(N);DZ=new Float32Array(N);NX=new Float32Array(N);NY=new Float32Array(N);
    EDGE=new Uint8Array(N);BY=new Float32Array(N);CH=new Uint8Array(N);QD=new Uint8Array(N);K=new Float32Array(N);
    X=new Float32Array(N);Y=new Float32Array(N);OR=new Uint8Array(N);IU=new Float32Array(N);IV=new Float32Array(N);LV=new Uint8Array(N);BR=new Float32Array(N);
    let p=0;
    for(const c of caps){U[p]=(c[0]+.5-GW/2)/GH;V[p]=(c[1]+.5-GH/2)/GH;DZ[p]=2;EDGE[p]=c[2];BY[p]=(bayer[(c[1]%4)*4+c[0]%4]+.5)/16-.5;p++}
    for(const b of bnd)for(let l=0;l<LAY;l++){U[p]=(b[0]+.5-GW/2)/GH;V[p]=(b[1]+.5-GH/2)/GH;DZ[p]=-1+2*(l+.5)/LAY;NX[p]=b[2];NY[p]=b[3];BY[p]=(bayer[(l%4)*4+b[0]%4]+.5)/16-.5;p++}

    const r=rng(7),KN=9,seeds=[Math.floor(r()*NC)];
    while(seeds.length<KN){let best=0,bd=-1;for(let t=0;t<400;t++){const q=Math.floor(r()*NC);let md=1e9;for(const s of seeds){const dd=(U[q]-U[s])**2+(V[q]-V[s])**2;if(dd<md)md=dd}if(md>bd){bd=md;best=q}}seeds.push(best)}
    const QS=[[-.22,-.2],[.2,-.22],[-.2,.24],[.22,.22]];
    CU=new Float32Array(KN);CV=new Float32Array(KN);const cn=new Float32Array(KN);QU=new Float32Array(4);QV=new Float32Array(4);
    for(let i=0;i<N;i++){
      let bk=0,bd=1e9;for(let k=0;k<KN;k++){const s=seeds[k];const dd=(U[i]-U[s])**2+(V[i]-V[s])**2;if(dd<bd){bd=dd;bk=k}}CH[i]=bk;if(i<NC){CU[bk]+=U[i];CV[bk]+=V[i];cn[bk]++}
      let bq=0,bqd=1e9;for(let q=0;q<4;q++){const dd=(U[i]-QS[q][0])**2+(V[i]-QS[q][1])**2;if(dd<bqd){bqd=dd;bq=q}}QD[i]=bq;
    }
    for(let k=0;k<KN;k++){CU[k]/=cn[k]||1;CV[k]/=cn[k]||1}
    CC=new Float32Array(KN);CS=new Float32Array(KN);OX=new Float32Array(KN);OY=new Float32Array(KN);OZ=new Float32Array(KN);
    for(let k=0;k<KN;k++){const a=(r()-.5)*1.3;CC[k]=Math.cos(a);CS[k]=Math.sin(a);OX[k]=(r()-.5)*.28;OY[k]=(r()-.5)*.28;OZ[k]=(r()-.5)*.5}

    // service icons: bold, simple shapes that get extruded like the R. Drawn in a 30-unit box, rasterised at IG px
    // (60: twice the detail, which the particle count per quarter can fill)
    const IG=60;
    const P=(g,pts)=>{g.beginPath();g.moveTo(pts[0],pts[1]);for(let k=2;k<pts.length;k+=2)g.lineTo(pts[k],pts[k+1]);g.closePath();g.fill()};
    const CUT=(g,fn)=>{g.globalCompositeOperation='destination-out';fn();g.globalCompositeOperation='source-over'};
    const drawIcon=[
      // Websites: a pointed gothic window
      g=>{g.beginPath();g.moveTo(5,28);g.lineTo(5,13);g.quadraticCurveTo(5,4,15,1);g.quadraticCurveTo(25,4,25,13);g.lineTo(25,28);g.closePath();g.fill();
        CUT(g,()=>{g.beginPath();g.moveTo(9.5,24);g.lineTo(9.5,14);g.quadraticCurveTo(10,8,15,6);g.quadraticCurveTo(20,8,20.5,14);g.lineTo(20.5,24);g.closePath();g.fill()});g.fillRect(13.5,12,3,13)},
      // Custom software: a lozenge split in two, the halves built to fit
      g=>{P(g,[13,3,13,27,2,15]);P(g,[17,1,28,13,17,25])},
      // AI workflows: one bold star with a spark
      g=>{g.beginPath();g.moveTo(12,3);g.quadraticCurveTo(13,16,23,17);g.quadraticCurveTo(13,18,12,29);g.quadraticCurveTo(11,18,1,17);g.quadraticCurveTo(11,16,12,3);g.fill();P(g,[24,2,26.5,6.5,24,11,21.5,6.5])},
      // Branding: a shield with a chevron cut out
      g=>{g.beginPath();g.moveTo(4,3);g.lineTo(26,3);g.lineTo(26,13);g.quadraticCurveTo(26,23,15,29);g.quadraticCurveTo(4,23,4,13);g.closePath();g.fill();
        CUT(g,()=>P(g,[8,19,15,11,22,19,22,23,15,15.5,8,23]))}
    ];
    const icons=drawIcon.map(fn=>{const c=document.createElement('canvas');c.width=c.height=IG;const g=c.getContext('2d');g.scale(IG/30,IG/30);g.fillStyle='#fff';fn(g);
      const id=g.getImageData(0,0,IG,IG).data,ins=(x,y)=>x>=0&&y>=0&&x<IG&&y<IG&&id[(y*IG+x)*4+3]>120,cap=[],bd=[];
      for(let y=0;y<IG;y++)for(let x=0;x<IG;x++){if(!ins(x,y))continue;const u=(x+.5)/IG-.5,v=(y+.5)/IG-.5;
        let nx=0,ny=0,o=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&!ins(x+dx,y+dy)){nx+=dx;ny+=dy;o++}
        const e=!ins(x-1,y)||!ins(x+1,y)||!ins(x,y-1)||!ins(x,y+1);cap.push([u,v,e?1:0]);if(o){const l=Math.hypot(nx,ny)||1;bd.push([u,v,nx/l,ny/l])}}
      return{cap,bd}});
    ICON_G=IG;const ILAY=6;
    IU=new Float32Array(N);IV=new Float32Array(N);IZ=new Float32Array(N);INX=new Float32Array(N);INY=new Float32Array(N);IE=new Uint8Array(N);
    for(let q=0;q<4;q++){
      const caps=[],sides=[];for(let k=0;k<N;k++)if(QD[k]===q)(k<NC?caps:sides).push(k);
      const srt=(a,b)=>(V[a]-V[b])||(U[a]-U[b]);caps.sort(srt);sides.sort(srt);
      const ic=icons[q],cl=ic.cap.slice().sort((a,b)=>(a[1]-b[1])||(a[0]-b[0]));
      caps.forEach((k,j)=>{const c=cl[Math.floor(j*cl.length/caps.length)];IU[k]=c[0];IV[k]=c[1];IZ[k]=2;IE[k]=c[2]});
      const slots=ic.bd.length*ILAY;
      sides.forEach((k,j)=>{const sl=Math.floor(j*slots/sides.length),b=ic.bd[sl%ic.bd.length],l=Math.floor(sl/ic.bd.length);IU[k]=b[0];IV[k]=b[1];IZ[k]=-1+2*(l+.5)/ILAY;INX[k]=b[2];INY[k]=b[3]});
    }
    for(let i=0;i<N;i++)K[i]=motion?(.055+r()*.09+CH[i]*.004):1;
    K2=new Float32Array(N);for(let i=0;i<N;i++)K2[i]=1-(1-K[i])**2; // the same spring over two frames (half-rate mode)
    geo={GH,N,NC,U,V,DZ,NX,NY,EDGE,BY,CH,QD,K,K2,IU,IV,IZ,INX,INY,IE,CU,CV,CC,CS,OX,OY,OZ,QU,QV,ICON_G};
    ready();
  }
  // per-engine particle state; the intro R takes over the previous page's positions during a page swap
  function ready(){
    X=new Float32Array(N);Y=new Float32Array(N);OR=new Uint8Array(N);LV=new Uint8Array(N);BR=new Float32Array(N);
    if(intro){if(carry&&carry.N===N&&rIntro.t>0){X.set(carry.X);Y.set(carry.Y)}carry=null}
    inited=true;
  }

  const A=[{},{},{},{},{},{}],Q=[{},{},{},{}];
  function rect(el,o){const r=el.getBoundingClientRect();o.cx=r.left+r.width/2;o.cy=r.top+r.height/2;o.w=r.width;o.h=r.height;return o}
  function computeS(){
    const vc=H/2,cs=stages.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2});
    if(vc<=cs[0])return SV[0];
    for(let i=0;i<cs.length-1;i++){if(vc<=cs[i+1]){const f=cs[i+1]-cs[i]<1?1:(vc-cs[i])/(cs[i+1]-cs[i]);return SV[i]+(SV[i+1]-SV[i])*clamp((f-.18)/.64,0,1)}}
    return SV[cs.length-1];
  }
  // rotation matrices: Rz * Rx * Ry
  function mat(ry,rx,rz,m){
    const a=Math.cos(ry),b=Math.sin(ry),c=Math.cos(rx),e=Math.sin(rx),g=Math.cos(rz),h=Math.sin(rz);
    // Ry then Rx
    const r00=a,r01=0,r02=b, r10=e*b,r11=c,r12=-e*a, r20=-c*b,r21=e,r22=c*a;
    m[0]=g*r00-h*r10;m[1]=g*r01-h*r11;m[2]=g*r02-h*r12;
    m[3]=h*r00+g*r10;m[4]=h*r01+g*r11;m[5]=h*r02+g*r12;
    m[6]=r20;m[7]=r21;m[8]=r22;return m;
  }
  const MQ=[0,1,2,3].map(()=>new Float32Array(9)),SQ=new Float32Array(4),QA=new Float32Array(4);let lastT=0;
  const RY=new Float32Array(6),RX=new Float32Array(6),RZ=new Float32Array(6),M=[0,1,2,3,4,5].map(()=>new Float32Array(9)),MB=new Float32Array(9),SG=new Float32Array(6);
  let spin=0,time=0;const TAU=Math.PI*2;
  function proj(i,a,lx,ly,lz,o){
    const m=M[i],x=m[0]*lx+m[1]*ly+m[2]*lz,y=m[3]*lx+m[4]*ly+m[5]*lz,z=m[6]*lx+m[7]*ly+m[8]*lz,k=1/(1-z*.55);
    o[0]=a.cx+x*k*a.S;o[1]=a.cy+y*k*a.S;
  }
  function target(i,p,o){
    const u=U[p],v=V[p],z=(DZ[p]===2?SG[i]:DZ[p])*DEPTH;
    if(i===0)proj(0,A[0],u,v,z,o);
    else if(i===1){const k=CH[p],du=u-CU[k],dv=v-CV[k],sp=.13+.035*Math.sin(time*.9)*motion,rt=CS[k]*.1;proj(1,A[1],du-dv*rt+CU[k]*(1+sp)+OX[k]*.12,du*rt+dv+CV[k]*(1+sp)+OY[k]*.12,z+OZ[k]*.12,o)}
    else if(i===2||i===5)proj(i,A[i],u,v,z,o);
    else if(i===3){const q=QD[p],a=Q[q],box=a.h*.98*(q===hoverQ?1.1:1),m=MQ[q],lx=IU[p],ly=IV[p],lz=(IZ[p]===2?SQ[q]:IZ[p])*.1,
      x=m[0]*lx+m[1]*ly+m[2]*lz,y=m[3]*lx+m[4]*ly+m[5]*lz,z=m[6]*lx+m[7]*ly+m[8]*lz,k=1/(1-z*.6),fl=Math.sin(time*1.4+q*1.9)*a.h*.03*motion;
      o[0]=a.cx+x*k*box;o[1]=a.cy+y*k*box+fl}
    else{const a=A[4];proj(4,a,u,v,z,o);
      if(motion){let x=o[0],y=o[1];const dx=x-mpx,dy=y-mpy,dd=Math.hypot(dx,dy)||1,R=a.S*.24;if(dd<R){const pu=1-dd/R,push=pu*pu*R*.95;x+=dx/dd*push;y+=dy/dd*push}o[0]=x;o[1]=y}}
  }
  const PAL=['#2b211d','#43362f','#655750','#8f837c','#bcb2ab','#ece6e1'];
  const LX=-.35,LY=-.55,LZ=.76;
  const DENS=[.8,.82,1.12,.48,1.08,1.12];
  const t0=[0,0],t1=[0,0];let lastIdx=-1;
  // Glyph dither mode (like Unicorn's Glyph Dither): particles are binned into a screen grid and every
  // cell is drawn as a sprite glyph, empty / dim cross / bright cross, picked by brightness with ordered dithering
  let glyph=true,GC=null,GS=null,GN=null,GO=null,OCC=null,nOcc=0;
  const G_GAMMA=1.4,G_COLORS=['#6d635d','#efe9e4','#8a2c00','#ff4f00'],BAYER4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  function sprites(cell){
    const key=cell+'@'+DPR;if(spriteCache.has(key))return spriteCache.get(key);
    const px=Math.max(2,Math.round(cell*DPR)),out=G_COLORS.map(col=>{
      const c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d');
      const pad=px*.26;g.strokeStyle=col;g.lineWidth=Math.max(1,px*.27);g.lineCap=px<6?'butt':'round';
      g.beginPath();g.moveTo(pad,pad);g.lineTo(px-pad,px-pad);g.moveTo(px-pad,pad);g.lineTo(pad,px-pad);g.stroke();return c});
    spriteCache.set(key,out);return out;
  }
  const modeBtn=cull?null:scope.querySelector('#mode');
  if(modeBtn)modeBtn.onclick=()=>{glyph=!glyph;modeBtn.textContent=glyph?'Glyph':'Pixels';modeBtn.classList.toggle('is-off',!glyph)};
  addEventListener('keydown',e=>{if((e.key==='g'||e.key==='G')&&!e.shiftKey&&!e.target.closest('input,textarea'))modeBtn&&modeBtn.click()},{signal}); // Shift+G: the grid overlay

  // Slow devices: when a frame's own work stays above ~10 ms, render every other frame (springs take a double step, so
  // the R moves just as fast). Fast devices never notice.
  let culled=false,cost=0,slow=false,odd=false,K2=null;
  function frame(ts){
    if(!alive)return;
    raf=requestAnimationFrame(frame);
    if(!inited)return;
    if(slow&&(odd=!odd))return;
    const fStart=performance.now();
    if(cull){
      const r=(scope===document?document.documentElement:scope).getBoundingClientRect();
      const off=r.bottom<-200||r.top>innerHeight+200;
      if(off){if(!culled){ctx.clearRect(0,0,W,H);culled=true}return}
      culled=false;
    }
    time=ts/1000;const tm=time*motion;
    const ml=(slow?.1164:.06)*motion;smx+=(mx-smx)*ml;smy+=(my-smy)*ml;if(intro)Object.assign(mouse,{mx,my,smx,smy});
    rect(aHero,A[0]);A[0].S=Math.min(A[0].h,A[0].w*1.05)*.92;
    rect(aPitch,A[1]);A[1].S=Math.min(A[1].h*.8,A[1].w*1.15);A[1].cx-=A[1].w*.1;
    rect(aCraft,A[2]);A[2].S=A[2].h*.9;
    for(let q=0;q<4;q++)rect(svcSlots[q],Q[q]);
    rect(aFoot,A[4]);A[4].S=Math.min(A[4].h,A[4].w*1.05)*.9;
    const inIntro=intro&&rIntro.el&&rIntro.t>0;
    if(inIntro){rect(rIntro.el,A[5]);A[5].S=A[5].h*.9}

    RY[0]=(smx*1.7+Math.sin(tm*.4)*.55)*motion;RX[0]=(smy*1.1+Math.sin(tm*.29)*.3)*motion;RZ[0]=(Math.sin(tm*.23)*.3+smx*.25)*motion;
    RY[1]=(smx*.7+Math.sin(tm*.3)*.4)*motion;RX[1]=(.25+Math.sin(tm*.25)*.15)*motion;RZ[1]=-.12*motion;
    // follow: the hero's mouse turn at 45% strength (max ~60° turn), so the small R stays readable at the extremes
    if(follow){const FS=.45;RY[2]=RY[0]*FS;RX[2]=RX[0]*FS;RZ[2]=RZ[0]*FS}else{RY[2]=Math.sin(tm*.6)*.35*motion;RX[2]=0;RZ[2]=0}
    RY[3]=0;RX[3]=0;RZ[3]=0;
    RY[4]=(smx*1.3+Math.sin(tm*.35)*.3)*motion;RX[4]=(smy*.8)*motion;RZ[4]=Math.sin(tm*.2)*.12*motion;
    RY[5]=RY[2];RX[5]=RX[2];RZ[5]=RZ[2];

    const s=computeS();let i0=Math.min(Math.floor(s),4),i1=Math.min(i0+1,4),f=s-i0;f=f*f*(3-2*f);
    spin=i1!==i0?[1,-1,0,1][i0]*f*TAU*motion:0;
    // loader: from the intro R to the page's own state (rounded: the page sits at its top), with a full turn
    if(inIntro){i1=Math.round(s);i0=5;f=1-rIntro.t;spin=f*TAU*motion}
    for(let i=0;i<6;i++){mat(RY[i]+(i===3?0:spin),RX[i],RZ[i],M[i]);SG[i]=M[i][8]>=0?1:-1}
    mat((RY[i0]*(1-f)+RY[i1]*f)+spin*(i0===3||i1===3?(1-Math.abs(i1-3)*(1-f)-Math.abs(i0-3)*f):1),RX[i0]*(1-f)+RX[i1]*f,RZ[i0]*(1-f)+RZ[i1]*f,MB);

    const dt=Math.min(.05,time-lastT);lastT=time;
    for(let q=0;q<4;q++){
      if(q===hoverQ&&motion)QA[q]+=dt*3.2;else{const tgt=Math.round(QA[q]/TAU)*TAU;QA[q]+=(tgt-QA[q])*(slow?.1536:.08)}
      mat(-.55+Math.sin(tm*.7+q*1.3)*.25+QA[q],.32+Math.sin(tm*.5+q)*.1,-.06,MQ[q]);SQ[q]=MQ[q][8]>=0?1:-1;
    }
    const Qh=Q[0].h;
    const sz=i=>i===3?Qh*.98/ICON_G*DENS[3]:A[i].S/GH*DENS[i];
    const size=sz(i0)*(1-f)+sz(i1)*f,flat=Math.abs(s-3)<.5&&!(inIntro&&f<.5),nearParts=1-Math.abs(s-3)>.55,nearPlay=s>3.45,R4=A[4].S*.3;

    // lighting
    const cs=MB[8]>=0?1:-1,cnx=MB[2]*cs,cny=MB[5]*cs,cnz=MB[8]*cs;
    const capL=Math.max(0,cnx*LX+cny*LY+cnz*LZ);
    let drift=0;
    for(let p=0;p<N;p++){
      target(i0,p,t0);let tx=t0[0],ty=t0[1];
      if(f>0&&i1!==i0){target(i1,p,t1);tx+=(t1[0]-tx)*f;ty+=(t1[1]-ty)*f}
      if(X[p]===0&&Y[p]===0){X[p]=tx;Y[p]=ty}
      // flying in or out of the loader the springs are twice as stiff: the R holds together and comes to rest sooner
      let k=slow?K2[p]:K[p];if(inIntro)k=1-(1-k)*(1-k);X[p]+=(tx-X[p])*k;Y[p]+=(ty-Y[p])*k;
      if(inIntro&&!(p&15))drift+=Math.abs(tx-X[p])+Math.abs(ty-Y[p]);
      OR[p]=nearParts&&QD[p]===hoverQ?1:0;
      let b;
      if(p<NC){
        if(flat){const m=MQ[QD[p]],sg=SQ[QD[p]];b=.1+.62*Math.max(0,(m[2]*LX+m[5]*LY+m[8]*LZ)*sg)+(IE[p]?.2:0)}
        else b=.2+.8*capL+(EDGE[p]?.32:0);
      }else{
        const mm=flat?MQ[QD[p]]:MB,nx=flat?INX[p]:NX[p],ny=flat?INY[p]:NY[p],rx=mm[0]*nx+mm[1]*ny,ry=mm[3]*nx+mm[4]*ny,rz=mm[6]*nx+mm[7]*ny;
        if(rz<=.02){LV[p]=255;continue}
        b=(flat?.05:.08)+(flat?.5:.7)*Math.max(0,rx*LX+ry*LY+rz*LZ);
      }
      BR[p]=b;b+=BY[p]*.28;LV[p]=b<=0?0:b>=1?5:(b*6)|0;
    }
    if(inIntro)rIntro.drift=drift/Math.ceil(N/16);

    ctx.clearRect(0,0,W,H);
    if(glyph){
      // small shapes (service icons, the small R in the header / projects): finer cells so there is enough detail
      // (~36 glyphs tall); big R's keep the density-based size
      const rh=(i0===3?Qh:A[i0].S)*(1-f)+(i1===3?Qh:A[i1].S)*f,baseCell=size<1.1?3:clamp(Math.round(size*1.35),4,7);
      const iconW=(i0===3?1-f:0)+(i1===3?f:0); // how much of this frame is the icons state
      const small=clamp((140-rh)/60,0,1)*(1-iconW); // white boost for the small R only; icons keep their 3D shading
      const minCell=3/DPR; // glyphs of at least 3 device px (1.5 css px on retina): smaller and the crosses blur to grey
      const CELL=rh<140?Math.min(baseCell,Math.max(minCell,Math.round(rh/36*2)/2)):baseCell,cols=Math.ceil(W/CELL)+1,rows=Math.ceil(H/CELL)+1,NN=cols*rows;
      if(!grid.GC||grid.GC.length<NN)Object.assign(grid,{GC:new Float32Array(NN),GS:new Float32Array(NN),GN:new Uint16Array(NN),GO:new Uint8Array(NN),OCC:new Uint32Array(NN)});
      ({GC,GS,GN,GO,OCC}=grid);nOcc=0;
      GC.fill(0,0,NN);GS.fill(0,0,NN);GN.fill(0,0,NN);GO.fill(0,0,NN);
      const sp=(sz(i0)/DENS[i0])*(1-f)+(sz(i1)/DENS[i1])*f,expect=Math.max(1,(CELL/Math.max(sp,.3))**2*.45),hc=size/2;
      for(let p=0;p<N;p++){
        if(LV[p]===255)continue;const x=X[p]+hc,y=Y[p]+hc;if(x<0||y<0||x>=W||y>=H)continue;
        const ci=((y/CELL)|0)*cols+((x/CELL)|0),b=BR[p];
        if(p<NC){if(b>GC[ci])GC[ci]=b}else if(b>GS[ci])GS[ci]=b;
        if(GN[ci]===0)OCC[nOcc++]=ci;if(GN[ci]<65000)GN[ci]++;if(OR[p])GO[ci]=1;
      }
      const spr=sprites(CELL);
      for(let o=0;o<nOcc;o++){
        const ci=OCC[o],n=GN[ci],r=(ci/cols)|0,q=ci-r*cols;
        const base=GC[ci]>0?GC[ci]:GS[ci];let v=Math.pow(clamp(base*Math.min(1,.35+.65*n/expect),0,1),1/G_GAMMA);
        if(small>0)v+=(1-v)*.75*small; // small R: mostly bright crosses, so it reads white instead of grey
        const lv=clamp(Math.round(v*2+((BAYER4[(r&3)*4+(q&3)]+.5)/16-.5)*.9),0,2);if(!lv)continue;
        ctx.drawImage(spr[(GO[ci]?2:0)+lv-1],q*CELL,r*CELL,CELL,CELL);
      }
    }else{

    const c=Math.max(size,.6),cut=c+40,cSide=c*1.25;
    for(const [from,to,cz] of [[NC,N,cSide],[0,NC,c]]){
      for(let lv=0;lv<6;lv++){
        ctx.fillStyle=PAL[lv];ctx.beginPath();let any=false;
        for(let p=from;p<to;p++){if(LV[p]!==lv||OR[p])continue;const x=X[p],y=Y[p];if(x<-cut||x>W+cut||y<-cut||y>H+cut)continue;ctx.rect(x,y,cz,cz);any=true}
        if(any)ctx.fill();
      }
    }
    ctx.fillStyle='#9c3200';ctx.beginPath();for(let p=NC;p<N;p++){if(OR[p]&&LV[p]!==255)ctx.rect(X[p],Y[p],cSide,cSide)}ctx.fill();
    ctx.fillStyle='#ff4f00';ctx.beginPath();for(let p=0;p<NC;p++){if(OR[p])ctx.rect(X[p],Y[p],c,c)}ctx.fill();

    }
    const idx=Math.round(s);if(idx!==lastIdx){if(hudName)hudName.textContent=NAMES[idx];lastIdx=idx}
    if(hudBar)hudBar.style.width=(s/4*100)+'%';
    if(inIntro&&rIntro.onDraw){const cb=rIntro.onDraw;rIntro.onDraw=null;cb()}
    cost+=(performance.now()-fStart-cost)*.05;if(!(inIntro&&rIntro.t<1))slow=cost>10?true:cost<6?false:slow; // never switches while the R flies in or out of the loader
  }

  build().then(() => { if (alive) raf = requestAnimationFrame(frame); });
  return () => {
    alive = false; cancelAnimationFrame(raf); ac.abort();
    if (intro && inited && rIntro.t > 0) carry = { N, X, Y }; // page swap: the next page's R goes on from here
  };
}
