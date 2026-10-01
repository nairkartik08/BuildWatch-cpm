import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

declare global {
  interface Window {
    THREE: any;
  }
}

export const LandingPage: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [late, setLate] = useState(false);
  const [conf, setConf] = useState(92);
  const [fin, setFin] = useState(0);
  const [crit, setCrit] = useState(9);
  const [note, setNote] = useState('Live demo: drag your mouse to tilt the site. Scroll to orbit.');
  const [btnText, setBtnText] = useState('⚡ Inject steel delay');
  const pathColRef = useRef<any>(null);
  const pulseRef = useRef(0);

  useEffect(() => {
    // Dynamically load Three.js if not present
    let script: HTMLScriptElement | null = null;
    let animId: number;

    const initThree = () => {
      const THREE = window.THREE;
      if (!THREE || !canvasContainerRef.current) return;

      const T = THREE, PI = Math.PI, P3 = (x: number, y: number, z: number) => new T.Vector3(x, y, z), BY = 0.12, FH = 1.1, U: any[] = [];
      const R = new T.WebGLRenderer({ antialias: true });
      R.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      R.shadowMap.enabled = true;
      R.shadowMap.type = T.PCFSoftShadowMap;
      
      const container = canvasContainerRef.current;
      container.innerHTML = '';
      R.domElement.style.position = 'fixed';
      R.domElement.style.inset = '0';
      R.domElement.style.width = '100%';
      R.domElement.style.height = '100%';
      R.domElement.style.zIndex = '0';
      R.domElement.style.display = 'block';
      container.appendChild(R.domElement);

      const S = new T.Scene();
      S.background = new T.Color(0x0b0f16);
      S.fog = new T.Fog(0x0b0f16, 60, 140);
      const C = new T.OrthographicCamera(-1, 1, 1, -1, -200, 300), TG = P3(0, 2, 0);
      const mc: Record<number, any> = {}, M = (c: number) => mc[c] || (mc[c] = new T.MeshLambertMaterial({ color: c }));
      const UB = new T.BoxGeometry(1, 1, 1), CG = new T.CylinderGeometry(1, 1, 1, 10), WG = CG.clone().rotateZ(PI / 2), ZA = P3(0, 0, 1);

      function box(p: any, w: number, h: number, d: number, m: any, x: number, y: number, z: number) {
        const o = new T.Mesh(UB, m);
        o.scale.set(w, h, d);
        o.position.set(x, y + h / 2, z);
        o.castShadow = o.receiveShadow = true;
        p.add(o);
        return o;
      }

      function bar(p: any, a: any, b: any, r: number, m: any) {
        const o = new T.Mesh(UB, m), d = b.clone().sub(a);
        o.scale.set(r, r, d.length());
        o.position.copy(a).add(b).multiplyScalar(0.5);
        o.quaternion.setFromUnitVectors(ZA, d.normalize());
        o.castShadow = true;
        p.add(o);
        return o;
      }

      function wheel(p: any, x: number, y: number, z: number, r: number) {
        const o = new T.Mesh(WG, M(0x15181d));
        o.scale.set(0.12, r, r);
        o.position.set(x, y, z);
        p.add(o);
      }

      const cells = [...Array(16)].map(() => Math.random() < 0.16);
      function mkTex(e: number) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const x = c.getContext('2d')!;
        x.fillStyle = e ? '#000' : '#e6e3dc';
        x.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 16; i++) {
          const cx = (i % 4) * 32, cy = (i >> 2) * 32;
          x.fillStyle = e ? (cells[i] ? '#b9803a' : '#000') : (cells[i] ? '#8a7a5a' : '#2e3946');
          x.fillRect(cx + 5, cy + 7, 22, 17);
        }
        const t = new T.CanvasTexture(c);
        t.wrapS = t.wrapT = T.RepeatWrapping;
        return t;
      }

      const TX = mkTex(0), TE = mkTex(1);
      function fac(g: any, w: number, h: number, d: number, n: number, c: number, y: number) {
        const ge = new T.BoxGeometry(w, h, d), uv = ge.attributes.uv as any, Ud = [d, d, 0, 0, w, w];
        for (let f = 0; f < 6; f++) {
          if (f === 2 || f === 3) continue;
          const su = Math.max(1, Math.round(Ud[f] / 1.15)) / 4;
          for (let i = 0; i < 4; i++) {
            const k = f * 4 + i;
            uv.setXY(k, uv.getX(k) * su, uv.getY(k) * n / 4);
          }
        }
        const o = new T.Mesh(ge, new T.MeshLambertMaterial({ color: c, map: TX, emissive: 0xffffff, emissiveMap: TE, emissiveIntensity: 0.55 }));
        o.position.y = y + h / 2;
        o.castShadow = o.receiveShadow = true;
        g.add(o);
      }

      S.add(new T.HemisphereLight(0x8196b8, 0x1a2029, 0.75));
      const sun = new T.DirectionalLight(0xffd6a6, 0.95);
      sun.position.set(-6, 22, 18);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 70 });
      sun.shadow.bias = -0.0006;
      S.add(sun);

      const gp = new T.Mesh(new T.PlaneGeometry(300, 300), M(0x141a23));
      gp.rotation.x = -PI / 2;
      gp.position.y = -0.15;
      gp.receiveShadow = true;
      S.add(gp);

      box(S, 42, 0.15, 42, M(0x1c232d), 0, -0.15, 0);
      [-10, 0, 10].forEach(r => {
        box(S, 42, 0.05, 3, M(0x262b33), 0, 0, r);
        box(S, 3, 0.05, 42, M(0x262b33), r, 0, 0);
      });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(S, 7.4, 0.12, 7.4, M(0x2f363f), sx * 5, 0, sz * 5);

      function tower(x: number, z: number, w: number, d: number, n: number, o: any = {}) {
        const g = new T.Group();
        g.position.set(x, BY, z);
        S.add(g);
        box(g, w + 0.3, 0.16, d + 0.3, M(0x7d8186), 0, 0, 0);
        const fl: any[] = [];
        for (let i = 0; i < n; i++) {
          const f = new T.Group();
          f.position.y = 0.16 + i * FH;
          g.add(f);
          box(f, w, 0.12, d, M(0x9a9b98), 0, 0, 0);
          const nx = Math.max(2, Math.round(w / 1.4) + 1), nz = Math.max(2, Math.round(d / 1.4) + 1);
          for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) if (a === 0 || b === 0 || a === nx - 1 || b === nz - 1)
            box(f, 0.16, FH - 0.12, 0.16, M(0x858a8d), -w / 2 + 0.08 + a * (w - 0.16) / (nx - 1), 0.12, -d / 2 + 0.08 + b * (d - 0.16) / (nz - 1));
          fl.push(f);
        }
        if (o.clad) fac(g, w - 0.1, o.clad * FH, d - 0.1, o.clad, o.c || 0xaeb3b8, 0.16);
        return { g, fl };
      }

      function doneBuilding(x: number, z: number, w: number, d: number, n: number, c: number) {
        const g = new T.Group();
        g.position.set(x, BY, z);
        S.add(g);
        box(g, w + 0.2, 0.12, d + 0.2, M(0x7d8186), 0, 0, 0);
        fac(g, w, n * FH, d, n, c, 0.12);
        box(g, w + 0.14, 0.14, d + 0.14, M(0x555b63), 0, 0.12 + n * FH, 0);
      }

      doneBuilding(-7, -6.9, 3, 3, 7, 0xc2bdb0);
      tower(-3.4, -6.9, 3, 3, 6, { clad: 3, c: 0x8f98a3 });
      const b3 = tower(-6.2, -3.1, 3.6, 2.4, 5);
      tower(4, -6.5, 4.2, 3.4, 5);
      doneBuilding(3.5, 3.5, 3, 3, 3, 0x9a9fa6);
      doneBuilding(7, 3.5, 2.6, 3, 4, 0xb4a792);
      doneBuilding(-7, 3.3, 2.8, 2.6, 2, 0xb3b0a6);
      doneBuilding(-3.3, 3.4, 3, 2.8, 3, 0x8c97a4);

      const CY = M(0xd2a02a), CD = M(0x3b424b);
      function crane(x: number, z: number, H: number, L: number, base: number, amp: number, ph: number) {
        const g = new T.Group();
        g.position.set(x, BY, z);
        S.add(g);
        box(g, 1.7, 0.22, 1.7, M(0x80838a), 0, 0, 0);
        const s = 0.27, cs = [[-s, -s], [s, -s], [s, s], [-s, s]];
        cs.forEach(c => bar(g, P3(c[0], 0.22, c[1]), P3(c[0], H, c[1]), 0.06, CY));
        for (let y = 0.22, i = 0; y + 0.7 <= H; y += 0.7, i++) for (let k = 0; k < 4; k++) {
          const a = cs[k], b = cs[(k + 1) % 4], f = (i + k) % 2;
          bar(g, P3(a[0], y + (f ? 0.7 : 0), a[1]), P3(b[0], y + (f ? 0 : 0.7), b[1]), 0.035, CY);
        }
        const t = new T.Group();
        t.position.y = H;
        g.add(t);
        box(t, 0.8, 0.25, 0.8, CD, 0, 0, 0);
        bar(t, P3(0.4, 0.25, -0.15), P3(L, 0.25, -0.15), 0.05, CY);
        bar(t, P3(0.4, 0.25, 0.15), P3(L, 0.25, 0.15), 0.05, CY);
        bar(t, P3(0.4, 0.75, 0), P3(L - 0.8, 0.75, 0), 0.05, CY);
        bar(t, P3(L - 0.8, 0.75, 0), P3(L, 0.25, 0), 0.05, CY);
        bar(t, P3(-0.4, 0.25, -0.15), P3(-L * 0.3, 0.25, -0.15), 0.05, CY);
        box(t, 0.8, 0.55, 0.5, M(0x5d636b), -L * 0.3 + 0.5, 0, 0);
        bar(t, P3(0, 0.25, 0), P3(0, 1.5, 0), 0.08, CY);
        bar(t, P3(0, 1.5, 0), P3(L * 0.75, 0.75, 0), 0.025, CD);
        const tr = new T.Group();
        tr.position.y = 0.15;
        t.add(tr);
        const cb = box(tr, 0.03, 1, 0.03, CD, 0, 0, 0), hk = new T.Group();
        tr.add(hk);
        box(hk, 0.14, 0.18, 0.14, M(0xd9651f), 0, -0.1, 0);
        U.push((tm: number) => {
          t.rotation.y = base + Math.sin(tm * 0.12 + ph) * amp;
          tr.position.x = L * (0.5 + 0.28 * Math.sin(tm * 0.2 + ph));
          const l = 3.9 + 2.1 * Math.sin(tm * 0.35 + ph);
          cb.scale.y = l;
          cb.position.y = -l / 2;
          hk.position.y = -l - 0.1;
        });
      }
      crane(-3, -3.5, 12, 7.5, 0.75 * PI, 0.95, 0);
      crane(7.5, -7.3, 12.5, 7, 1.25 * PI, 0.8, 2);

      function truck(k: string, c: number) {
        const g = new T.Group();
        box(g, 0.55, 0.1, 1.7, M(0x2a2f36), 0, 0.2, 0);
        box(g, 0.58, 0.42, 0.5, M(c), 0, 0.3, 0.6);
        [[-0.3, 0.55], [0.3, 0.55], [-0.3, -0.4], [0.3, -0.4], [-0.3, -0.7], [0.3, -0.7]].forEach(w => wheel(g, w[0], 0.17, w[1], 0.17));
        if (k === 'dump') box(g, 0.66, 0.34, 1.0, M(0xc9781f), 0, 0.32, -0.3);
        if (k === 'mix') {
          const d = new T.Mesh(new T.CylinderGeometry(0.16, 0.3, 1.05, 10).rotateX(PI / 2), M(0xd0d3d4));
          d.position.set(0, 0.85, -0.3);
          g.add(d);
          (g as any).drum = d;
        }
        return g;
      }

      function loop(x0: number, z0: number, x1: number, z1: number, r: number, rev?: number) {
        const pts: [number, number][] = [];
        [[x1 - r, z0 + r, -PI / 2], [x1 - r, z1 - r, 0], [x0 + r, z1 - r, PI / 2], [x0 + r, z0 + r, PI]].forEach(([cx, cz, a0]) => {
          for (let i = 0; i <= 6; i++) {
            const a = a0 + i / 6 * PI / 2;
            pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
          }
        });
        if (rev) pts.reverse();
        const cum = [0];
        pts.forEach((p, i) => {
          const q = pts[(i + 1) % pts.length];
          cum.push(cum[i] + Math.hypot(q[0] - p[0], q[1] - p[1]));
        });
        return { pts, cum, len: cum[pts.length] };
      }

      function drive(g: any, L: any, s0: number, sp: number) {
        g.position.y = 0.05;
        S.add(g);
        g.traverse((o: any) => o.castShadow = true);
        U.push((tm: number) => {
          const s = (((s0 + sp * tm) % L.len) + L.len) % L.len;
          let i = 0;
          while (L.cum[i + 1] < s) i++;
          const p = L.pts[i], q = L.pts[(i + 1) % L.pts.length], f = (s - L.cum[i]) / (L.cum[i + 1] - L.cum[i]);
          g.position.x = p[0] + (q[0] - p[0]) * f;
          g.position.z = p[1] + (q[1] - p[1]) * f;
          g.rotation.y = Math.atan2(q[0] - p[0], q[1] - p[1]);
          if (g.drum) g.drum.rotation.z = tm * 1.5;
        });
      }

      const LA = loop(0.75, 0.75, 9.25, 9.25, 1);
      const LB = loop(0.75, -9.25, 9.25, -0.75, 1);
      const LO = loop(-10.75, -10.75, 10.75, 10.75, 1.3, 1);
      drive(truck('dump', 0xd9a52b), LA, 0, 1.4);
      drive(truck('mix', 0xd9a52b), LB, 0, 1.4);
      drive(truck('dump', 0xd9a52b), LO, 0, 1.9);
      drive(truck('mix', 0xd9a52b), LO, LO.len * 0.5, 1.9);

      U.push((tm: number) => {
        const lc = Math.min(1 + Math.floor((tm / 11) % 7), 5);
        b3.fl.forEach((f: any, i: number) => {
          const tg = i < lc ? 1 : 0, s = f.scale.y;
          f.scale.y = Math.max(0.001, s + (tg - s) * (tg ? 0.03 : 0.15));
          f.visible = f.scale.y > 0.01;
        });
      });

      const pathCol = new T.Color(0x35d07f);
      pathColRef.current = pathCol;
      const pm = new T.MeshBasicMaterial({ color: pathCol });
      const nodes: any[] = [];
      const ptsPath = [P3(-7, 9.5, -6.9), P3(-3.4, 8.5, -6.9), P3(4, 8, -6.5), P3(7, 8.5, 1), P3(7, 7.5, 3.5), P3(3.5, 5.5, 3.5)];
      for (let i = 0; i < ptsPath.length; i++) {
        if (i) bar(S, ptsPath[i - 1], ptsPath[i], 0.09, pm);
        const n = new T.Mesh(new T.SphereGeometry(0.3, 16, 12), pm);
        n.position.copy(ptsPath[i]);
        S.add(n);
        nodes.push(n);
        const l = new T.Mesh(UB, new T.MeshBasicMaterial({ color: 0x6d7b90, transparent: true, opacity: 0.35 }));
        l.scale.set(0.03, ptsPath[i].y, 0.03);
        l.position.set(ptsPath[i].x, ptsPath[i].y / 2, ptsPath[i].z);
        S.add(l);
      }
      const ring = new T.Mesh(new T.TorusGeometry(1, 0.03, 6, 48), pm);
      ring.rotation.x = PI / 2;
      ring.position.set(0, 0.3, 0);
      S.add(ring);
      const pk = new T.Mesh(new T.SphereGeometry(0.22, 12, 8), new T.MeshBasicMaterial({ color: 0xffffff }));
      S.add(pk);

      U.push((tm: number) => {
        nodes.forEach((n, i) => n.scale.setScalar(1 + 0.25 * Math.sin(tm * 3 + i) + pulseRef.current * 0.6));
        pulseRef.current *= 0.96;
        ring.scale.setScalar((tm * 4) % 22 + 0.5);
        ring.material = pm;
        const k = (tm * 0.12) % 1, seg = k * (ptsPath.length - 1), i = Math.min(Math.floor(seg), ptsPath.length - 2);
        pk.position.lerpVectors(ptsPath[i], ptsPath[i + 1], seg - i);
      });

      let mx = 0, my = 0, az0 = 0, el0 = 0, sc = 0, scT = 0;
      const onPointerMove = (e: PointerEvent) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
      };
      const onScroll = () => {
        scT = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('scroll', onScroll, { passive: true });

      function rs() {
        const w = window.innerWidth, h = window.innerHeight, a = w / h;
        R.setSize(w, h, false);
        let vh = 28, vw = vh * a;
        if (vw < 40) { vw = 40; vh = vw / a; }
        const sh = a > 1.3 ? vw * 0.16 : 0;
        Object.assign(C, { left: -vw / 2 - sh, right: vw / 2 - sh, top: vh / 2, bottom: -vh / 2 });
        C.updateProjectionMatrix();
      }
      window.addEventListener('resize', rs);
      rs();

      const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.4 : 1;
      let tm = 0, last = performance.now();

      function frame(n: number) {
        animId = requestAnimationFrame(frame);
        const dt = Math.min((n - last) / 1000, 0.1);
        last = n;
        tm += dt * RM;
        sc += (scT - sc) * 0.06;
        az0 += (mx * 0.5 - az0) * 0.05;
        el0 += (-my * 0.15 - el0) * 0.05;
        const az = PI / 4 + az0 + sc * PI * 1.4, el = 0.6 + el0 + sc * 0.25, D = 80;
        C.position.set(TG.x + Math.sin(az) * Math.cos(el) * D, TG.y + Math.sin(el) * D, TG.z + Math.cos(az) * Math.cos(el) * D);
        C.lookAt(TG);
        C.zoom = 1 + sc * 0.5;
        C.updateProjectionMatrix();
        U.forEach(f => f(tm));
        R.render(S, C);
      }
      frame(last);

      return () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', rs);
        cancelAnimationFrame(animId);
      };
    };

    if (!window.THREE) {
      script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => initThree();
      document.head.appendChild(script);
    } else {
      initThree();
    }

    return () => {
      if (script && script.parentNode) script.parentNode.removeChild(script);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleInjectDelay = () => {
    const nextLate = !late;
    setLate(nextLate);
    setConf(nextLate ? 41 : 92);
    setFin(nextLate ? 9 : 0);
    setCrit(nextLate ? 14 : 9);
    setNote(nextLate ? 'Steel +6d → critical path switched, 5 tasks hit. Click again to apply recovery.' : 'Recovered: expedite steel saves 4 days.');
    setBtnText(nextLate ? '🛠️ Apply recovery' : '⚡ Inject steel delay');
    if (pathColRef.current) {
      pathColRef.current.setHex(nextLate ? 0xff3b3b : 0x35d07f);
      pulseRef.current = 1;
    }
  };

  const histHeights = [4, 7, 12, 20, 32, 46, 60, 72, 80, 66, 50, 36, 24, 15, 9, 5];

  return (
    <div className="relative min-h-screen text-[#e9edf3] selection:bg-[#ffb020] selection:text-black">
      {/* Three.js canvas container */}
      <div ref={canvasContainerRef} className="fixed inset-0 pointer-events-none" />

      {/* Shade gradient overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-r from-[#0b0f16]/95 via-[#0b0f16]/40 to-transparent" />

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 py-5 sticky top-0 backdrop-blur-md bg-[#0b0f16]/45 border-b border-white/5">
        <div className="font-extrabold text-lg tracking-wider flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#ff4d4d] animate-ping" />
          Critical Path Radar
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#9aa6b8]">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <Link to="/app" className="bg-[#121823]/80 border border-white/10 px-4 py-2 rounded-lg text-white font-medium hover:border-[#ffb020] transition-colors">
            Launch Radar App →
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col justify-center max-w-2xl py-12">
          <span className="inline-block px-3.5 py-1.5 border border-white/10 rounded-full text-xs text-[#ffb020] bg-[#121823]/70 w-fit tracking-widest uppercase mb-4">
            Minithon 4.0 · Construction Delay Risk
          </span>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
            See the delay <span className="bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] bg-clip-text text-transparent">before it happens.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#9aa6b8] leading-relaxed mb-8">
            A Gantt chart shows when tasks happen. Critical Path Radar shows which delays actually threaten your deadline — and the fastest way to win the days back.
          </p>

          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleInjectDelay}
              className="px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] text-[#160a00] hover:-translate-y-0.5 transition-transform shadow-lg shadow-[#ff4d4d]/20"
            >
              {btnText}
            </button>
            <Link
              to="/app"
              className="px-6 py-3.5 rounded-xl font-bold bg-[#121823]/80 text-white border border-white/10 hover:border-[#ffb020] hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Open App Dashboard ➔
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            <div className="bg-[#121823]/75 border border-white/10 rounded-2xl p-4 min-w-[140px] backdrop-blur-md">
              <b className={`text-3xl font-extrabold tracking-tight block ${late ? 'text-[#ff4d4d]' : 'text-[#35d07f]'} transition-colors`}>
                {conf}%
              </b>
              <small className="text-xs text-[#9aa6b8]">on-time confidence</small>
            </div>
            <div className="bg-[#121823]/75 border border-white/10 rounded-2xl p-4 min-w-[140px] backdrop-blur-md">
              <b className={`text-3xl font-extrabold tracking-tight block ${late ? 'text-[#ff4d4d]' : 'text-white'} transition-colors`}>
                +{fin}d
              </b>
              <small className="text-xs text-[#9aa6b8]">finish vs deadline</small>
            </div>
            <div className="bg-[#121823]/75 border border-white/10 rounded-2xl p-4 min-w-[140px] backdrop-blur-md">
              <b className="text-3xl font-extrabold tracking-tight block text-white">
                {crit}
              </b>
              <small className="text-xs text-[#9aa6b8]">critical tasks</small>
            </div>
          </div>
          <div className="text-xs text-[#ffb020] mt-3 h-5">{note}</div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 border-t border-white/5">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Not a chart. A radar.</h2>
          <p className="text-[#9aa6b8] max-w-xl mb-12">Six engines working on every schedule change, all recalculated live in your browser.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#121823]/70 border border-white/10 rounded-2xl p-6 hover:border-[#ffb020] transition-all hover:-translate-y-1 backdrop-blur-md">
              <div className="text-3xl mb-3">🛣️</div>
              <h3 className="font-bold text-lg mb-2">Live Critical Path</h3>
              <p className="text-sm text-[#9aa6b8] leading-relaxed">Forward and backward pass on every edit. Zero-float tasks glow red, near-critical tasks amber.</p>
            </div>
            <div className="bg-[#121823]/70 border border-white/10 rounded-2xl p-6 hover:border-[#ffb020] transition-all hover:-translate-y-1 backdrop-blur-md">
              <div className="text-3xl mb-3">🎲</div>
              <h3 className="font-bold text-lg mb-2">Monte Carlo Confidence</h3>
              <p className="text-sm text-[#9aa6b8] leading-relaxed">1,000 simulated futures give a real probability of finishing on time, plus a criticality index per task.</p>
            </div>
            <div className="bg-[#121823]/70 border border-white/10 rounded-2xl p-6 hover:border-[#ffb020] transition-all hover:-translate-y-1 backdrop-blur-md">
              <div className="text-3xl mb-3">💥</div>
              <h3 className="font-bold text-lg mb-2">Delay Blast Radius</h3>
              <p className="text-sm text-[#9aa6b8] leading-relaxed">Click a late task and watch every downstream task light up with its days of slip.</p>
            </div>
            <div className="bg-[#121823]/70 border border-white/10 rounded-2xl p-6 hover:border-[#ffb020] transition-all hover:-translate-y-1 backdrop-blur-md">
              <div className="text-3xl mb-3">🧾</div>
              <h3 className="font-bold text-lg mb-2">Delay Attribution</h3>
              <p className="text-sm text-[#9aa6b8] leading-relaxed">Of a 9-day slip: 5 from cement, 3 from rain, 1 from crew. Know who or what caused it.</p>
            </div>
            <div className="bg-[#121823]/70 border border-white/10 rounded-2xl p-6 hover:border-[#ffb020] transition-all hover:-translate-y-1 backdrop-blur-md">
              <div className="text-3xl mb-3">🛠️</div>
              <h3 className="font-bold text-lg mb-2">Recovery Optimizer</h3>
              <p className="text-sm text-[#9aa6b8] leading-relaxed">Crash, expedite, parallelize — ranked by days saved per rupee, one click to apply.</p>
            </div>
            <div className="bg-[#121823]/70 border border-white/10 rounded-2xl p-6 hover:border-[#ffb020] transition-all hover:-translate-y-1 backdrop-blur-md">
              <div className="text-3xl mb-3">🔔</div>
              <h3 className="font-bold text-lg mb-2">Alerts & Collaboration</h3>
              <p className="text-sm text-[#9aa6b8] leading-relaxed">Float thresholds, late deliveries, contractor comments and a shareable report link.</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-20 border-t border-white/5">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">From delay to decision in seconds</h2>
          <p className="text-[#9aa6b8] max-w-xl mb-10">The scripted flow our demo follows.</p>
          <div className="grid gap-4">
            {[
              { num: '1', title: 'Model the project', desc: 'tasks, dependencies, contractors, deliveries' },
              { num: '2', title: 'A delivery slips', desc: 'the critical path switches route live' },
              { num: '3', title: 'Confidence collapses', desc: '92% → 41%, blast radius lights up' },
              { num: '4', title: 'Apply the best move', desc: 'expedite steel, confidence recovers to ~80%' },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-6 bg-[#121823]/70 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                <span className="text-2xl font-extrabold text-[#ffb020] min-w-[32px]">{step.num}</span>
                <div>
                  <b className="text-white block">{step.title}</b>
                  <span className="text-sm text-[#9aa6b8]">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#121823]/70 border border-white/10 rounded-2xl p-6 mt-8 backdrop-blur-md">
            <b className="block text-white mb-4">Finish-date distribution (1,000 runs)</b>
            <div className="flex items-end gap-1.5 h-28 pt-4">
              {histHeights.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-t transition-all duration-700 ${
                    i > 10 ? 'bg-gradient-to-t from-[#8a1b1b] to-[#ff4d4d]' : 'bg-gradient-to-t from-[#1b4d8a] to-[#4da3ff]'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Stop reading schedules. Start beating them.</h2>
          <p className="text-[#9aa6b8] max-w-md mx-auto mb-8">Built in under four hours for Minithon 4.0.</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/app"
              className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-[#ffb020] to-[#ff4d4d] text-[#160a00] hover:-translate-y-0.5 transition-transform shadow-xl shadow-[#ff4d4d]/25 text-lg"
            >
              Launch the Radar App 🚀
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 text-center text-[#9aa6b8] py-8 text-xs border-t border-white/5 bg-[#0b0f16]/90">
        Critical Path Radar · Minithon 4.0 · TechNext 2026
      </footer>
    </div>
  );
};
