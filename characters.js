// Character rig + art for the Hausman explainer.
// Flat editorial style: white figures, fine dark outlines, black/gold Hausman workwear.
// Arms are real 2-bone rigs (shoulder → elbow → wrist) driven by angles or inverse kinematics.
(function (global) {
  const NS = "http://www.w3.org/2000/svg";
  const C = {
    ink: "#1d1d1b", gold: "#E8C85E", goldDeep: "#C9A63B", goldLight: "#F4E3A1",
    white: "#ffffff", skin: "#ffffff", cream: "#FFF6DC", shirt: "#1d1d1b", shirtFold: "#3a3a38",
    blush: "#F6D9C6",
  };
  const LW = 4;

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const g = (parent, attrs) => el("g", attrs, parent);
  const P = (parent, d, fill = "none", o = {}) => el("path", {
    d, fill, stroke: o.stroke === undefined ? C.ink : o.stroke, "stroke-width": o.w === undefined ? LW : o.w,
    "stroke-linecap": "round", "stroke-linejoin": "round", opacity: o.opacity, "stroke-dasharray": o.dash,
  }, parent);
  const circle = (parent, cx, cy, r, fill, o = {}) => el("circle", {
    cx, cy, r, fill, stroke: o.stroke === undefined ? C.ink : o.stroke, "stroke-width": o.w === undefined ? LW : o.w, opacity: o.opacity,
  }, parent);
  const rrect = (parent, x, y, w, h, r, fill, o = {}) => el("rect", {
    x, y, width: w, height: h, rx: r, fill, stroke: o.stroke === undefined ? C.ink : o.stroke, "stroke-width": o.w === undefined ? LW : o.w, opacity: o.opacity,
  }, parent);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const D2R = Math.PI / 180;

  // ---------------------------------------------------------------- hands (wrist at 0,0; fingers point to -y)
  function handOpen(h) {
    P(h, "M-24,2 C-28,-20 -30,-44 -27,-62 L-28,-88 C-28,-99 -13,-99 -13,-88 L-12,-66 L-8,-98 C-7,-109 8,-109 8,-98 L7,-66 L12,-93 C14,-104 28,-102 27,-91 L22,-62 L30,-80 C35,-90 48,-85 45,-74 L34,-42 C31,-24 29,-10 26,2 Z", C.skin);
    P(h, "M-27,-62 C-22,-54 -12,-50 -2,-51", "none", { w: 2.5 });
  }
  function handGrip(h) {
    P(h, "M-25,2 C-30,-18 -30,-40 -21,-52 C-11,-65 17,-65 28,-52 C37,-40 36,-18 30,2 Z", C.skin);
    P(h, "M-17,-46 C-9,-52 5,-52 13,-46 M-14,-34 C-6,-40 7,-40 14,-34", "none", { w: 2.5 });
    P(h, "M-25,-30 C-37,-34 -39,-49 -27,-55", C.skin);
  }
  function handPoint(h) {
    P(h, "M-25,2 C-30,-18 -30,-38 -22,-50 C-15,-59 -5,-61 3,-60 L3,-100 C3,-110 18,-110 18,-100 L18,-57 C27,-54 33,-45 33,-33 C33,-19 31,-9 28,2 Z", C.skin);
    P(h, "M-10,-46 C-3,-49 7,-48 15,-43 M-9,-34 C0,-37 9,-36 16,-31", "none", { w: 2.5 });
  }

  // ---------------------------------------------------------------- inverse kinematics
  // absolute angles (radians) of upper arm and forearm so the wrist lands on (tx,ty)
  function ik(sx, sy, tx, ty, L1, L2, bend = 1) {
    const dx = tx - sx, dy = ty - sy;
    const d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5);
    const a = Math.atan2(dy, dx);
    const A = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const t1 = a - bend * A;
    const ex = sx + L1 * Math.cos(t1), ey = sy + L1 * Math.sin(t1);
    return [t1, Math.atan2(ty - ey, tx - ex)];
  }

  // ---------------------------------------------------------------- arm rig
  function arm(parent, o) {
    const grp = g(parent);
    const L1 = o.L1 || 160, L2 = o.L2 || 148, W = o.width || 44;
    const outline = P(grp, "", "none", { w: W + 2 * LW });
    const fillP = P(grp, "", "none", { stroke: C.skin, w: W });
    const sleeveO = P(grp, "", "none", { w: W + 2 * LW + 10, stroke: o.sleeveOutline === false ? "none" : C.ink });
    const sleeveF = P(grp, "", "none", { stroke: o.sleeve || C.shirt, w: W + 10 });
    const cuff = P(grp, "", "none", { stroke: o.cuff || C.gold, w: 3.5 });
    const handG = g(grp);
    const handInner = g(handG);
    (o.hand || handOpen)(handInner);
    const extra = g(handG);   // props attach here (hand space, fingers towards -y)
    const sx = o.shoulder[0], sy = o.shoulder[1];
    const rig = {
      grp, handG, extra, L1, L2, sx, sy, a1: 0, a2: 0, handRot: 0, bend: o.bend || 1, handVisible: true,
      wrist: [0, 0], elbow: [0, 0],
      setAngles(a1deg, a2deg, handRot = 0) { this.a1 = a1deg * D2R; this.a2 = a2deg * D2R; this.handRot = handRot; this.draw(); },
      reach(tx, ty, handRot = 0, bend) {
        const [t1, t2] = ik(sx, sy, tx, ty, L1, L2, bend ?? this.bend);
        this.a1 = t1; this.a2 = t2; this.handRot = handRot; this.draw();
      },
      setHand(fn) { while (handInner.firstChild) handInner.removeChild(handInner.firstChild); fn(handInner); },
      draw() {
        const ex = sx + L1 * Math.cos(this.a1), ey = sy + L1 * Math.sin(this.a1);
        const wx = ex + L2 * Math.cos(this.a2), wy = ey + L2 * Math.sin(this.a2);
        this.elbow = [ex, ey]; this.wrist = [wx, wy];
        const d = `M${sx.toFixed(1)},${sy.toFixed(1)} Q${ex.toFixed(1)},${ey.toFixed(1)} ${wx.toFixed(1)},${wy.toFixed(1)}`;
        const qx = sx + (ex - sx) * 0.5, qy = sy + (ey - sy) * 0.5;
        const sd = `M${sx.toFixed(1)},${sy.toFixed(1)} L${qx.toFixed(1)},${qy.toFixed(1)}`;
        outline.setAttribute("d", d); fillP.setAttribute("d", d);
        sleeveO.setAttribute("d", sd); sleeveF.setAttribute("d", sd);
        const nx = -(ey - sy), ny = ex - sx, nl = Math.hypot(nx, ny) || 1, hw = (W + 10) / 2;
        cuff.setAttribute("d", `M${(qx + nx / nl * hw).toFixed(1)},${(qy + ny / nl * hw).toFixed(1)} L${(qx - nx / nl * hw).toFixed(1)},${(qy - ny / nl * hw).toFixed(1)}`);
        // hand follows the forearm direction of the quadratic curve (tangent at the end = elbow→wrist)
        const ang = Math.atan2(wy - ey, wx - ex) / D2R + 90 + this.handRot;
        handG.setAttribute("transform", `translate(${wx.toFixed(1)},${wy.toFixed(1)}) rotate(${ang.toFixed(2)})`);
        handG.setAttribute("opacity", this.handVisible ? 1 : 0);
      },
    };
    rig.setAngles(o.a1 ?? 100, o.a2 ?? 95);
    return rig;
  }

  // ---------------------------------------------------------------- Hausman technician
  // Front-facing bust, origin at the chest centre. Slim, clean-shaven, modern side-parted quiff.
  function technician(parent) {
    const root = g(parent);
    const back = g(root), body = g(root), headPivot = g(root), front = g(root);
    const armL = arm(back, { shoulder: [-104, 30], a1: 108, a2: 96, hand: handGrip, bend: -1 });
    // fitted black work shirt
    P(body, "M-132,360 L-138,130 C-142,62 -112,10 -56,-14 L0,6 L56,-14 C112,10 142,62 138,130 L132,360 Z", C.shirt);
    P(body, "M-100,150 C-90,200 -96,260 -90,330 M100,170 C92,220 98,280 92,340 M-60,40 C-40,60 -36,90 -40,110", "none", { stroke: C.shirtFold, w: 3 });
    P(body, "M0,24 V360", "none", { stroke: C.shirtFold, w: 3 });
    [70, 140, 210, 280].forEach(y => circle(body, 0, y, 4.5, C.gold, { w: 0 }));
    // collar with gold piping
    P(body, "M-56,-14 L-40,-46 C-22,-36 -10,-30 0,-28 C10,-30 22,-36 40,-46 L56,-14 L26,34 L0,6 L-26,34 Z", C.shirt);
    P(body, "M-56,-14 L-26,34 L0,6 L26,34 L56,-14", "none", { stroke: C.gold, w: 3 });
    // original Hausman emblem on the chest
    el("image", { href: "assets/emblem.png", x: -108, y: 64, width: 70, height: 70 }, body);
    // neck
    P(body, "M-26,-24 C-26,-50 -24,-90 -24,-140 L24,-140 C24,-90 26,-50 26,-24 C14,-14 -14,-14 -26,-24 Z", C.skin);
    const head = g(headPivot, { transform: "translate(0,16)" });
    const face = g(head);
    P(face, "M-66,-236 C-68,-296 -40,-336 0,-336 C40,-336 68,-296 66,-236 C66,-194 56,-158 34,-134 C22,-121 11,-116 0,-116 C-11,-116 -22,-121 -34,-134 C-56,-158 -66,-194 -66,-236 Z", C.skin);
    P(face, "M-66,-244 C-82,-252 -86,-216 -68,-206", C.skin);
    P(face, "M66,-244 C82,-252 86,-216 68,-206", C.skin);
    const brows = g(face);
    P(brows, "M-46,-258 C-38,-266 -22,-266 -12,-258", "none", { w: 5.5 });
    P(brows, "M12,-258 C22,-266 38,-266 46,-258", "none", { w: 5.5 });
    const eyes = g(face);
    const eyeL = g(eyes), eyeR = g(eyes);
    el("ellipse", { cx: -29, cy: -232, rx: 5.5, ry: 7, fill: C.ink }, eyeL);
    el("ellipse", { cx: 29, cy: -232, rx: 5.5, ry: 7, fill: C.ink }, eyeR);
    P(face, "M2,-224 C8,-208 10,-196 0,-190 C-3,-188 -6,-189 -8,-191", "none", { w: 3.2 });
    P(face, "M-24,-166 C-12,-150 12,-150 24,-166", "none", { w: 3.8 });
    P(face, "M-28,-170 C-27,-166 -25,-164 -22,-163 M28,-170 C27,-166 25,-164 22,-163", "none", { w: 2.4 });
    circle(face, -44, -186, 11, C.blush, { w: 0, opacity: 0.7 });
    circle(face, 44, -186, 11, C.blush, { w: 0, opacity: 0.7 });
    const hair = g(head);
    P(hair, "M-70,-240 C-76,-290 -62,-330 -26,-348 C4,-366 52,-364 72,-338 C84,-322 82,-292 72,-262 L68,-242 C64,-268 54,-290 34,-298 C14,-286 -14,-282 -42,-290 C-54,-282 -64,-264 -70,-240 Z", C.ink);
    P(hair, "M-30,-340 C0,-356 36,-354 58,-336", "none", { stroke: "#5a5a58", w: 3 });
    P(hair, "M-12,-326 C10,-338 32,-336 46,-326", "none", { stroke: "#5a5a58", w: 2.5 });
    const armR = arm(front, { shoulder: [104, 30], a1: 72, a2: 100, hand: handOpen, bend: 1 });
    return { root, head: headPivot, eyes, eyeL, eyeR, brows, armL, armR, body };
  }

  // ---------------------------------------------------------------- customer
  function customer(parent) {
    const root = g(parent);
    const back = g(root), body = g(root), headPivot = g(root), front = g(root);
    P(back, "M-92,-96 C-104,-176 -96,-296 0,-310 C96,-296 104,-176 92,-96 C70,-80 -70,-80 -92,-96 Z", C.ink);
    const armL = arm(back, { shoulder: [-98, 30], a1: 108, a2: 96, hand: handGrip, bend: -1, sleeve: C.cream, cuff: C.goldDeep, width: 40, sleeveOutline: false });
    P(body, "M-124,360 L-130,130 C-134,62 -106,12 -52,-12 L0,8 L52,-12 C106,12 134,62 130,130 L124,360 Z", C.cream);
    [[-90, 70], [-50, 140], [-96, 210], [-36, 270], [20, 120], [62, 64], [96, 160], [74, 240], [6, 330], [100, 310], [-66, 330], [30, 205]]
      .forEach(([x, y]) => circle(body, x, y, 6, C.gold, { w: 0 }));
    P(body, "M-52,-12 C-34,14 -14,24 0,20 C14,24 34,14 52,-12", "none");
    P(body, "M-24,-24 C-24,-50 -22,-90 -22,-140 L22,-140 C22,-90 24,-50 24,-24 C12,-14 -12,-14 -24,-24 Z", C.skin);
    const head = g(headPivot, { transform: "translate(0,16)" });
    const face = g(head);
    P(face, "M-62,-236 C-64,-292 -38,-330 0,-330 C38,-330 64,-292 62,-236 C62,-194 52,-160 32,-136 C20,-123 10,-118 0,-118 C-10,-118 -20,-123 -32,-136 C-52,-160 -62,-194 -62,-236 Z", C.skin);
    const brows = g(face);
    P(brows, "M-44,-262 C-36,-268 -22,-268 -14,-262 M14,-262 C22,-268 36,-268 44,-262", "none", { w: 4 });
    const eyes = g(face);
    const eyeL = g(eyes), eyeR = g(eyes);
    el("ellipse", { cx: -28, cy: -232, rx: 5, ry: 6.5, fill: C.ink }, eyeL);
    el("ellipse", { cx: 28, cy: -232, rx: 5, ry: 6.5, fill: C.ink }, eyeR);
    circle(face, -30, -230, 25, "none", { w: 3.5 }); circle(face, 30, -230, 25, "none", { w: 3.5 });
    P(face, "M-5,-232 C-2,-237 2,-237 5,-232", "none", { w: 3.5 });
    P(face, "M2,-218 C7,-204 8,-196 0,-192", "none", { w: 3 });
    P(face, "M-20,-166 C-10,-152 10,-152 20,-166", "none", { w: 3.5 });
    circle(face, -42, -188, 10, C.blush, { w: 0, opacity: 0.8 });
    circle(face, 42, -188, 10, C.blush, { w: 0, opacity: 0.8 });
    P(head, "M-66,-236 C-72,-300 -44,-344 0,-346 C44,-344 72,-300 66,-236 C62,-262 50,-286 26,-296 C6,-288 -24,-290 -44,-282 C-56,-272 -62,-256 -66,-236 Z", C.ink);
    const armR = arm(front, { shoulder: [98, 30], a1: 72, a2: 100, hand: handOpen, bend: 1, sleeve: C.cream, cuff: C.goldDeep, width: 40, sleeveOutline: false });
    return { root, head: headPivot, eyes, eyeL, eyeR, brows, armL, armR, body };
  }

  // two clasped hands, centred at (0,0): left person's hand wraps over the right person's hand
  function handshake(parent) {
    const h = g(parent);
    P(h, "M64,-18 C36,-26 6,-30 -22,-24 C-34,-20 -40,-8 -34,2 C-28,10 -14,12 0,10 C24,8 44,10 64,16 Z", C.skin);
    P(h, "M-66,-20 C-44,-30 -10,-34 14,-28 C30,-24 40,-12 36,2 C33,12 24,18 14,16 C6,14 2,8 2,2 L-66,18 Z", C.skin);
    P(h, "M-4,-30 C8,-22 12,-8 8,4 M-20,-30 C-8,-22 -6,-8 -10,6", "none", { w: 2.4 });
    P(h, "M30,-26 C22,-40 -2,-44 -12,-34 C-16,-28 -10,-22 0,-22 C12,-22 22,-20 30,-14 Z", C.skin);
    return h;
  }

  // ---------------------------------------------------------------- decorations
  function sparkle(parent, cx, cy, r, fill = C.ink) {
    const k = r * 0.16;
    return P(parent, `M${cx},${cy - r} C${cx + k},${cy - k} ${cx + k},${cy - k} ${cx + r},${cy} C${cx + k},${cy + k} ${cx + k},${cy + k} ${cx},${cy + r} C${cx - k},${cy + k} ${cx - k},${cy + k} ${cx - r},${cy} C${cx - k},${cy - k} ${cx - k},${cy - k} ${cx},${cy - r} Z`, fill, { w: 0 });
  }
  function dust(parent, cx, cy, rx, ry, n = 260, seed = 1, fill = C.ink) {
    const grp = g(parent);
    let s = seed;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.55);
      el("circle", { cx: (cx + Math.cos(a) * rx * d).toFixed(1), cy: (cy + Math.sin(a) * ry * d).toFixed(1), r: (1 + rnd() * 1.6).toFixed(1), fill, opacity: (0.5 + 0.5 * (1 - d)).toFixed(2) }, grp);
    }
    return grp;
  }
  function grid(parent, x, y, w, h, step = 32, stroke = C.ink) {
    let d = "";
    for (let i = 0; i <= w; i += step) d += `M${x + i},${y} V${y + h} `;
    for (let j = 0; j <= h; j += step) d += `M${x},${y + j} H${x + w} `;
    return P(g(parent), d, "none", { stroke, w: 1.8 });
  }

  global.Art = { C, LW, el, g, P, circle, rrect, ik, arm, technician, customer, handshake, handOpen, handGrip, handPoint, sparkle, dust, grid };
})(window);
