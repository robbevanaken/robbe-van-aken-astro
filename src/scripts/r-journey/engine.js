// The R journey: one set of particles that travels through the page.
// States (see data-stage in the markup): 0 hero "Pixel", 1 pitch "Fragment", 2 projects "Craft",
// 3 services "Parts" (the R rebuilds into one big icon per service, morphing on scroll), 4 footer "Play",
// 6 how I work "Point" (the R as an arrow on [data-r-pointer], pointing at the row in the middle of the screen).
// (5 is the loader's copy of stage 2, see rIntro.)
// Pipeline per frame: scroll -> state blend -> 3D targets per particle (springs) -> lighting -> draw
// (fine glyph dither by default; the dev HUD / G key cycles through the other looks to compare).
// Instances: every <canvas data-r-canvas> runs its own R. `scope` limits which [data-stage] elements and anchors it
// uses (home: the whole page; subpages: one R in the header, a separate one in the footer). `cull` skips all work
// while the scope is off screen.
import { R_PATH } from './r-shape.js';
import { LOOKS, LOOK } from './looks.js';
import { serviceProgress } from '../components/services.js';
import { theme } from '../global/theme.js';

// The page loader and page swaps (global/pageTransitions.js) borrow the page's R: while `rIntro.t` is 1 the engine with
// `intro` draws it as the small R on `rIntro.el` (state 5, a copy of stage 2 on its own anchor); as t goes to 0 it
// blends, with a full turn, into wherever the page has it (home: the hero, subpages: the header). Page swaps first take
// it from 0 to 1. onDraw: called once after the next frame drawn in intro (a page swap then drops its still of the old R).
// drift: how far (px, average) the intro R's particles still are from where they're heading; ~0 = at rest.
// turn: an extra turn (radians) on the intro R, e.g. while a page swap moves it from the menu's corner to the middle.
export const rIntro = { el: null, t: 0, onDraw: null, drift: 0, turn: 0 };
// the smoothed mouse, kept across page swaps: the next page's R starts turned exactly like the old one
const mouse = { mx: 0, my: 0, smx: 0, smy: 0 };
// page swaps: the R's static particle data is built once per size (geo) and reused by every next engine, and the intro
// R hands its particle positions over (carry), so the next page's R is ready at once and goes on mid-flight
let geo = null, carry = null;
// shared by all engines (nothing is rebuilt after a page swap): glyph sprites per cell size, the glyph grid buffers
const spriteCache = new Map(), grid = { GC: null, GS: null, GN: null, OCC: null };

// `follow`: the small R (stage 2: projects on home, header on subpages) turns with the mouse like the hero R.

export function initREngine({ canvas = document.getElementById('r-canvas'), scope = document, cull = false, follow = true, intro = false, look = LOOK } = {}) {
  if (!canvas || !scope) return null;
  // page swaps: every window listener goes through this signal, destroy() stops the frame loop
  const ac=new AbortController(),signal=ac.signal;let alive=true,raf=0;

  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches,motion=reduce?0:1;
  const cvs=canvas,ctx=cvs.getContext('2d');
  let W=0,H=0,DPR=1;
  // the CSS size follows innerWidth/innerHeight exactly (100vh is taller than the visible area on iOS while the toolbar shows,
  // which would stretch the drawing)
  // at most 2 device pixels per css pixel, 1.5 on touch screens (phones: 3 is a lot of glyphs per frame)
  function resize(){DPR=Math.min(window.devicePixelRatio||1,matchMedia('(pointer: coarse)').matches?1.5:2);W=innerWidth;H=innerHeight;cvs.width=W*DPR;cvs.height=H*DPR;cvs.style.width=W+'px';cvs.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}
  addEventListener('resize',resize,{signal});resize();

  let {mx,my,smx,smy}=mouse,mpx=-9999,mpy=-9999;
  addEventListener('pointermove',e=>{mx=e.clientX/W*2-1;my=e.clientY/H*2-1;mpx=e.clientX;mpy=e.clientY},{passive:true,signal});
  // touch: a finger pushes the footer's pixels away too (pointermove stops as soon as the browser starts scrolling);
  // it doesn't turn the R, or every scroll would tilt it
  const touch=e=>{const t=e.touches[0];if(t){mpx=t.clientX;mpy=t.clientY}};
  addEventListener('touchstart',touch,{passive:true,signal});addEventListener('touchmove',touch,{passive:true,signal});
  addEventListener('touchend',()=>{mpx=mpy=-9999},{passive:true,signal});

  // stages include the scope itself when it is a stage (e.g. the footer)
  const stages=[...(scope.matches?.('[data-stage]')?[scope]:[]),...scope.querySelectorAll('[data-stage]')],SV=stages.map(e=>+e.dataset.stage);
  if(!stages.length)return null;
  // A scope may have only one anchor (header: #a-craft, footer: #a-foot, contact's How I work: the arrow's
  // [data-r-pointer]): every missing anchor falls back to it.
  const find=(id)=>scope.querySelector?.('#'+id)||null;
  const main=find('a-craft')||find('a-foot')||find('a-hero')||find('a-pitch')||scope.querySelector?.('[data-r-pointer]')||scope.querySelector?.('[data-r-anchor]');if(!main)return null;
  const byId=(id)=>find(id)||main;
  const aHero=byId('a-hero'),aPitch=byId('a-pitch'),aCraft=byId('a-craft'),aFoot=byId('a-foot');
  // services: one icon in [data-service-slot], which one (and how far into the morph to the next) follows [data-services]
  const svcSlot=scope.querySelector?.('[data-service-slot]')||main,svcEl=scope.querySelector?.('[data-services]')||null;
  // how I work: the arrow (the last icon) on [data-r-pointer], moved from row to row by components/approach.js
  const aPoint=scope.querySelector?.('[data-r-pointer]')||main;
  const NAMES=['Pixel','Fragment','Craft','Parts','Play','Intro','Point'];
  const hudName=cull?null:scope.querySelector('#hud-name'),hudBar=cull?null:scope.querySelector('#hud-bar');
  function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;

  // particles: [0,NC) = front/back cap cells, [NC,N) = side-wall cells
  let BR,N=0,NC=0,GH=0,U,V,DZ,NX,NY,EDGE,BY,CH,K,X,Y,IU,IV,IZ,INX,INY,IE,LV,NI=1;
  let CU,CV,CC,CS,OX,OY,OZ,ICON_G=96,inited=false;
  const DEPTH=.075; // half thickness, in glyph heights

  async function build(){
    const gh=innerWidth<760?84:112;
    if(geo&&geo.GH===gh){({GH,N,NC,U,V,DZ,NX,NY,EDGE,BY,CH,K,K2,IU,IV,IZ,INX,INY,IE,CU,CV,CC,CS,OX,OY,OZ,ICON_G,NI}=geo);return ready()}
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
    EDGE=new Uint8Array(N);BY=new Float32Array(N);CH=new Uint8Array(N);K=new Float32Array(N);
    let p=0;
    for(const c of caps){U[p]=(c[0]+.5-GW/2)/GH;V[p]=(c[1]+.5-GH/2)/GH;DZ[p]=2;EDGE[p]=c[2];BY[p]=(bayer[(c[1]%4)*4+c[0]%4]+.5)/16-.5;p++}
    for(const b of bnd)for(let l=0;l<LAY;l++){U[p]=(b[0]+.5-GW/2)/GH;V[p]=(b[1]+.5-GH/2)/GH;DZ[p]=-1+2*(l+.5)/LAY;NX[p]=b[2];NY[p]=b[3];BY[p]=(bayer[(l%4)*4+b[0]%4]+.5)/16-.5;p++}

    const r=rng(7),KN=9,seeds=[Math.floor(r()*NC)];
    while(seeds.length<KN){let best=0,bd=-1;for(let t=0;t<400;t++){const q=Math.floor(r()*NC);let md=1e9;for(const s of seeds){const dd=(U[q]-U[s])**2+(V[q]-V[s])**2;if(dd<md)md=dd}if(md>bd){bd=md;best=q}}seeds.push(best)}
    CU=new Float32Array(KN);CV=new Float32Array(KN);const cn=new Float32Array(KN);
    for(let i=0;i<N;i++){
      let bk=0,bd=1e9;for(let k=0;k<KN;k++){const s=seeds[k];const dd=(U[i]-U[s])**2+(V[i]-V[s])**2;if(dd<bd){bd=dd;bk=k}}CH[i]=bk;if(i<NC){CU[bk]+=U[i];CV[bk]+=V[i];cn[bk]++}
    }
    for(let k=0;k<KN;k++){CU[k]/=cn[k]||1;CV[k]/=cn[k]||1}
    CC=new Float32Array(KN);CS=new Float32Array(KN);OX=new Float32Array(KN);OY=new Float32Array(KN);OZ=new Float32Array(KN);
    for(let k=0;k<KN;k++){const a=(r()-.5)*1.3;CC[k]=Math.cos(a);CS[k]=Math.sin(a);OX[k]=(r()-.5)*.28;OY[k]=(r()-.5)*.28;OZ[k]=(r()-.5)*.5}

    // service icons: bold, simple shapes that get extruded like the R. Drawn in a 30-unit box, rasterised at IG px
    // (96: about as many cap pixels as the R has cap particles, so the big icon is filled without gaps)
    const IG=96;
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
        CUT(g,()=>P(g,[8,19,15,11,22,19,22,23,15,15.5,8,23]))},
      // not a service: the arrow of stage 6 (how I work), pointing right, in the icons' gothic hand: a pointed-arch head
      // with a pointed arch cut out of it (like the window) on a broad shaft. Always the last one (index NI-1)
      g=>{g.beginPath();g.moveTo(11,2);g.quadraticCurveTo(21,5,29.5,15);g.quadraticCurveTo(21,25,11,28);g.quadraticCurveTo(16,15,11,2);g.fill();g.fillRect(1.5,12.4,13,5.2);
        CUT(g,()=>{g.beginPath();g.moveTo(17,9);g.quadraticCurveTo(21.5,11,24.5,15);g.quadraticCurveTo(21.5,19,17,21);g.quadraticCurveTo(19,15,17,9);g.fill()})}
    ];
    const icons=drawIcon.map(fn=>{const c=document.createElement('canvas');c.width=c.height=IG;const g=c.getContext('2d');g.scale(IG/30,IG/30);g.fillStyle='#fff';fn(g);
      const id=g.getImageData(0,0,IG,IG).data,ins=(x,y)=>x>=0&&y>=0&&x<IG&&y<IG&&id[(y*IG+x)*4+3]>120,cap=[],bd=[];
      for(let y=0;y<IG;y++)for(let x=0;x<IG;x++){if(!ins(x,y))continue;const u=(x+.5)/IG-.5,v=(y+.5)/IG-.5;
        let nx=0,ny=0,o=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&!ins(x+dx,y+dy)){nx+=dx;ny+=dy;o++}
        const e=!ins(x-1,y)||!ins(x+1,y)||!ins(x,y-1)||!ins(x,y+1);cap.push([u,v,e?1:0]);if(o){const l=Math.hypot(nx,ny)||1;bd.push([u,v,nx/l,ny/l])}}
      return{cap,bd}});
    // every particle has a place in every icon (icon q at [q*N, q*N+N)): the whole R becomes icon 0, then morphs from
    // icon to icon. Both sides are sorted top to bottom, so the top of one shape becomes the top of the next.
    ICON_G=IG;NI=icons.length;const ILAY=6;
    IU=new Float32Array(NI*N);IV=new Float32Array(NI*N);IZ=new Float32Array(NI*N);INX=new Float32Array(NI*N);INY=new Float32Array(NI*N);IE=new Uint8Array(NI*N);
    const srt=(a,b)=>(V[a]-V[b])||(U[a]-U[b]),capP=[],sideP=[];for(let k=0;k<N;k++)(k<NC?capP:sideP).push(k);capP.sort(srt);sideP.sort(srt);
    for(let q=0;q<NI;q++){
      const o=q*N,ic=icons[q],cl=ic.cap.slice().sort((a,b)=>(a[1]-b[1])||(a[0]-b[0]));
      capP.forEach((k,j)=>{const c=cl[Math.floor(j*cl.length/capP.length)];IU[o+k]=c[0];IV[o+k]=c[1];IZ[o+k]=2;IE[o+k]=c[2]});
      const slots=ic.bd.length*ILAY;
      sideP.forEach((k,j)=>{const sl=Math.floor(j*slots/sideP.length),b=ic.bd[sl%ic.bd.length],l=Math.floor(sl/ic.bd.length);IU[o+k]=b[0];IV[o+k]=b[1];IZ[o+k]=-1+2*(l+.5)/ILAY;INX[o+k]=b[2];INY[o+k]=b[3]});
    }
    for(let i=0;i<N;i++)K[i]=motion?(.055+r()*.09+CH[i]*.004):1;
    K2=new Float32Array(N);for(let i=0;i<N;i++)K2[i]=1-(1-K[i])**2; // the same spring over two frames (half-rate mode)
    geo={GH,N,NC,U,V,DZ,NX,NY,EDGE,BY,CH,K,K2,IU,IV,IZ,INX,INY,IE,CU,CV,CC,CS,OX,OY,OZ,ICON_G,NI};
    ready();
  }
  // per-engine particle state; the intro R takes over the previous page's positions during a page swap
  function ready(){
    X=new Float32Array(N);Y=new Float32Array(N);LV=new Uint8Array(N);BR=new Float32Array(N);
    if(intro){if(carry&&carry.N===N&&rIntro.t>0){X.set(carry.X);Y.set(carry.Y)}carry=null}
    inited=true;
  }

  const A=[{},{},{},{},{},{},{}],AS={};
  function rect(el,o){const r=el.getBoundingClientRect();o.cx=r.left+r.width/2;o.cy=r.top+r.height/2;o.w=r.width;o.h=r.height;return o}
  // jump: two neighbouring stage elements more than one stage apart (e.g. the services' icon straight into the arrow)
  // blend those two states directly instead of passing through the ones in between ({a, b, f}; null otherwise)
  let jump=null;
  function computeS(){
    jump=null;
    const vc=H/2,cs=stages.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2});
    if(vc<=cs[0])return SV[0];
    for(let i=0;i<cs.length-1;i++){if(vc<=cs[i+1]){const f=cs[i+1]-cs[i]<1?1:(vc-cs[i])/(cs[i+1]-cs[i]),t=clamp((f-.18)/.64,0,1);
      if(Math.abs(SV[i+1]-SV[i])>1){jump={a:SV[i],b:SV[i+1],f:t};return t<.5?SV[i]:SV[i+1]}
      return SV[i]+(SV[i+1]-SV[i])*t}}
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
  // services: MS turns the icon (a full turn per morph), SS = which cap faces us; icon sq0 morphs into sq1 by sg
  const MS=new Float32Array(9);let SS=1,sq0=0,sq1=0,sg=0;
  // how I work: MA sways the arrow (pointing right, turned a little so its depth shows), SA = which cap faces us; flip
  // turns it round (half a turn about Y, eased) when the pointer's data-dir says the reel is scrolled back
  const MA=new Float32Array(9);let SA=1,flip=0,SB=.98; // SB: the service icon's size in its slot
  const RY=new Float32Array(7),RX=new Float32Array(7),RZ=new Float32Array(7),M=[0,1,2,3,4,5,6].map(()=>new Float32Array(9)),MB=new Float32Array(9),SG=new Float32Array(7);
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
    else if(i===3){
      // mid-morph the shape comes apart in its fragments (the pitch's exploded view) and closes again as the next icon
      const a=AS,box=a.h*SB,m=MS,j0=sq0*N+p,j1=sq1*N+p,g=sg,c=CH[p],e=Math.sin(Math.PI*g)*.45*motion,
        z0=IZ[j0]===2?SS:IZ[j0],z1=IZ[j1]===2?SS:IZ[j1],
        lx=IU[j0]+(IU[j1]-IU[j0])*g+OX[c]*e,ly=IV[j0]+(IV[j1]-IV[j0])*g+OY[c]*e,lz=(z0+(z1-z0)*g)*.1+OZ[c]*e*.3,
        x=m[0]*lx+m[1]*ly+m[2]*lz,y=m[3]*lx+m[4]*ly+m[5]*lz,z=m[6]*lx+m[7]*ly+m[8]*lz,k=1/(1-z*.6),fl=Math.sin(time*1.1)*a.h*.012*motion;
      o[0]=a.cx+x*k*box;o[1]=a.cy+y*k*box+fl}
    else if(i===6){
      const a=A[6],box=a.h*.98,m=MA,j=(NI-1)*N+p,lx=IU[j],ly=IV[j],lz=(IZ[j]===2?SA:IZ[j])*.1,
        x=m[0]*lx+m[1]*ly+m[2]*lz,y=m[3]*lx+m[4]*ly+m[5]*lz,z=m[6]*lx+m[7]*ly+m[8]*lz,k=1/(1-z*.6);
      o[0]=a.cx+x*k*box;o[1]=a.cy+y*k*box}
    else{const a=A[4];proj(4,a,u,v,z,o);
      if(motion){let x=o[0],y=o[1];const dx=x-mpx,dy=y-mpy,dd=Math.hypot(dx,dy)||1,R=a.S*.24;if(dd<R){const pu=1-dd/R,push=pu*pu*R*.95;x+=dx/dd*push;y+=dy/dd*push}o[0]=x;o[1]=y}}
  }
  // colours per theme (global/theme.js): light = dark crosses / pixels on the light page
  const PALS={dark:['#2b211d','#43362f','#655750','#8f837c','#bcb2ab','#ece6e1'],light:['#e6ded6','#cfc5bc','#a3978e','#6f6560','#3d302a','#1f1511']};
  const LX=-.35,LY=-.55,LZ=.76;
  const DENS=[.8,.82,1.12,1,1.08,1.12,1];
  const t0=[0,0],t1=[0,0];let lastIdx=-1;
  // Glyph dither mode (like Unicorn's Glyph Dither): particles are binned into a screen grid and every
  // cell is drawn as a sprite glyph, empty / dim cross / bright cross, picked by brightness with ordered dithering
  const LK=LOOKS[look]||LOOKS[LOOK];
  let render=LK.render??3,GC=null,GS=null,GN=null,OCC=null,nOcc=0;
  // glyph look per theme. gamma > 1 pushes cells towards the bright cross (a heavier, more present R); colors: [dim,
  // bright]; line / pad: cross stroke width and inset, as a share of the cell. Light needs more: dark on light reads
  // thinner and greyer than white on dark, so more full crosses, heavier strokes, and a paler dim tone so the shaded
  // sides fall back and the front face (the shape) stands out.
  const G={dark:{gamma:2,colors:['#8d817a','#ffffff'],line:.32,pad:.23},light:{gamma:3,colors:['#c2b8af','#140b08'],line:.37,pad:.21}},BAYER4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  function sprites(cell,mode){
    const key=cell+'@'+DPR+mode;if(spriteCache.has(key))return spriteCache.get(key);
    const gs=G[mode],px=Math.max(2,Math.round(cell*DPR)),out=gs.colors.map(col=>{
      const c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d');
      const pad=px*gs.pad;g.strokeStyle=col;g.lineWidth=Math.max(1,px*gs.line);g.lineCap=px<6?'butt':'round';
      g.beginPath();g.moveTo(pad,pad);g.lineTo(px-pad,px-pad);g.moveTo(px-pad,pad);g.lineTo(pad,px-pad);g.stroke();return c});
    spriteCache.set(key,out);return out;
  }
  // fine: the same screen grid, but about one cell per particle and four tones; faces are crosses, side walls squares
  // cell size per stage, in particle pitches: about one particle per cell; the two biggest R's (pitch, footer) a step
  // coarser, so their crosses still read as crosses
  const FCELL=LK.cell?[0,1,2,3,4,5,6].map(i=>i===1||i===4?LK.cell[1]:LK.cell[0]):[1.12,1.3,1.12,1.12,1.3,1.12,1.12];
  const FINE={dark:['#5a4f49','#8d817a','#cbc2bc','#ffffff'],light:['#d9d0c8','#ab9f96','#5f514a','#140b08']};
  function spritesFine(cell,mode){
    const key='f'+cell+'@'+DPR+mode;if(spriteCache.has(key))return spriteCache.get(key);
    const gs=G[mode],px=Math.max(2,Math.round(cell*DPR)),mk=(col,sq)=>{
      const c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d');
      if(sq){const q=Math.max(1,Math.round(px*.58)),o=Math.round((px-q)/2);g.fillStyle=col;g.fillRect(o,o,q,q);return c}
      const pad=px*(gs.pad-.06);g.strokeStyle=col;g.lineWidth=Math.max(1,px*gs.line);g.lineCap=px<6?'butt':'round';
      g.beginPath();g.moveTo(pad,pad);g.lineTo(px-pad,px-pad);g.moveTo(px-pad,pad);g.lineTo(pad,px-pad);g.stroke();return c};
    const out={x:FINE[mode].map(c=>mk(c,false)),q:FINE[mode].map(c=>mk(c,true))};
    spriteCache.set(key,out);return out;
  }
  // a look's sprites: one per tone (and per size for the halftone)
  function spritesLook(cell,mode,shape){
    const key='L'+shape+cell+'@'+DPR+mode;if(spriteCache.has(key))return spriteCache.get(key);
    const gs=G[mode],px=Math.max(2,Math.round(cell*DPR));
    const sq=(col,fr)=>{const c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d');const q=Math.max(1,Math.round(px*fr)),o=Math.round((px-q)/2);g.fillStyle=col;g.fillRect(o,o,q,q);return c};
    const x=(col)=>{const c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d');const pad=px*(gs.pad-.06);g.strokeStyle=col;g.lineWidth=Math.max(1,px*gs.line);g.lineCap=px<6?'butt':'round';
      g.beginPath();g.moveTo(pad,pad);g.lineTo(px-pad,px-pad);g.moveTo(px-pad,pad);g.lineTo(pad,px-pad);g.stroke();return c};
    const out=shape==='x'?FINE[mode].map(x):shape==='sq'?FINE[mode].map(c=>sq(c,.58)):shape==='dot'?FINE[mode].map(c=>sq(c,.42)):
      (mode==='light'?[.44,.56,.68,.8]:[.3,.42,.54,.66]).map(fr=>sq(FINE[mode][3],fr)); // half: the darkest tone, four sizes (bigger on light: dark ink on paper reads thinner)
    spriteCache.set(key,out);return out;
  }
  const modeBtn=cull?null:scope.querySelector('#mode');
  // dev HUD / G key: Fine (the look) → Glyph (the coarser grid it came from) → Pixels → Mix (crosses per particle), to compare
  if(modeBtn){modeBtn.textContent=look==='halftone'?'Halftone':'Fine';modeBtn.onclick=()=>{render=[1,2,3,0][render];modeBtn.textContent=['Glyph','Pixels','Mix','Fine'][render];modeBtn.classList.toggle('is-off',render!==3)}}
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
    rect(svcSlot,AS);
    rect(aFoot,A[4]);A[4].S=Math.min(A[4].h,A[4].w*1.05)*.9;
    const inIntro=intro&&rIntro.el&&rIntro.t>0;
    rect(aPoint,A[6]);A[6].S=A[6].h;
    if(inIntro){rect(rIntro.el,A[5]);A[5].S=A[5].h*.9}

    RY[0]=(smx*1.7+Math.sin(tm*.4)*.55)*motion;RX[0]=(smy*1.1+Math.sin(tm*.29)*.3)*motion;RZ[0]=(Math.sin(tm*.23)*.3+smx*.25)*motion;
    RY[1]=(smx*.7+Math.sin(tm*.3)*.4)*motion;RX[1]=(.25+Math.sin(tm*.25)*.15)*motion;RZ[1]=-.12*motion;
    // follow: the hero's mouse turn at 45% strength (max ~60° turn), so the small R stays readable at the extremes
    if(follow){const FS=.45;RY[2]=RY[0]*FS;RX[2]=RX[0]*FS;RZ[2]=RZ[0]*FS}else{RY[2]=Math.sin(tm*.6)*.35*motion;RX[2]=0;RZ[2]=0}
    RY[3]=0;RX[3]=0;RZ[3]=0;
    RY[4]=(smx*1.3+Math.sin(tm*.35)*.3)*motion;RX[4]=(smy*.8)*motion;RZ[4]=Math.sin(tm*.2)*.12*motion;
    RY[5]=RY[2];RX[5]=RX[2];RZ[5]=RZ[2];

    // stage 6 is only ever reached whole (its markers hold it, jump blends it with its neighbours)
    const s=computeS(),s6=s===6;let i0=s6?6:Math.min(Math.floor(s),4),i1=s6?6:Math.min(i0+1,4),f=s6?0:s-i0;f=f*f*(3-2*f);
    spin=i1!==i0?[1,-1,0,1][i0]*f*TAU*motion:0;
    if(jump){i0=jump.a;i1=jump.b;f=jump.f*jump.f*(3-2*jump.f);spin=f*TAU*motion} // straight from one state to the other, with a full turn
    // loader: from the intro R to the page's own state (rounded: the page sits at its top), with a full turn
    if(inIntro){i1=Math.round(s);i0=5;f=1-rIntro.t;spin=(f*TAU+rIntro.turn)*motion}
    for(let i=0;i<7;i++){mat(RY[i]+(i===3?0:spin),RX[i],RZ[i],M[i]);SG[i]=M[i][8]>=0?1:-1}
    mat((RY[i0]*(1-f)+RY[i1]*f)+spin*(i0===3||i1===3?(1-Math.abs(i1-3)*(1-f)-Math.abs(i0-3)*f):1),RX[i0]*(1-f)+RX[i1]*f,RZ[i0]*(1-f)+RZ[i1]*f,MB);

    if(svcEl){const v=Math.min(serviceProgress(svcEl),NI-2);sq0=Math.floor(v);sq1=Math.min(sq0+1,NI-1);sg=v-sq0}
    // a slow sway (and a little of the mouse), plus a full turn per morph
    mat(-.4+(Math.sin(tm*.5)*.2+smx*.35+sg*TAU)*motion,.22+(Math.sin(tm*.4)*.08+smy*.15)*motion,-.05,MS);SS=MS[8]>=0?1:-1;
    const fT=aPoint.dataset?.dir==='-1'?Math.PI:0;flip=motion?flip+(fT-flip)*(slow?.17:.09):fT;
    mat(-.35+flip+(Math.sin(tm*.8)*.25+smx*.2)*motion,.15+(Math.sin(tm*.6)*.08+smy*.12)*motion,0,MA);SA=MA[8]>=0?1:-1;
    const Sh=AS.h;
    SB=W<640?.86:.98; // phones: a little smaller, so it stays inside the brackets as it turns
    const sz=i=>i===3?Sh*SB/ICON_G*DENS[3]:i===6?A[6].h*.98/ICON_G*DENS[6]:A[i].S/GH*DENS[i];
    // flat: lit as an icon (the services' icon, or the arrow: fm / fs / jn pick which one)
    const size=sz(i0)*(1-f)+sz(i1)*f,flat=(Math.abs(s-3)<.5||s6)&&!(inIntro&&f<.5),
      fm=s6?MA:MS,fs=s6?SA:SS,jn=s6?(NI-1)*N:(sg<.5?sq0:sq1)*N;

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
      let b;
      if(p<NC){
        if(flat)b=.1+.62*Math.max(0,(fm[2]*LX+fm[5]*LY+fm[8]*LZ)*fs)+(IE[jn+p]?.2:0);
        else b=.2+.8*capL+(EDGE[p]?.32:0);
      }else{
        const mm=flat?fm:MB,nx=flat?INX[jn+p]:NX[p],ny=flat?INY[jn+p]:NY[p],rx=mm[0]*nx+mm[1]*ny,ry=mm[3]*nx+mm[4]*ny,rz=mm[6]*nx+mm[7]*ny;
        if(rz<=.02){LV[p]=255;continue}
        b=(flat?.05:.08)+(flat?.5:.7)*Math.max(0,rx*LX+ry*LY+rz*LZ);
      }
      BR[p]=b;b+=BY[p]*.28;LV[p]=b<=0?0:b>=1?5:(b*6)|0;
    }
    if(inIntro)rIntro.drift=drift/Math.ceil(N/16);

    const mode=theme.mode;
    ctx.clearRect(0,0,W,H);
    if(render===0||render===3){
      const fine=render===3;
      // small shapes (the small R in the header / projects): finer cells so there is enough detail (~36 glyphs tall);
      // big shapes keep the density-based size
      const rh=(i0===3?Sh:A[i0].S)*(1-f)+(i1===3?Sh:A[i1].S)*f,baseCell=size<1.1?3:clamp(Math.round(size*1.35),4,7);
      const small=clamp((140-rh)/60,0,1); // white boost for the small R, so it reads white instead of grey
      const minCell=3/DPR; // glyphs of at least 3 device px (1.5 css px on retina): smaller and the crosses blur to grey
      const pitchF=(sz(i0)/DENS[i0])*(1-f)+(sz(i1)/DENS[i1])*f;
      const CELL=rh<140?Math.min(baseCell,Math.max(minCell,Math.round(rh/36*2)/2)):fine?Math.max(minCell,Math.round(pitchF*(FCELL[i0]*(1-f)+FCELL[i1]*f)*DPR)/DPR):baseCell,cols=Math.ceil(W/CELL)+1,rows=Math.ceil(H/CELL)+1,NN=cols*rows;
      if(!grid.GC||grid.GC.length<NN)Object.assign(grid,{GC:new Float32Array(NN),GS:new Float32Array(NN),GN:new Uint16Array(NN),OCC:new Uint32Array(NN)});
      ({GC,GS,GN,OCC}=grid);nOcc=0;
      GC.fill(0,0,NN);GS.fill(0,0,NN);GN.fill(0,0,NN);
      const sp=(sz(i0)/DENS[i0])*(1-f)+(sz(i1)/DENS[i1])*f,expect=Math.max(1,(CELL/Math.max(sp,.3))**2*.45),hc=size/2;
      for(let p=0;p<N;p++){
        if(LV[p]===255)continue;const x=X[p]+hc,y=Y[p]+hc;if(x<0||y<0||x>=W||y>=H)continue;
        const ci=((y/CELL)|0)*cols+((x/CELL)|0),b=BR[p];
        if(p<NC){if(b>GC[ci])GC[ci]=b}else if(b>GS[ci])GS[ci]=b;
        if(GN[ci]===0)OCC[nOcc++]=ci;if(GN[ci]<65000)GN[ci]++;
      }
      if(fine&&rh>=140){
        const sf=spritesFine(CELL,mode);
        // a face cell the particles skipped (the turned lattice against the screen grid) between two face cells: filled in
        for(let o=0,n0=nOcc;o<n0;o++){
          const ci=OCC[o];if(!(GC[ci]>0))continue;
          for(const d of [1,cols]){const m=ci+d,e=ci+2*d;if(e<NN&&!(GC[m]>0)&&GC[e]>0){GC[m]=(GC[ci]+GC[e])/2;if(GN[m]===0)OCC[nOcc++]=m;GN[m]=1}}
        }
        if(LK.face&&look!=='fine'){
          const X_=spritesLook(CELL,mode,'x'),FA=LK.face==='alt'?null:spritesLook(CELL,mode,LK.face),WA=spritesLook(CELL,mode,LK.wall),DO=LK.face==='alt'?spritesLook(CELL,mode,'dot'):null,dz=LK.dither||0,lb=mode==='light'?.8:0; // lb: light needs more ink to read
          for(let o=0;o<nOcc;o++){
            const ci=OCC[o],r=(ci/cols)|0,q=ci-r*cols,cap=GC[ci]>0,v=clamp(cap?GC[ci]:GS[ci],0,1),bay=((BAYER4[(r&3)*4+(q&3)]+.5)/16-.5)*dz;
            if(!cap){ctx.drawImage(WA[clamp(Math.round(v*4.2+.9+lb+bay),1,4)-1],q*CELL,r*CELL,CELL,CELL);continue}
            const isEdge=LK.edge&&(!(GC[ci-1]>0)||!(GC[ci+1]>0)||!(GC[ci-cols]>0)||!(GC[ci+cols]>0));
            if(isEdge){ctx.drawImage(X_[3],q*CELL,r*CELL,CELL,CELL);continue}
            let lv=LK.two?(v+bay>.5?4:3):clamp(Math.round(v*4+.22+lb+bay),1,4);
            const spr=LK.face==='alt'?((r+q)&1?X_:DO):FA;
            ctx.drawImage(spr[lv-1],q*CELL,r*CELL,CELL,CELL);
          }
        }else
        for(let o=0;o<nOcc;o++){
          const ci=OCC[o],r=(ci/cols)|0,q=ci-r*cols,cap=GC[ci]>0,v=clamp(cap?GC[ci]:GS[ci],0,1);
          const lv=clamp(Math.round((cap?v*4+.22:v*4.2+.9)+((BAYER4[(r&3)*4+(q&3)]+.5)/16-.5)*.9),1,4);
          ctx.drawImage((cap?sf.x:sf.q)[lv-1],q*CELL,r*CELL,CELL,CELL);
        }
      }else{
      const spr=sprites(CELL,mode),gamma=G[mode].gamma;
      for(let o=0;o<nOcc;o++){
        const ci=OCC[o],n=GN[ci],r=(ci/cols)|0,q=ci-r*cols;
        const base=GC[ci]>0?GC[ci]:GS[ci];let v=Math.pow(clamp(base*Math.min(1,.35+.65*n/expect),0,1),1/gamma);
        if(small>0)v+=(1-v)*.75*small; // small R: mostly bright crosses, so it reads white instead of grey
        const lv=clamp(Math.round(v*2+((BAYER4[(r&3)*4+(q&3)]+.5)/16-.5)*.9),0,2);if(!lv)continue;
        ctx.drawImage(spr[lv-1],q*CELL,r*CELL,CELL,CELL);
      }
      }
    }else if(render===2){
      // mix: the pixels' geometry with the glyphs' texture. Every particle is drawn where it is (no screen grid), so the
      // outline and the depth stay sharp: the faces as crosses in the six tones, the side walls behind them as small
      // squares; the faces' footprints are cut out of the walls first, so nothing shows through the crosses.
      const pitch=Math.max((sz(i0)/DENS[i0])*(1-f)+(sz(i1)/DENS[i1])*f,.6),hc=size/2,cut=pitch+40,gs=G[mode],pal=PALS[mode];
      const q=pitch*.56,qh=q/2,a=pitch*(.5-gs.pad),ph=pitch/2;
      for(let lv=0;lv<6;lv++){
        ctx.fillStyle=pal[lv];ctx.beginPath();let any=false;
        for(let p=NC;p<N;p++){if(LV[p]!==lv)continue;const x=X[p]+hc,y=Y[p]+hc;if(x<-cut||x>W+cut||y<-cut||y>H+cut)continue;ctx.rect(x-qh,y-qh,q,q);any=true}
        if(any)ctx.fill();
      }
      ctx.globalCompositeOperation='destination-out';ctx.beginPath();
      for(let p=0;p<NC;p++){if(LV[p]===255)continue;const x=X[p]+hc,y=Y[p]+hc;if(x<-cut||x>W+cut||y<-cut||y>H+cut)continue;ctx.rect(x-ph,y-ph,pitch,pitch)}
      ctx.fill();ctx.globalCompositeOperation='source-over';
      ctx.lineWidth=Math.max(1/DPR,pitch*gs.line);ctx.lineCap=pitch*DPR<6?'butt':'round';
      for(let lv=0;lv<6;lv++){
        ctx.strokeStyle=pal[lv];ctx.beginPath();let any=false;
        for(let p=0;p<NC;p++){if(LV[p]!==lv)continue;const x=X[p]+hc,y=Y[p]+hc;if(x<-cut||x>W+cut||y<-cut||y>H+cut)continue;
          ctx.moveTo(x-a,y-a);ctx.lineTo(x+a,y+a);ctx.moveTo(x+a,y-a);ctx.lineTo(x-a,y+a);any=true}
        if(any)ctx.stroke();
      }
    }else{

    const c=Math.max(size,.6),cut=c+40,cSide=c*1.25;
    for(const [from,to,cz] of [[NC,N,cSide],[0,NC,c]]){
      for(let lv=0;lv<6;lv++){
        ctx.fillStyle=PALS[mode][lv];ctx.beginPath();let any=false;
        for(let p=from;p<to;p++){if(LV[p]!==lv)continue;const x=X[p],y=Y[p];if(x<-cut||x>W+cut||y<-cut||y>H+cut)continue;ctx.rect(x,y,cz,cz);any=true}
        if(any)ctx.fill();
      }
    }

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
