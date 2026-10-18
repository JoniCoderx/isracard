/* The round brilliant, drawn live: 57 facets at the classic proportions
   (table 54%, crown 34.5°, pavilion 40.75°, stars 50%, lower halves 77%),
   each facet a plane, the stone the space inside all of them. Every pixel
   follows its ray in, bends it at the diamond's refractive index (2.42),
   lets it bounce inside until it leaves, and splits it into colour as it
   leaves (dispersion, the stone's "fire"). Nothing is a picture: the light
   is worked out again for every position of the stone. */
window.SilavuGem = function (cv, o) {
  "use strict";
  o = o || {};
  var gl = cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance" });
  if (!gl) return null;
  var R = Math.PI / 180, P = [];
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function add(n, p) { var l = Math.hypot(n[0], n[1], n[2]); n = [n[0] / l, n[1] / l, n[2] / l]; var d = dot(n, p); if (d < 0) { n = [-n[0], -n[1], -n[2]]; d = -d; } P.push(n[0], n[1], n[2], d); }
  function three(a, b, c) { add(cross(sub(b, a), sub(c, a)), a); }
  function at(r, phi, y) { return [r * Math.cos(phi), y, r * Math.sin(phi)]; }
  var s = 0.54, c22 = Math.cos(22.5 * R), rv = s / c22, tc = Math.tan(34.5 * R), hc = (1 - rv) * tc, g = 0.05;
  var sc = Math.sin(34.5 * R), cc = Math.cos(34.5 * R), sp = Math.sin(40.75 * R), cp = Math.cos(40.75 * R), tp = sp / cp;
  var ra = s + 0.5 * (1 - s), ya = tc * (1 - ra * c22), rq = 0.23, yq = (sp * c22 * rq - sp - g * cp) / cp;
  P.push(0, 1, 0, hc);
  for (var k = 0; k < 8; k++) {
    var f = k * 45 * R, h = f + 22.5 * R, f2 = f + 45 * R;
    add([sc * Math.cos(f), cc, sc * Math.sin(f)], at(1, f, 0));                      /* bezel */
    var A = at(ra, h, ya); three(at(rv, f, hc), at(rv, f2, hc), A);                  /* star */
    three(A, at(1, f, 0), at(1, h, 0)); three(A, at(1, f2, 0), at(1, h, 0));          /* upper halves */
    add([sp * Math.cos(f), -cp, sp * Math.sin(f)], at(1, f, -g));                     /* pavilion main */
    var Q = at(rq, h, yq); three(Q, at(1, f, -g), at(1, h, -g)); three(Q, at(1, f2, -g), at(1, h, -g)); /* lower halves */
  }
  var NP = P.length / 4;
  /* the parts of the stone, for the words drawn beside it */
  var parts = { table: [0.3, hc, 0], crown: [0.8, hc * 0.3, 0], girdle: [-1, -g / 2, 0], pavilion: [0.5, -g - tp * 0.5, 0], culet: [-0.02, -g - tp, 0] };
  var VS = "#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = "#version 300 es\nprecision highp float;\n#define NP " + NP + "\n#define NB " + (o.bounces || 6) + "\n#define MID " + ((hc - g - tp) / 2).toFixed(4) + "\n" +
  "uniform vec4 uP[NP];uniform mat3 uR;uniform vec2 uC;uniform float uS,uWire,uLit,uY;out vec4 oc;\n" +
  "const float D=12.;\n" +
  /* the studio: a ring of soft light around the lens with the photographer's
     shadow at its centre (how diamonds are photographed), strips of light
     behind and above, a few small hot lamps that the stone breaks into colour */
  "vec3 env(vec3 d){float a=acos(clamp(d.z,-1.,1.)),az=atan(d.y,d.x);" +
  "vec3 c=vec3(.006,.006,.007)+vec3(.035)*smoothstep(-.3,.8,d.y);" +
  "float ring=smoothstep(.17,.25,a)*smoothstep(.95,.7,a);" +
  "float st=pow(.5+.5*sin(az*5.+.7),2.5);" +
  "c+=vec3(3.2,3.2,3.3)*ring*st+vec3(.05)*ring;" +
  "c+=vec3(.35)*smoothstep(.95,1.2,a)*smoothstep(1.7,1.3,a)*pow(.5+.5*sin(az*3.+2.),2.);" +
  "float b=smoothstep(2.0,2.2,a);c+=vec3(2.2)*b*smoothstep(.75,.0,abs(sin(az*3.)))*smoothstep(-.6,.4,d.y);" +
  "c+=vec3(2.4)*smoothstep(.86,.92,d.y);" +
  "c+=vec3(90.)*pow(max(dot(d,normalize(vec3(.55,.62,.56))),0.),1800.);" +
  "c+=vec3(70.)*pow(max(dot(d,normalize(vec3(-.6,.45,.66))),0.),2200.);" +
  "c+=vec3(60.)*pow(max(dot(d,normalize(vec3(.1,-.5,.86))),0.),2000.);" +
  "c+=vec3(50.)*pow(max(dot(d,normalize(vec3(-.3,.8,-.5))),0.),1500.);" +
  "c+=vec3(40.)*pow(max(dot(d,normalize(vec3(.7,-.2,.68))),0.),2500.);" +
  "for(int i=0;i<9;i++){float f=float(i)*2.399,z=.25+.6*fract(float(i)*.618);vec3 l=vec3(cos(f)*sqrt(1.-z*z),sin(f)*sqrt(1.-z*z),z);c+=vec3(55.)*pow(max(dot(d,l),0.),2600.);}" +
  "return c;}\n" +
  "vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}\n" +
  /* where a ray inside the stone leaves it: the nearest facet ahead, or the girdle */
  "float leave(vec3 o,vec3 d,out vec3 n){float t=1e9;n=vec3(0,1,0);for(int i=0;i<NP;i++){vec4 q=uP[i];float dn=dot(q.xyz,d);if(dn>1e-5){float u=(q.w-dot(q.xyz,o))/dn;if(u<t){t=u;n=q.xyz;}}}" +
  "float A=d.x*d.x+d.z*d.z;if(A>1e-6){float B=o.x*d.x+o.z*d.z,C=o.x*o.x+o.z*o.z-1.,s=B*B-A*C;if(s>0.){float u=(-B+sqrt(s))/A;if(u<t){t=u;n=normalize(vec3(o.x+d.x*u,0.,o.z+d.z*u));}}}return t;}\n" +
  "float fr(float c){float f0=.172;return f0+(1.-f0)*pow(1.-c,5.);}\n" +
  "void main(){vec2 q=(gl_FragCoord.xy-uC)/uS;q.y-=uY;vec3 ro=vec3(0,0,D),rd=normalize(vec3(q,-D));" +
  "mat3 T=transpose(uR);vec3 o=T*ro,d=T*rd;" +
  /* most of the canvas is not the stone: those rays stop at once */
  "vec3 m=o-vec3(0.,MID,0.);float mb=dot(m,d),mc=dot(m,m)-1.38;if(mb*mb-mc<0.){oc=vec4(0);return;}" +
  "float tn=-1e9,tn2=-1e9,tf=1e9,tf2=1e9;vec3 nn=vec3(0,1,0);bool miss=false;" +
  "for(int i=0;i<NP;i++){vec4 p=uP[i];float dn=dot(p.xyz,d),s=p.w-dot(p.xyz,o);if(abs(dn)<1e-6){if(s<0.)miss=true;continue;}float t=s/dn;" +
  "if(dn<0.){if(t>tn){tn2=tn;tn=t;nn=p.xyz;}else if(t>tn2)tn2=t;}else{if(t<tf){tf2=tf;tf=t;}else if(t<tf2)tf2=t;}}" +
  "float A=d.x*d.x+d.z*d.z,B=o.x*d.x+o.z*d.z,C=o.x*o.x+o.z*o.z-1.,sq=B*B-A*C;" +
  "if(A>1e-6){if(sq<0.)miss=true;else{float r=sqrt(sq),t0=(-B-r)/A,t1=(-B+r)/A;if(t0>tn){tn2=tn;tn=t0;nn=normalize(vec3(o.x+d.x*t0,0.,o.z+d.z*t0));}else if(t0>tn2)tn2=t0;if(t1<tf){tf2=tf;tf=t1;}else if(t1<tf2)tf2=t1;}}else if(C>0.)miss=true;" +
  "float span=tf-tn;if(miss||span<=0.){oc=vec4(0);return;}" +
  "float cov=clamp(span/max(fwidth(span),1e-5)*.7,0.,1.);" +
  /* the drawing: the facets' edges, front and back */
  "float e1=tn-tn2,e2=tf2-tf;float w1=1.-smoothstep(.4,1.4,e1/max(fwidth(e1),1e-6)),w2=1.-smoothstep(.4,1.4,e2/max(fwidth(e2),1e-6));" +
  "vec3 wire=vec3(.92,.93,.95)*max(w1,w2*.38);" +
  "vec3 col=vec3(0);" +
  "if(uLit>0.){vec3 p=o+d*tn,n=nn;float ci=clamp(-dot(d,n),0.,1.),F=fr(ci);col+=F*env(uR*reflect(d,n));" +
  "vec3 di=refract(d,n,1./2.417);float th=1.-F;vec3 n2;" +
  "for(int b=0;b<NB;b++){float t=leave(p+di*1e-4,di,n2);p=p+di*(t+1e-4);float c=dot(di,n2);float k=1.-2.417*2.417*(1.-c*c);" +
  "if(k>0.){float ct=sqrt(k),Fo=fr(ct);float w=th*(1.-Fo);" +
  "vec3 dr=refract(di,-n2,2.400),dg=refract(di,-n2,2.419),db=refract(di,-n2,2.446);" +
  "col+=w*vec3(dot(dr,dr)>0.?env(uR*dr).r:0.,dot(dg,dg)>0.?env(uR*dg).g:0.,dot(db,db)>0.?env(uR*db).b:0.);th*=Fo;}" +
  "di=reflect(di,n2);if(th<.01)break;}" +
  "col+=th*env(uR*di)*.6;col=pow(aces(col*.9),vec3(1./2.2));}" +
  "vec3 res=mix(wire,col,uLit)+wire*uWire*(1.-uLit)*0.+wire*uWire*uLit*.5;" +
  "float al=max(uLit,max(w1,w2*.38)*uWire);oc=vec4(res*al*cov,al*cov);}";
  function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(x)); return null; } return x; }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;
  var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(pr)); return null; }
  gl.useProgram(pr);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(gl.getUniformLocation(pr, "uP"), new Float32Array(P));
  var U = {}; ["uR", "uC", "uS", "uWire", "uLit", "uY"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
  /* the stone's turn: tilt brings the table towards you, spin turns it on its axis */
  function rot(tilt, spin, yaw) {
    var ct = Math.cos(tilt), st = Math.sin(tilt), cs = Math.cos(spin), ss = Math.sin(spin), cy = Math.cos(yaw), sy = Math.sin(yaw);
    var Ry = [cs, 0, -ss, 0, 1, 0, ss, 0, cs], Rx = [1, 0, 0, 0, ct, st, 0, -st, ct], Yw = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
    function mul(a, b) { var r = []; for (var c = 0; c < 3; c++) for (var i = 0; i < 3; i++) r[c * 3 + i] = a[i] * b[c * 3] + a[3 + i] * b[c * 3 + 1] + a[6 + i] * b[c * 3 + 2]; return r; }
    return mul(Yw, mul(Rx, Ry));
  }
  var M = rot(0, 0, 0), st = { cx: 0.5, cy: 0.5, size: 0.4, y: 0.1 };
  function draw(v) {
    v = v || {};
    M = rot(v.tilt || 0, v.spin || 0, v.yaw || 0);
    var W = cv.width, H = cv.height;
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix3fv(U.uR, false, new Float32Array(M));
    gl.uniform2f(U.uC, (v.cx == null ? 0.5 : v.cx) * W, (1 - (v.cy == null ? 0.5 : v.cy)) * H);
    gl.uniform1f(U.uS, (v.size || 0.4) * Math.min(W, H));
    gl.uniform1f(U.uY, v.y == null ? 0.2 : v.y);
    gl.uniform1f(U.uWire, v.wire == null ? 0 : v.wire); gl.uniform1f(U.uLit, v.lit == null ? 1 : v.lit);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  /* where a part of the stone falls on the canvas, as a share of it */
  function project(name, v) {
    /* the parts are named on the stone as it stands, not as it spins */
    var p = parts[name], m = rot(v.tilt || 0, 0, v.yaw || 0), D = 12;
    var w = [m[0] * p[0] + m[3] * p[1] + m[6] * p[2], m[1] * p[0] + m[4] * p[1] + m[7] * p[2], m[2] * p[0] + m[5] * p[1] + m[8] * p[2]];
    var W = cv.width, H = cv.height, S = (v.size || 0.4) * Math.min(W, H), k = D / (D - w[2]);
    return { x: ((v.cx == null ? 0.5 : v.cx) * W + w[0] * k * S) / W, y: ((v.cy == null ? 0.5 : v.cy) * H - (w[1] * k + (v.y == null ? 0.2 : v.y)) * S) / H };
  }
  /* what one drawing costs, waited for to the end (used to set the size) */
  function timed(v) { var t0 = performance.now(), px = new Uint8Array(4); draw(v); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - t0; }
  var info = "", dbg = gl.getExtension("WEBGL_debug_renderer_info");
  try { info = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER)); } catch (e) {}
  return { draw: draw, timed: timed, soft: /swiftshader|llvmpipe|softpipe|software|basic render/i.test(info), project: project, facets: NP, mid: (hc - g - tp) / 2, lost: function () { return gl.isContextLost(); } };
};
