// Character and prop art for the Hausman explainer.
// Style: flat illustration with thin dark outlines (reference: editorial flat style),
// figures cropped at the hips, expressive hands, texture details (dust, squiggles, grid, sparkles).
(function (global) {
  const NS = "http://www.w3.org/2000/svg";
  const C = {
    ink: "#1d1d1b", gold: "#E8C85E", goldDeep: "#C9A63B", goldLight: "#F4E3A1",
    white: "#ffffff", skin: "#ffffff", skinShade: "#ffffff", cream: "#FFF6DC", grey: "#3b3b3b",
  };
  const LW = 4.5;

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

  // ---------------------------------------------------------------- hands
  // Open hand (palm towards viewer), wrist at (0,0), fingers pointing up (-y). Scale/rotate from outside.
  function handOpen(parent, skin = C.skin) {
    const h = g(parent);
    P(h, "M-34,0 C-38,-30 -40,-60 -36,-84 L-36,-110 C-36,-124 -16,-124 -16,-110 L-16,-86 L-10,-124 C-9,-138 11,-138 11,-124 L10,-86 L16,-118 C18,-132 38,-130 36,-116 L30,-82 L40,-104 C46,-117 64,-110 60,-96 L46,-56 C42,-36 40,-18 34,0 Z", skin);
    P(h, "M-36,-84 C-30,-74 -16,-70 -4,-70", "none", { w: 3 });
    return h;
  }
  // Fist / grip, wrist at (0,0), holding direction up
  function handGrip(parent, skin = C.skin) {
    const h = g(parent);
    P(h, "M-34,0 C-40,-24 -40,-54 -28,-70 C-14,-88 24,-88 38,-70 C50,-54 48,-24 40,0 Z", skin);
    P(h, "M-24,-62 C-14,-70 6,-70 16,-62 M-20,-46 C-10,-54 8,-54 18,-46", "none", { w: 3 });
    P(h, "M-34,-40 C-50,-46 -52,-66 -36,-74", skin);
    return h;
  }
  // Pointing hand, wrist at (0,0), index finger pointing up
  function handPoint(parent, skin = C.skin) {
    const h = g(parent);
    P(h, "M-34,0 C-40,-24 -40,-52 -30,-68 C-20,-80 -6,-82 4,-80 L4,-130 C4,-144 24,-144 24,-130 L24,-76 C36,-72 44,-60 44,-44 C44,-26 42,-12 38,0 Z", skin);
    P(h, "M-14,-62 C-4,-66 10,-64 20,-58 M-12,-46 C0,-50 12,-48 22,-42", "none", { w: 3 });
    return h;
  }

  // ---------------------------------------------------------------- limbs
  // An arm as an outlined tube through [shoulder, elbow, wrist]; the hand is attached along the forearm direction.
  function limb(parent, pts, width, skin, o = {}) {
    const d = "M" + pts.map(p => p.join(",")).join(" L");
    const grp = g(parent);
    P(grp, d, "none", { stroke: C.ink, w: width + 2 * LW });
    P(grp, d, "none", { stroke: skin, w: width });
    if (o.sleeve) {
      // sleeve covers the shoulder and the first part of the upper arm
      const [s, e] = pts, k = o.sleeve;
      const sd = `M${s[0]},${s[1]} L${s[0] + (e[0] - s[0]) * k},${s[1] + (e[1] - s[1]) * k}`;
      P(grp, sd, "none", { stroke: C.ink, w: width + 2 * LW + 6 });
      P(grp, sd, "none", { stroke: o.sleeveColor || C.ink, w: width + 6 });
    }
    const [e, w] = [pts[pts.length - 2], pts[pts.length - 1]];
    const ang = Math.atan2(w[1] - e[1], w[0] - e[0]) * 180 / Math.PI + 90;
    const hand = g(grp, { transform: `translate(${w[0]},${w[1]}) rotate(${ang + (o.handRot || 0)})` });
    (o.hand || handOpen)(hand, skin);
    return { grp, hand };
  }

  // ---------------------------------------------------------------- technician
  // Hausman technician, 3/4 bust cropped at the hips. Origin: centre of the chest.
  function technician(parent, o = {}) {
    const root = g(parent);
    const back = g(root), front = g(root);
    const pose = o.pose || "tablet";
    // --- left arm (viewer's left), behind the torso: relaxed, hand on hip
    const armL = limb(back, [[-118, 30], [-180, 190], [-125, 330]], 52, C.skin, { sleeve: 0.4, hand: handGrip, handRot: 0 });
    // --- torso: black work shirt, collar, gold piping and logo
    P(front, "M-142,345 L-148,120 C-152,50 -115,-5 -58,-26 L0,-8 L58,-26 C115,-5 152,50 148,120 L142,345 Z", C.ink);
    P(front, "M-58,-26 L-20,30 L0,-8 L20,30 L58,-26", "none", { stroke: C.gold, w: 3.5 });
    P(front, "M-58,-26 C-48,-18 -20,-6 0,-8 C20,-6 48,-18 58,-26 L46,-48 C30,-36 10,-28 0,-28 C-10,-28 -30,-36 -46,-48 Z", C.ink);
    P(front, "M-60,-28 C-45,-13 -15,0 0,-3 C15,0 45,-13 60,-28", "none", { stroke: C.gold, w: 3 });
    P(front, "M0,30 L0,345", "none", { stroke: C.gold, w: 3, dash: "1 14" });
    // original Hausman emblem (1:1 from the logo file) on the chest
    el("image", { href: "assets/emblem.png", x: -112, y: 52, width: 80, height: 80 }, front);
    // --- neck + head
    P(front, "M-32,-34 C-32,-60 -28,-80 -28,-100 L28,-100 C28,-80 32,-60 32,-34 C18,-24 -18,-24 -32,-34 Z", C.skinShade);
    const head = g(front, { transform: "translate(0,24)" });
    P(head, "M-82,-230 C-86,-290 -60,-345 0,-345 C60,-345 86,-290 82,-230 C84,-180 70,-125 30,-108 C15,-102 -15,-102 -30,-108 C-70,-125 -84,-180 -82,-230 Z", C.skin);
    P(head, "M-82,-240 C-100,-250 -106,-215 -86,-205", C.skin);
    P(head, "M82,-240 C100,-250 106,-215 86,-205", C.skin);
    // clean-shaven, friendly open smile
    P(head, "M-26,-160 C-14,-138 14,-138 26,-160 Z", C.ink, { w: 3.5 });
    P(head, "M-18,-157 C-8,-152 8,-152 18,-157 L16,-150 C6,-147 -6,-147 -16,-150 Z", C.white, { w: 0 });
    P(head, "M4,-215 C14,-200 16,-186 2,-178", "none", { w: 3.5 });
    circle(head, -30, -228, 5, C.ink, { w: 0 }); circle(head, 30, -228, 5, C.ink, { w: 0 });
    P(head, "M-46,-252 C-38,-262 -22,-262 -12,-254 M12,-254 C22,-262 38,-262 46,-252", "none", { w: 4 });
    P(head, "M-86,-250 C-92,-300 -70,-350 -8,-354 C24,-366 64,-358 78,-336 C92,-316 92,-280 86,-250 C80,-270 68,-290 50,-296 C30,-304 10,-298 -8,-300 C-30,-302 -56,-292 -70,-276 C-78,-266 -84,-256 -86,-250 Z", C.ink);
    // --- right arm (viewer's right) in front of the torso, pose-dependent
    let armR;
    if (pose === "tablet") armR = limb(front, [[120, 30], [185, 150], [95, 200]], 52, C.skin, { sleeve: 0.4, hand: handOpen, handRot: -100 });
    else if (pose === "wave") armR = limb(front, [[120, 30], [215, -40], [245, -150]], 52, C.skin, { sleeve: 0.4, hand: handOpen, handRot: 15 });
    else if (pose === "point") armR = limb(front, [[120, 30], [215, 20], [300, -60]], 52, C.skin, { sleeve: 0.4, hand: handPoint, handRot: 0 });
    else if (pose === "tool") armR = limb(front, [[120, 30], [215, 10], [290, -40]], 52, C.skin, { sleeve: 0.4, hand: handGrip, handRot: 0 });
    else if (pose === "present") armR = limb(front, [[120, 30], [200, 110], [300, 70]], 52, C.skin, { sleeve: 0.4, hand: handOpen, handRot: 90 });
    return { root, head, armL: armL.grp, armR: armR.grp, handR: armR.hand, handL: armL.hand };
  }

  // ---------------------------------------------------------------- customer
  // Customer: shoulder-length hair, round glasses, cream blouse with gold dots. Origin at chest centre.
  function customer(parent, o = {}) {
    const root = g(parent);
    const back = g(root), front = g(root);
    const pose = o.pose || "think";
    P(back, "M-110,-60 C-120,-150 -100,-310 0,-320 C100,-310 120,-150 110,-60 C80,-40 -80,-40 -110,-60 Z", C.ink);
    const armL = limb(back, [[-112, 30], [-172, 190], [-120, 330]], 48, C.skin, { sleeve: 0.4, sleeveColor: C.cream, hand: handGrip });
    // torso: cream blouse with gold dots
    P(front, "M-136,345 L-144,120 C-146,50 -112,-5 -55,-26 L0,-6 L55,-26 C112,-5 146,50 144,120 L136,345 Z", C.cream);
    [[-100, 60], [-60, 130], [-110, 200], [-40, 260], [20, 120], [60, 60], [100, 150], [80, 240], [0, 320], [110, 300], [-70, 320], [30, 200]]
      .forEach(([x, y]) => circle(front, x, y, 7, C.gold, { w: 0 }));
    P(front, "M-55,-26 C-35,0 -15,14 0,10 C15,14 35,0 55,-26", "none");
    // neck + head
    P(front, "M-30,-34 C-30,-60 -26,-80 -26,-100 L26,-100 C26,-80 30,-60 30,-34 C16,-24 -16,-24 -30,-34 Z", C.skinShade);
    const head = g(front, { transform: "translate(0,24)" });
    P(head, "M-80,-230 C-84,-290 -58,-342 0,-342 C58,-342 84,-290 80,-230 C82,-180 66,-128 28,-110 C14,-104 -14,-104 -28,-110 C-66,-128 -82,-180 -80,-230 Z", C.skin);
    P(head, "M-80,-240 C-98,-250 -104,-215 -84,-205", C.skin);
    P(head, "M80,-240 C98,-250 104,-215 84,-205", C.skin);
    P(head, "M-20,-150 C-10,-138 10,-138 20,-150", "none", { w: 3.5 });
    P(head, "M4,-214 C14,-200 16,-186 2,-180", "none", { w: 3.5 });
    circle(head, -30, -226, 5, C.ink, { w: 0 }); circle(head, 30, -226, 5, C.ink, { w: 0 });
    P(head, "M-46,-252 C-38,-260 -22,-260 -12,-254 M12,-254 C22,-260 38,-260 46,-252", "none", { w: 3.5 });
    circle(head, -32, -226, 28, "none", { w: 4 }); circle(head, 32, -226, 28, "none", { w: 4 });
    P(head, "M-4,-228 C-2,-234 2,-234 4,-228 M-60,-230 L-82,-236 M60,-230 L82,-236", "none", { w: 4 });
    P(head, "M-84,-240 C-90,-300 -60,-350 0,-352 C60,-350 90,-300 84,-240 C80,-262 70,-290 46,-300 C30,-306 10,-300 0,-292 C-20,-306 -50,-306 -66,-286 C-76,-274 -82,-258 -84,-240 Z", C.ink);
    P(head, "M-84,-240 C-100,-200 -104,-120 -90,-60 C-80,-80 -72,-120 -72,-180", C.ink);
    P(head, "M84,-240 C100,-200 104,-120 90,-60 C80,-80 72,-120 72,-180", C.ink);
    let armR;
    if (pose === "think") armR = limb(front, [[114, 30], [160, 170], [72, -20]], 48, C.skin, { sleeve: 0.4, sleeveColor: C.cream, hand: handGrip, handRot: -25 });
    else if (pose === "wave") armR = limb(front, [[114, 30], [205, -40], [235, -150]], 48, C.skin, { sleeve: 0.4, sleeveColor: C.cream, hand: handOpen, handRot: 15 });
    else armR = limb(front, [[114, 30], [195, 110], [290, 70]], 48, C.skin, { sleeve: 0.4, sleeveColor: C.cream, hand: handOpen, handRot: 90 });
    return { root, head, armL: armL.grp, armR: armR.grp, handR: armR.hand };
  }

  // ---------------------------------------------------------------- textures / decorations
  function sparkle(parent, cx, cy, r, fill = C.ink) {
    const k = r * 0.18;
    return P(parent, `M${cx},${cy - r} C${cx + k},${cy - k} ${cx + k},${cy - k} ${cx + r},${cy} C${cx + k},${cy + k} ${cx + k},${cy + k} ${cx},${cy + r} C${cx - k},${cy + k} ${cx - k},${cy + k} ${cx - r},${cy} C${cx - k},${cy - k} ${cx - k},${cy - k} ${cx},${cy - r} Z`, fill, { w: 0 });
  }
  // stipple dust cloud: random dots with density falling off from the centre; deterministic
  function dust(parent, cx, cy, rx, ry, n = 260, seed = 1, fill = C.ink) {
    const grp = g(parent);
    let s = seed;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.55);
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: (1.2 + rnd() * 1.8).toFixed(1), fill, opacity: 0.55 + 0.45 * (1 - d) }, grp);
    }
    return grp;
  }
  function grid(parent, x, y, w, h, step = 32, stroke = C.ink) {
    const grp = g(parent);
    let d = "";
    for (let i = 0; i <= w; i += step) d += `M${x + i},${y} V${y + h} `;
    for (let j = 0; j <= h; j += step) d += `M${x},${y + j} H${x + w} `;
    P(grp, d, "none", { stroke, w: 2.2 });
    return grp;
  }
  // thin decorative squiggle / arc lines
  function squiggle(parent, d, stroke = C.ink) { return P(parent, d, "none", { stroke, w: 2.6 }); }

  // ---------------------------------------------------------------- props
  function tablet(parent, w = 170, h = 230) {
    const t = g(parent);
    rrect(t, -w / 2, -h / 2, w, h, 16, C.white);
    rrect(t, -w / 2 + 16, -h / 2 + 18, w - 32, h - 50, 8, C.ink, { w: 0 });
    circle(t, 0, h / 2 - 16, 6, C.ink, { w: 0 });
    return t;
  }
  function wrench(parent) {
    const t = g(parent);
    P(t, "M0,0 L0,-150 M-18,-160 A26,26 0 1 1 18,-160 L10,-140 L-10,-140 Z", C.white, { w: 4.5 });
    P(t, "M-12,0 L12,0 L12,-120 L-12,-120 Z", C.white, { w: 4.5 });
    return t;
  }

  global.Art = { C, LW, el, g, P, circle, rrect, limb, technician, customer, handOpen, handGrip, handPoint, sparkle, dust, grid, squiggle, tablet, wrench };
})(window);
