/* The hero pop-out, for /test/: as she takes the necklace, her hands and the
   necklace pass in front of the headline. Computers only: a phone's tall
   screen shows too thin a slice of this wide film for the effect to work,
   and it keeps the plain loop.

   The film (data-pop) carries the picture on top and a matte below it in the
   same frame. The <video> itself shows the picture, placed so only its upper
   half is in the hero (the hero clips the rest), a little closer than cover
   and with the necklace (data-pop-x/-y, where it lies in the picture) set
   between the headline's lines. One canvas above the words draws only the
   matted part of the same frame, so the two layers cannot drift apart; it is
   darkened by the same veil the video sits under, so its edges disappear.

   Runs before the page's own script picks the film. Without WebGL, with
   reduced motion, or on a thin connection it changes nothing. */
(function () {
  var hv = document.getElementById("herovid"), hero = document.getElementById("hero"), cap = document.getElementById("hcap");
  if (!hv || !hero || !cap || !hv.getAttribute("data-pop")) return;
  if (!matchMedia("(min-width:900px) and (hover:hover) and (pointer:fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var conn = navigator.connection || {}; if (conn.saveData) return;
  var fg = document.createElement("canvas"), gl;
  try { gl = fg.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }); } catch (e) {}
  if (!gl) return;

  /* the page's script will load whatever these name: the packed film */
  var plain = hv.getAttribute("data-src");
  hv.setAttribute("data-src", hv.getAttribute("data-pop"));
  hv.removeAttribute("data-src-4k");
  hv.classList.add("popsrc");

  fg.className = "hv popfg"; fg.setAttribute("aria-hidden", "true");
  hero.appendChild(fg);

  var vs = "attribute vec2 p; varying vec2 q; void main(){ q = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";
  var fs = "precision mediump float; varying vec2 q; uniform sampler2D t; uniform vec4 fit;" +
    "void main(){ vec2 c = vec2(q.x, 1.0 - q.y);" +
    " vec2 u = (c - fit.xy) / fit.zw;" +
    " if (u.x < 0.0 || u.x > 1.0 || u.y < 0.0 || u.y > 1.0) { gl_FragColor = vec4(0.0); return; }" +
    " vec3 col = texture2D(t, vec2(u.x, u.y * 0.5)).rgb;" +
    " float a = clamp((texture2D(t, vec2(u.x, 0.5 + u.y * 0.5)).r - 0.06) / 0.88, 0.0, 1.0);" +
    " float y = c.y; float foot = y > 0.4 ? mix(0.0, 0.32, clamp((y - 0.4) / 0.3, 0.0, 1.0)) + (y > 0.7 ? (y - 0.7) / 0.3 * 0.34 : 0.0) : 0.0;" +
    " float head = y < 0.24 ? 0.30 * (1.0 - y / 0.24) : 0.0;" +
    " gl_FragColor = vec4(col * (1.0 - foot) * (1.0 - head) * a, a); }";
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { undo(); hv.setAttribute("data-src", plain); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var lp = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  var uFit = gl.getUniformLocation(pr, "fit");

  var title = cap.querySelector(".h"), Z = 1.15;
  var PY = parseFloat(hv.getAttribute("data-pop-y")) || 0.54, PX = parseFloat(hv.getAttribute("data-pop-x")) || 0.47;
  var fit = null, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  /* where the picture goes: worked out on load and on resize, not every frame */
  function place() {
    var r = hero.getBoundingClientRect(), vw = hv.videoWidth, ph = hv.videoHeight / 2;
    if (!r.width || !vw) return;
    var W = r.width, H = r.height;
    var s = Math.max(W / vw, H / ph) * Z, dw = vw * s, dh = ph * s;
    var tr = title.getBoundingClientRect(), aim = (tr.top - r.top + tr.height * 0.5) / H;
    var cy = Math.max(0.5 * H / dh, Math.min(1 - 0.5 * H / dh, PY - (aim - 0.5) * H / dh));
    var dx = Math.max(W - dw, Math.min(0, W * 0.5 - PX * dw)), dy = H * 0.5 - cy * dh;
    var st = hv.style;
    st.inset = "auto"; st.left = dx + "px"; st.top = dy + "px"; st.width = dw + "px"; st.height = 2 * dh + "px"; st.objectFit = "fill";
    fit = [dx / W, dy / H, dw / W, dh / H];
    fg.width = Math.round(W * dpr); fg.height = Math.round(H * dpr);
  }
  hv.addEventListener("loadedmetadata", place);
  addEventListener("resize", place);

  var lastT = null;
  function draw() {
    if (!fit) place(); if (!fit) return;
    gl.viewport(0, 0, fg.width, fg.height);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hv);
    gl.uniform4f(uFit, fit[0], fit[1], fit[2], fit[3]);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    /* the page drifts the video as it scrolls; the canvas follows */
    if (hv.style.transform !== lastT) { lastT = hv.style.transform; fg.style.transform = lastT; }
    if (!fg.classList.contains("on")) fg.classList.add("on");
  }
  if ("requestVideoFrameCallback" in hv) {
    var loop = function () { draw(); hv.requestVideoFrameCallback(loop); };
    hv.requestVideoFrameCallback(loop);
  } else {
    var tick = function () { if (!hv.paused && hv.readyState >= 2) draw(); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  hv.addEventListener("seeked", draw);

  function undo() {
    hv.classList.remove("popsrc"); fg.remove();
    ["inset", "left", "top", "width", "height", "objectFit"].forEach(function (k) { hv.style[k] = ""; });
  }
  /* if the packed film cannot be had, the plain one plays as before */
  hv.addEventListener("error", function () {
    if (!hv.classList.contains("popsrc")) return;
    undo(); hv.src = plain; var p = hv.play(); if (p && p.catch) p.catch(function () {});
  });
})();
