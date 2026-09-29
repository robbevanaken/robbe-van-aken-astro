// Featured projects: a pinned, scrubbed GSAP timeline that always settles on a project.
// Like a scope picking a new target: the current project and the frame shrink,
// the row slides until the next project sits in the small frame, then it grows.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function initProjectsScope() {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;
    const wrap=document.querySelector('.pwrap');if(!wrap)return;
    const stage=wrap.querySelector('.pstage'),frame=wrap.querySelector('.pframe'),cards=[...wrap.querySelectorAll('.pcard')],n=cards.length;
    const PROJ=cards.map(c=>[c.dataset.title,c.dataset.desc]);
    const capT=document.getElementById('pc-t'),capD=document.getElementById('pc-d'),cap=wrap.querySelector('.pcap'),cnt=document.getElementById('p-count');
    let mainW,mainH,sm,gap,side;
    function dims(){
      const mob=innerWidth<760;
      const avail=innerHeight*.9-wrap.querySelector('.phead').offsetHeight-wrap.querySelector('.pfoot').offsetHeight-(mob?40:56);
      mainW=Math.max(200,Math.min(innerWidth*(mob?.88:.68),mob?9999:1040,avail*1.6));mainH=mainW/1.6;sm=mob?.3:.24;gap=mainW*sm+26;side=mainW/2+44+mainW*sm/2;
      cards.forEach(c=>{c.style.width=mainW+'px';c.style.height=mainH+'px'});stage.style.height=mainH+'px';wrap.style.setProperty('--mw',mainW+'px');
    }
    dims();
    const restX=(i,k)=>{const d=i-k;return d===0?0:Math.sign(d)*(side+(Math.abs(d)-1)*gap)};
    const zoomX=(i,k)=>(i-k)*gap;
    const REST=.4,SHRINK=1,SLIDE=.9,GROW=1,STEP=SHRINK+SLIDE+GROW+REST;
    let shown=0;
    function caption(time){
      const f=time/STEP,idx=clamp(Math.round(f),0,n-1),dist=Math.abs(f-idx);
      cap.style.opacity=clamp(1-(dist-.06)*5,0,1);
      if(idx!==shown){shown=idx;capT.textContent=String(idx+1).padStart(2,'0')+', '+PROJ[idx][0];capD.textContent=PROJ[idx][1];cnt.textContent=String(idx+1).padStart(2,'0')}
    }
    ScrollTrigger.addEventListener('refreshInit',dims);
    gsap.set(frame,{xPercent:-50,yPercent:-50,width:()=>mainW,height:()=>mainH});
    cards.forEach((c,i)=>gsap.set(c,{xPercent:-50,yPercent:-50,x:()=>restX(i,0),scale:i===0?1:sm,opacity:i===0?1:.4,zIndex:i===0?2:1}));
    const tl=gsap.timeline({defaults:{ease:'power2.inOut'},onUpdate:()=>caption(tl.time()),scrollTrigger:{
      trigger:wrap,pin:true,start:'top top',end:()=>'+='+Math.round(innerHeight*.9*(n-1)),invalidateOnRefresh:true,
      scrub:motion?.45:true,
      snap:{snapTo:'labelsDirectional',duration:{min:.25,max:.7},delay:.04,ease:'power1.inOut',inertia:false}}});
    tl.addLabel('p0',0);
    for(let k=0;k<n-1;k++){
      const t=k*STEP+REST/2,next=k+1;
      // 1. zoom out: the frame and the current project shrink, the row closes in
      tl.to(frame,{width:()=>mainW*sm,height:()=>mainH*sm,duration:SHRINK},t);
      cards.forEach((c,i)=>tl.to(c,{x:()=>zoomX(i,k),scale:sm,opacity:i===k?1:.55,duration:SHRINK},t));
      // 2. retarget: the row slides until the next project sits in the small frame
      cards.forEach((c,i)=>tl.to(c,{x:()=>zoomX(i,next),opacity:i===next?1:.55,zIndex:i===next?2:1,duration:SLIDE,ease:'power3.inOut'},t+SHRINK));
      // 3. lock on: the new project and the frame grow back to full size
      tl.to(frame,{width:()=>mainW,height:()=>mainH,duration:GROW},t+SHRINK+SLIDE);
      cards.forEach((c,i)=>tl.to(c,{x:()=>restX(i,next),scale:i===next?1:sm,opacity:i===next?1:.4,duration:GROW},t+SHRINK+SLIDE));
      tl.addLabel('p'+next,(k+1)*STEP);
    }
    tl.to({},{duration:REST/2},(n-1)*STEP-REST/2);
    // scrolling scrubs the animation (fast scrolls stay smooth), and it always settles on a project:
    // snapping handles the normal case, this safety net catches any stop between two projects
    ScrollTrigger.addEventListener('scrollEnd',()=>{
      const st=tl.scrollTrigger;if(!st||!st.isActive)return;
      const k=n-1,x=st.progress*k,r=clamp(st.direction>0?Math.ceil(x-.02):Math.floor(x+.02),0,k);
      if(Math.abs(x-r)>.004)window.scrollTo({top:st.start+(st.end-st.start)*r/k,behavior:motion?'smooth':'auto'});
    });
    caption(0);
}
