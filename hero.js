/* ── live supernova hero — a lightweight cousin of the engine's mode 30 ── */
(function(){
'use strict';
const cv=document.getElementById('nova');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl=cv.getContext('webgl',{antialias:false});
if(!gl){ cv.style.background='url(assets/shot-molten.png) center/cover'; document.getElementById('motionToggle').hidden=true; return; }
const V='attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }';
const F=`precision highp float;
uniform vec2 R; uniform float T,B,MX,MY;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p);
  float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=.5; } return v; }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float lqF(vec2 p,float tt){
  vec2 q=vec2(fbm(p*.75+tt*.28), fbm(p*.75+vec2(4.7,2.3)-tt*.22));
  vec2 rr=vec2(fbm(p*.9+1.9*q+vec2(8.2,1.4)+tt*.15), fbm(p*.9+1.9*q+vec2(2.9,7.6)-tt*.11));
  return fbm(p*1.05+1.8*rr);
}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/min(R.x,R.y);
  uv.x+=MX*.04; uv.y+=MY*.03;
  float A=.28+B*.5;
  float t4=T*.10;
  float rad=length(uv*vec2(1.15,.78));
  vec2 pp=uv*vec2(.78,.62);
  pp=rot((.35+A*.4)*exp(-rad*1.6)*sin(t4*.7))*pp;
  float h=lqF(pp,t4);
  float e=.02;
  float sx=(lqF(pp+vec2(e,0.),t4)-lqF(pp-vec2(e,0.),t4))/(2.*e);
  float sy=(lqF(pp+vec2(0.,e),t4)-lqF(pp-vec2(0.,e),t4))/(2.*e);
  vec3 n=normalize(vec3(-sx,-sy,3.-A*.9));
  vec3 L=normalize(vec3(-.45,.62,.55));
  float diff=pow(max(dot(n,L),0.),.75);
  float spec=pow(max(dot(reflect(-L,n),vec3(0.,0.,1.)),0.),40.);
  float m=smoothstep(.34,.55,h*.7+fbm(uv*.5+vec2(3.3)+t4*.1)*.5-rad*.75+.24+A*.04);
  float warm=fbm(uv*1.1+vec2(9.1,5.5)+t4*.2);
  vec3 base=mix(vec3(.60,.62,.68),vec3(.72,.56,.40),smoothstep(.38,.78,warm));
  vec3 col=base*(.10+diff*.92)+vec3(1.)*spec*(1.1+B*.9)
    +vec3(1.,.42,.08)*smoothstep(.84,.97,warm)*diff*.8;
  float patch=smoothstep(.38,.66,fbm(uv*1.+vec2(1.7,8.3)-t4*.13));
  float N2=34.;
  float fo=.009+A*.012;
  vec3 topo;
  { float v=fract((h+fo)*N2); topo.r=smoothstep(.14,.04,min(v,1.-v));
    v=fract(h*N2);            topo.g=smoothstep(.14,.04,min(v,1.-v));
    v=fract((h-fo)*N2);       topo.b=smoothstep(.14,.04,min(v,1.-v)); }
  vec3 fringed=vec3(topo.g)+vec3(max(topo.r-topo.g,0.),0.,max(topo.b-topo.g,0.))*.85;
  col+=fringed*patch*(.30+A*.28);
  vec3 dispc=.5+.5*cos(6.2831*(h*2.+rad*.7+vec3(0.,.33,.67)));
  float spot=smoothstep(.35,.8,fbm(uv*1.7+vec2(6.4,.8)+t4*.3));
  col+=dispc*spec*(.5+A*.5);
  col+=dispc*pow(m*(1.-m)*4.,2.4)*spot*(.5+A*.3);
  col*=m*.9;
  col+=(hash(gl_FragCoord.xy+fract(T)*13.7)-.5)*(1.6/255.);
  gl_FragColor=vec4(col,1.);
}`;
function sh(t,s){ const o=gl.createShader(t); gl.shaderSource(o,s); gl.compileShader(o); return o; }
const pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,V)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,F));
gl.linkProgram(pr); gl.useProgram(pr);
const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
const lp=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
const uR=gl.getUniformLocation(pr,'R'),uT=gl.getUniformLocation(pr,'T'),uB=gl.getUniformLocation(pr,'B'),
      uMX=gl.getUniformLocation(pr,'MX'),uMY=gl.getUniformLocation(pr,'MY');
let mx=0,my=0,tmx=0,tmy=0,beat=0,beatT=0,t0=performance.now();
function size(){ const d=Math.min(devicePixelRatio||1,1.5); const bounds=cv.getBoundingClientRect();
  cv.width=bounds.width*d*0.65; cv.height=bounds.height*d*0.65; gl.viewport(0,0,cv.width,cv.height); }
size(); addEventListener('resize',size);
addEventListener('pointermove',e=>{ tmx=(e.clientX/innerWidth-0.5)*2; tmy=(e.clientY/innerHeight-0.5)*2; },{passive:true});
addEventListener('pointerdown',()=>{ beatT=Math.min(1.3,beatT+1.0); },{passive:true});
let paused=reduce, visible=true, raf=0;
function frame(){
  raf=0;
  const t=(performance.now()-t0)/1000;
  // everything eased — no discrete jumps anywhere: liquid must flow, never jerk
  beatT*=0.955;
  const swell=0.10+0.10*Math.sin(t*0.35);
  beat+=((beatT+swell)-beat)*0.045;
  mx+=(tmx-mx)*0.04; my+=(tmy-my)*0.04;
  gl.uniform2f(uR,cv.width,cv.height); gl.uniform1f(uT,t); gl.uniform1f(uB,beat);
  gl.uniform1f(uMX,mx); gl.uniform1f(uMY,my);
  gl.drawArrays(gl.TRIANGLES,0,6);
  if(!paused && visible && !document.hidden) raf=requestAnimationFrame(frame);
}
function resume(){ if(raf) cancelAnimationFrame(raf); raf=0; if(!paused && visible && !document.hidden) frame(); }
document.addEventListener('mattelab:motion',e=>{paused=e.detail.paused;resume();});
document.addEventListener('visibilitychange',resume);
if('IntersectionObserver' in window) new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();}).observe(cv);
frame();
})();
