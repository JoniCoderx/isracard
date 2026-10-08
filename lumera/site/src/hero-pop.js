/* The hero pop-out, for /test/: as she takes the necklace, her hands and the
   necklace pass in front of the headline.

   The film (data-pop) carries the picture on top and a matte below it in the
   same frame. The <video> decodes it unseen; one canvas draws the picture
   where the video was (behind the words), and a second canvas above the words
   draws only the matted part of the same frame, so the two layers cannot
   drift apart. Both are fitted like object-fit: cover, a little closer, with
   the necklace (data-pop-x/-y, where it lies in the picture) set between the
   headline's lines, and follow the video's own movement. The front layer is darkened by the same veil the back layer
   sits under, so its edges disappear.

   Runs before the page's own script picks the film. Without WebGL, with
   reduced motion, or on a thin connection it changes nothing, and the plain
   film plays as before. */
(function () {
  var hv = document.getElementById("herovid"), hero = document.getElementById("hero"), cap = document.getElementById("hcap");
  if (!hv || !hero || !cap || !hv.getAttribute("data-pop")) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var conn = navigator.connection || {}; if (conn.saveData) return;
  var fg = document.createElement("canvas"), gl;
  try { gl = fg.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }); } catch (e) {}
  if (!gl) return;

  /* the page's script will load whatever these name: the packed film */
  var plain = hv.getAttribute("data-src"), plainM = hv.getAttribute("data-src-m") || plain;
  hv.setAttribute("data-src", hv.getAttribute("data-pop"));
  hv.setAttribute("data-src-m", hv.getAttribute("data-pop-m") || hv.getAttribute("data-pop"));
  hv.removeAttribute("data-src-4k");
  hv.classList.add("popsrc");

  var bg = document.createElement("canvas");
  bg.className = "hv popbg"; fg.className = "hv popfg";
  bg.setAttribute("aria-hidden", "true"); fg.setAttribute("aria-hidden", "true");
  hv.parentNode.insertBefore(bg, hv.nextSibling);
  hero.appendChild(fg);
  var bx = bg.getContext("2d");

  var vs = "attribute vec2 p; varying vec2 q; void main(){ q = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";
  var fs = "precision mediump float; varying vec2 q; uniform sampler2D t; uniform vec4 fit; uniform float vh;" +
    "void main(){ vec2 c = vec2(q.x, 1.0 - q.y);" +                      /* canvas, top-left origin */
    " vec2 u = (c - fit.xy) / fit.zw;" +                                    /* into the picture, 0..1 */
    " if (u.x < 0.0 || u.x > 1.0 || u.y < 0.0 || u.y > 1.0) { gl_FragColor = vec4(0.0); return; }" +
    " vec3 col = texture2D(t, vec2(u.x, u.y * 0.5)).rgb;" +
    " float a = texture2D(t, vec2(u.x, 0.5 + u.y * 0.5)).r;" +
    " a = clamp((a - 0.04) / 0.92, 0.0, 1.0);" +
    /* the veil the back layer sits under (.hshade): darker at the foot, a little at the head */
    " float y = c.y; float foot = y > 0.4 ? mix(0.0, 0.32, clamp((y - 0.4) / 0.3, 0.0, 1.0)) + (y > 0.7 ? (y - 0.7) / 0.3 * 0.34 : 0.0) : 0.0;" +
    " float head = y < 0.24 ? 0.30 * (1.0 - y / 0.24) : 0.0;" +
    " float keep = (1.0 - foot) * (1.0 - head);" +
    " gl_FragColor = vec4(col * keep * a, a); }";
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { fg.remove(); bg.remove(); return; }
  gl.useProgram(pr);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var lp = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  var uFit = gl.getUniformLocation(pr, "fit");

  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var title = cap.querySelector(".h"), PY = parseFloat(hv.getAttribute("data-pop-y")) || 0.54, PX = parseFloat(hv.getAttribute("data-pop-x")) || 0.47;
  var Z = matchMedia("(min-width:900px)").matches ? 1.3 : 1.25;
  function size() {
    var r = hero.getBoundingClientRect(); W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
    if (bg.width !== W || bg.height !== H) { bg.width = fg.width = W; bg.height = fg.height = H; }
  }
  addEventListener("resize", size); size();

  var started = false;
  function draw() {
    var vw = hv.videoWidth, vh2 = hv.videoHeight; if (!vw || !vh2 || !W) return;
    var ph = vh2 / 2;
    /* object-fit: cover at the video's own anchor, drawn a little closer and
       set so the necklace sits between the headline's two lines: as it is
       lifted, the chain and her fingers cross the words */
    var s = Math.max(W / vw, H / ph) * Z, dw = vw * s, dh = ph * s;
    var hr = hero.getBoundingClientRect(), tr = title ? title.getBoundingClientRect() : null;
    var aim = tr && hr.height ? (tr.top - hr.top + tr.height * 0.5) / hr.height : 0.62;
    /* where the pendant then falls, with no edge of the film left showing */
    var cy = Math.max(0.5 * H / dh, Math.min(1 - 0.5 * H / dh, PY - (aim - 0.5) * H / dh));
    /* and across, the pendant under the centred headline */
    var dx = Math.max(W - dw, Math.min(0, W * 0.5 - PX * dw)), dy = H * 0.5 - cy * dh;
    bx.drawImage(hv, 0, 0, vw, ph, dx, dy, dw, dh);
    gl.viewport(0, 0, W, H);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hv);
    gl.uniform4f(uFit, dx / W, dy / H, dw / W, dh / H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    /* the canvases move with the video (the page drifts it as it scrolls) */
    var cs = getComputedStyle(hv);
    bg.style.transform = fg.style.transform = cs.transform === "none" ? "" : cs.transform;
    bg.style.translate = fg.style.translate = cs.translate || "";
    if (!started) { started = true; bg.classList.add("on"); fg.classList.add("on"); }
  }
  if ("requestVideoFrameCallback" in hv) {
    var loop = function () { draw(); hv.requestVideoFrameCallback(loop); };
    hv.requestVideoFrameCallback(loop);
  } else {
    var tick = function () { if (!hv.paused) draw(); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  hv.addEventListener("seeked", draw);
  /* if the packed film cannot be had, the plain one plays as before */
  hv.addEventListener("error", function () {
    if (!hv.classList.contains("popsrc")) return;
    hv.classList.remove("popsrc"); bg.remove(); fg.remove();
    var desk = matchMedia("(min-width:900px)").matches;
    hv.src = desk ? plain : plainM; var p = hv.play(); if (p && p.catch) p.catch(function () {});
  });
})();
