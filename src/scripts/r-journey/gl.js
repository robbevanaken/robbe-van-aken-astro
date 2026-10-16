// WebGL renderer for the R (Oct 2026): the same look as the Canvas 2D halftone, but the GPU does the drawing, so the R
// can carry many more particles (finer, crisper) at no extra drawing cost.
// Pass 1 bins every particle into a texture with one texel per screen cell (points, MAX blending): R = the brightest
// face particle, G = the brightest wall particle, B = occupied, A = a lit face particle. Pass 2 runs over the screen:
// every pixel finds its cell, reads the texel and draws the cell's square (the halftone: four sizes in the ink for the
// face, small squares in four tones for the walls; the small look: solid cells), snapped to whole device pixels.
// The logo (the R path, solid, for the loader's R) is a texture drawn as stacked quads.
import { R_PATH } from './r-shape.js';

const VS_BIN = `#version 300 es
in vec3 a; // x, y (css px), brightness (< -5: hidden)
uniform vec2 grid; uniform float cell; uniform int nc;
out vec4 c;
void main(){
  float cx=floor(a.x/cell),cy=floor(a.y/cell);
  if(a.z<-5.||a.x<0.||a.y<0.||cx>=grid.x||cy>=grid.y){gl_Position=vec4(2.,2.,0.,1.);gl_PointSize=1.;return;}
  gl_Position=vec4((cx+.5)/grid.x*2.-1.,(cy+.5)/grid.y*2.-1.,0.,1.);gl_PointSize=1.;
  float b=clamp(a.z,0.,1.);bool cap=gl_VertexID<nc;
  c=vec4(cap?b:0.,cap?0.:b,1.,cap&&a.z>0.?1.:0.);
}`;
const FS_BIN = `#version 300 es
precision mediump float;in vec4 c;out vec4 o;void main(){o=c;}`;

const VS_QUAD = `#version 300 es
in vec2 a;out vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const FS_CELLS = `#version 300 es
precision highp float;
uniform sampler2D T;uniform ivec2 dims;uniform float cellD,canvasH,lb,fill,alpha;uniform int mode,walls,lo,fillGaps;
uniform vec3 tone[4];uniform float sizes[4];uniform int engrave;uniform float period;
out vec4 o;
bool cap(vec4 t){return t.a>0.;}
// one line of a horizontal line screen: P the period, w the stroke (device px), its edges antialiased
float line(float s,float P,float w){float d=abs(fract(s/P)-.5)*P;return clamp(w*.5-d+.5,0.,1.);}
// the engraving (Oct 2026, the site's look; chosen over halftone squares, round dots, characters, cross-hatching,
// riso and a 1-bit dither): a line screen fixed to the screen, the strokes heavier where the R takes more ink; the
// face in the ink, the walls in their own tone with thinner strokes
void engraved(vec2 p,float d,vec3 cl){
  float w=period*mix(.16,.74,d),ink=line(p.y,period,w)*alpha;
  if(ink<=0.)discard;o=vec4(cl*ink,ink);
}
void main(){
  vec2 p=vec2(gl_FragCoord.x,canvasH-gl_FragCoord.y);
  ivec2 c=ivec2(floor(p/cellD));
  if(c.x>=dims.x||c.y>=dims.y)discard;
  vec4 t=texelFetch(T,c,0);
  float fr;vec3 col;
  if(mode==0){
    bool cp=cap(t);float v=t.r;
    if(!cp&&fillGaps==1){ // a face cell the particles skipped (the turned lattice against the screen grid) between two face cells
      // (gaps of up to two cells: the exploded pitch's turned fragments left small holes on phones)
      vec4 l=texelFetch(T,c-ivec2(1,0),0),r=texelFetch(T,c+ivec2(1,0),0),u=texelFetch(T,c-ivec2(0,1),0),d=texelFetch(T,c+ivec2(0,1),0);
      vec4 l2=texelFetch(T,c-ivec2(2,0),0),r2=texelFetch(T,c+ivec2(2,0),0),u2=texelFetch(T,c-ivec2(0,2),0),d2=texelFetch(T,c+ivec2(0,2),0);
      if(cap(l)&&cap(r)){cp=true;v=(l.r+r.r)*.5;}else if(cap(u)&&cap(d)){cp=true;v=(u.r+d.r)*.5;}
      else if(cap(l)&&cap(r2)){cp=true;v=l.r;}else if(cap(l2)&&cap(r)){cp=true;v=r.r;}
      else if(cap(u)&&cap(d2)){cp=true;v=u.r;}else if(cap(u2)&&cap(d)){cp=true;v=d.r;}
    }
    if(engrave==1){
      if(cp){engraved(p,clamp((v*4.+.22+lb)/4.4,.35,1.),tone[3]);return;}
      float g=t.g;bool wl=t.b>0.;
      if(!wl){ // a wall cell the particles skipped between two wall cells: filled, or the walls' lines came out speckled
        vec4 l=texelFetch(T,c-ivec2(1,0),0),r=texelFetch(T,c+ivec2(1,0),0);if(l.b>0.&&r.b>0.){wl=true;g=max(l.g,r.g);}}
      if(wl){int lv=clamp(int(floor(g*4.2+.9+lb+.5)),1,4);engraved(p,.22+.1*float(lv),tone[lv-1]);return;}
      discard;
    }
    if(cp){int lv=clamp(int(floor(v*4.+.22+lb+.5)),1,4);fr=sizes[lv-1];col=tone[3];}
    else if(t.b>0.){int lv=clamp(int(floor(t.g*4.2+.9+lb+.5)),1,4);fr=.42;col=tone[lv-1];}
    else discard;
  }else{
    int lv;
    // the strongest tone from .3 (2D: .42): a blacker small R, solid letters on the services' red
    if(cap(t))lv=(t.r>.3?3:2)-lo;else if(t.b>0.&&walls==1)lv=t.g>.5?1:0;else discard;
    if(engrave==1){engraved(p,lv>=2?(lv==3?.9:.7):.45,tone[lv]);return;} // the small R's (header, services' letters) engraved too
    fr=lo==1?1.:fill;col=tone[lv];
  }
  vec2 l=floor(p-vec2(c)*cellD);
  if(mode==1){ // the small look: the square at its exact size, its edge pixels partly covered (as the 2D canvas draws it)
    float s=cellD*fr,of=(cellD-s)*.5;vec2 cv=clamp(min(l+1.,vec2(of+s))-max(l,vec2(of)),0.,1.);float a=cv.x*cv.y*alpha;
    if(a<=0.)discard;o=vec4(col*a,a);return;
  }
  float q=max(1.,floor(cellD*fr+.5)),off=floor((cellD-q)*.5+.5); // the halftone: whole device pixels, as its sprites
  if(l.x<off||l.x>=off+q||l.y<off||l.y>=off+q)discard;
  o=vec4(col*alpha,alpha);
}`;
// the logo: a textured quad, placed by a 2×3 affine (path units → css px), in one colour
const VS_LOGO = `#version 300 es
in vec2 a;uniform mat3 m;uniform vec2 view,box;out vec2 uv;
void main(){uv=a;vec2 s=(m*vec3(a*box,1.)).xy;gl_Position=vec4(s.x/view.x*2.-1.,1.-s.y/view.y*2.,0.,1.);}`;
// CRISP (Oct 2026): whenever the shape is rigid (the R in the hero, the header, the footer, the loader; a service's
// letter at rest) it is drawn from the vector itself instead of the particles: the face and its wall layers go into a
// mask at full resolution (R = face, G = walls, MAX blending), and the engraving's line screen is clipped by it, so the
// contour is as sharp as the logo file. The footer's cursor push is redone here as a warp of the mask.
const FS_MASK = `#version 300 es
precision mediump float;uniform sampler2D T;uniform vec3 col;in vec2 uv;out vec4 o;
void main(){o=vec4(col*texture(T,uv).a,1.);}`;
const FS_CRISP = `#version 300 es
precision highp float;uniform sampler2D M;uniform float canvasH,alpha,period,faceD,wallD;uniform vec3 tone[4];uniform vec4 push;out vec4 o;
float line(float s,float P,float w){float d=abs(fract(s/P)-.5)*P;return clamp(w*.5-d+.5,0.,1.);}
void main(){
  vec2 p=vec2(gl_FragCoord.x,canvasH-gl_FragCoord.y),q=p;
  if(push.z>0.){ // the crater: find the point the push carried here (fixed point), nothing where it opened up
    vec2 s=p;for(int i=0;i<4;i++){vec2 dv=s-push.xy;float d=length(dv);float pu=max(0.,1.-d/push.z);s=p-(d>0.?dv/d:vec2(0.))*pu*pu*push.z*push.w;}
    vec2 dv=s-push.xy;float d=length(dv),pu=max(0.,1.-d/push.z);vec2 back=s+(d>0.?dv/d:vec2(0.))*pu*pu*push.z*push.w;
    if(length(back-p)>1.5)discard;q=s;}
  vec4 m=texelFetch(M,ivec2(q.x,canvasH-q.y),0);float f=m.r,w=m.g*(1.-m.r);if(f+w<=.003)discard;
  float lf=line(p.y,period,period*mix(.16,.74,faceD))*f,lw=line(p.y,period,period*mix(.16,.74,wallD))*w;
  float a=(lf+lw)*alpha;if(a<=.003)discard;o=vec4((tone[3]*lf+tone[1]*lw)*alpha,a);
}`;
const FS_LOGO = `#version 300 es
precision mediump float;uniform sampler2D T;uniform vec3 col;uniform float alpha;in vec2 uv;out vec4 o;
void main(){float a=texture(T,uv).a*alpha;o=vec4(col*a,a);}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export function createGL(canvas) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true }); // preserved: page swaps take a still of the canvas (snapR)
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); } return { p, u }; };
  const bin = prog(VS_BIN, FS_BIN), cells = prog(VS_QUAD, FS_CELLS), logo = prog(VS_LOGO, FS_LOGO), maskP = prog(VS_LOGO, FS_MASK), crispP = prog(VS_QUAD, FS_CRISP);

  const pBuf = gl.createBuffer(), pVao = gl.createVertexArray();
  gl.bindVertexArray(pVao); gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  const qBuf = gl.createBuffer(), qVao = gl.createVertexArray();
  gl.bindVertexArray(qVao); gl.bindBuffer(gl.ARRAY_BUFFER, qBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const lBuf = gl.createBuffer(), lVao = gl.createVertexArray();
  gl.bindVertexArray(lVao); gl.bindBuffer(gl.ARRAY_BUFFER, lBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // the cell texture + its framebuffer, grown as needed
  const tex = gl.createTexture(), fb = gl.createFramebuffer();let tw = 0, th = 0;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  // shape textures, mipmapped so they stay smooth from the loader's 40px up: the R path at 2048px (sharp at the
  // footer's size too), and the services' letters (setIcons)
  const upload = (c) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const lTex = (() => { const c = document.createElement('canvas'); c.width = 2060; c.height = 1980; const g = c.getContext('2d'); g.scale(20, 20); g.fillStyle = '#fff'; g.fill(new Path2D(R_PATH)); return upload(c); })();
  let iTex = [];
  // the mask (canvas size, grown as needed)
  const mTex = gl.createTexture(), mFb = gl.createFramebuffer();let mw = 0, mh = 0;
  gl.bindTexture(gl.TEXTURE_2D, mTex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  let data = new Float32Array(0);
  const tones = new Map(), toneOf = (list) => { const k = list.join(); let t = tones.get(k); if (!t) { t = new Float32Array(list.flatMap(hex)); tones.set(k, t); } return t; };

  return {
    clear() { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); },
    // the particles as cells: o = { X, Y, BR, LV, N, NC, hc, cell (css px), DPR, W, H, mode: 0 halftone | 1 small, tones (4 hex),
    // lb, sizes (4), fill, walls, lo, gaps, alpha }
    cells(o) {
      const cols = Math.ceil(o.W / o.cell) + 1, rows = Math.ceil(o.H / o.cell) + 1;
      if (cols > tw || rows > th) { tw = Math.max(cols, tw); th = Math.max(rows, th); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); }
      if (data.length < o.N * 3) data = new Float32Array(o.N * 3);
      const { X, Y, BR, LV, hc } = o;
      for (let p = 0, j = 0; p < o.N; p++, j += 3) { data[j] = X[p] + hc; data[j + 1] = Y[p] + hc; data[j + 2] = LV[p] === 255 ? -10 : BR[p]; }
      // pass 1: bin
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, cols, rows); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendEquation(gl.MAX); gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(bin.p); gl.uniform2f(bin.u.grid, cols, rows); gl.uniform1f(bin.u.cell, o.cell); gl.uniform1i(bin.u.nc, o.NC);
      gl.bindVertexArray(pVao); gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, o.N * 3), gl.STREAM_DRAW);
      gl.drawArrays(gl.POINTS, 0, o.N);
      // pass 2: the squares
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
      gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const u = cells.u; gl.useProgram(cells.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.T, 0);
      gl.uniform2i(u.dims, cols, rows); gl.uniform1f(u.cellD, Math.round(o.cell * o.DPR)); gl.uniform1f(u.canvasH, canvas.height);
      gl.uniform1f(u.lb, o.lb || 0); gl.uniform1f(u.fill, o.fill ?? 1); gl.uniform1f(u.alpha, o.alpha ?? 1);
      gl.uniform1i(u.mode, o.mode); gl.uniform1i(u.walls, o.walls === false ? 0 : 1); gl.uniform1i(u.lo, o.lo ? 1 : 0); gl.uniform1i(u.fillGaps, o.gaps ? 1 : 0);
      gl.uniform3fv(u.tone, toneOf(o.tones)); gl.uniform1fv(u.sizes, o.sizes || [1, 1, 1, 1]);
      gl.uniform1i(u.engrave, o.engrave ? 1 : 0); gl.uniform1f(u.period, o.period || 6);
      gl.bindVertexArray(qVao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    // the logo: m = [a, b, c, d, e, f] (canvas-style affine, path units → css px), layers: [{dx, dy, col}] drawn in order
    logo(m, layers, alpha, W, H) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const u = logo.u; gl.useProgram(logo.p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, lTex); gl.uniform1i(u.T, 0);
      gl.uniform2f(u.view, W, canvas.height / (canvas.width / W)); gl.uniform2f(u.box, 103, 99); gl.uniform1f(u.alpha, alpha); gl.bindVertexArray(lVao);
      for (const l of layers) {
        gl.uniformMatrix3fv(u.m, false, [m[0], m[1], 0, m[2], m[3], 0, m[4] + l.dx, m[5] + l.dy, 1]);
        gl.uniform3fv(u.col, hex(l.col)); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    },
    setIcons(cs) { if (!iTex.length) iTex = cs.map(upload); },
    // the crisp shape: shapes = [{ tex: 'R' | icon index, m: [a, b, c, d, e, f] (texture box → css px), box: [w, h],
    // dx, dy, n (the wall layers stepping back) }], o = { W, alpha, period, faceD, wallD, tones, push: [x, y, r, s] (device px) | null }
    crisp(shapes, o) {
      if (canvas.width > mw || canvas.height > mh) { mw = Math.max(mw, canvas.width); mh = Math.max(mh, canvas.height); gl.bindTexture(gl.TEXTURE_2D, mTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, mw, mh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.bindFramebuffer(gl.FRAMEBUFFER, mFb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, mTex, 0); }
      gl.bindFramebuffer(gl.FRAMEBUFFER, mFb); gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendEquation(gl.MAX); gl.blendFunc(gl.ONE, gl.ONE);
      const u = maskP.u; gl.useProgram(maskP.p); gl.activeTexture(gl.TEXTURE0); gl.uniform1i(u.T, 0); gl.bindVertexArray(lVao);
      gl.uniform2f(u.view, o.W, canvas.height / (canvas.width / o.W));
      for (const sh of shapes) {
        const t = sh.tex === 'R' ? lTex : iTex[sh.tex]; if (!t) continue; gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform2f(u.box, sh.box[0], sh.box[1]);
        const m = sh.m, at = (k) => gl.uniformMatrix3fv(u.m, false, [m[0], m[1], 0, m[2], m[3], 0, m[4] + sh.dx * k, m[5] + sh.dy * k, 1]);
        gl.uniform3f(u.col, 0, 1, 0); for (let l = sh.n; l > 0; l--) { at(l / sh.n); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
        gl.uniform3f(u.col, 1, 0, 0); at(0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
      gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const c = crispP.u; gl.useProgram(crispP.p); gl.bindTexture(gl.TEXTURE_2D, mTex); gl.uniform1i(c.M, 0);
      gl.uniform1f(c.canvasH, canvas.height); gl.uniform1f(c.alpha, o.alpha); gl.uniform1f(c.period, o.period); gl.uniform1f(c.faceD, o.faceD); gl.uniform1f(c.wallD, o.wallD);
      gl.uniform3fv(c.tone, toneOf(o.tones)); gl.uniform4fv(c.push, o.push || [0, 0, 0, 0]);
      gl.bindVertexArray(qVao); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() { gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}
