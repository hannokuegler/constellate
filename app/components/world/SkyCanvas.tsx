"use client";

// The 3D star map (three.js, no react-three). Loaded only through next/dynamic (ssr: false) after the first paint.
// One Points cloud for all stars, one LineSegments for the core edges, one halo sprite for the focus.
// Failure of any kind (init error, context loss, blank frame in the pixel self-test) calls onFail -> 2D fallback.

import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineSegments,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import { KIND, constellationOf, readPalette, registerSkyController, watchTheme, type Sky, type SkyPalette } from "./sky";

export interface HoverInfo {
  index: number;
  x: number;
  y: number;
}

interface Props {
  sky: Sky;
  motion: boolean;
  initialFocus?: string | null;
  onReady: () => void;
  onFail: (reason: string) => void;
  onHover: (info: HoverInfo | null) => void;
  onSelect: (index: number) => void;
}

const REF_DISTANCE = 290;
const HOME_DISTANCE = 235;
const FOCUS_DISTANCE = 78;
const FLIGHT_MS = 900;

const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aKind;
  attribute float aSeed;
  attribute float aHop;
  attribute float aDelay;
  uniform float uPixelRatio;
  uniform float uTime;
  uniform float uClock;
  uniform float uDim;
  uniform float uTwinkle;
  uniform vec3 uStar;
  uniform vec3 uStarDim;
  uniform vec3 uAmber;
  uniform float uDark;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float lit = aHop > 0.5 ? smoothstep(aDelay, aDelay + 260.0, uClock) : 0.0;
    bool center = aHop > 2.5;
    vec3 base = uStar;
    float alpha = 1.0;
    if (aKind > 0.5 && aKind < 1.5) { base = uStarDim; alpha = 0.75; }              // no mapped neighbour
    else if (aKind > 1.5 && aKind < 2.5) { base = mix(uStar, vec3(0.78, 0.86, 1.0), 0.12 * uDark); alpha = 0.92; } // core gene
    else if (aKind > 2.5 && aKind < 3.5) { base = uStarDim; alpha = 0.5; }          // background gene
    else if (aKind > 3.5) { base = uStarDim; alpha = 0.6; }                         // symptom
    float twinkle = 1.0 - uTwinkle * 0.22 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 1.7) + aSeed * 40.0));
    alpha *= mix(1.0, twinkle, step(0.5, aKind));
    alpha *= mix(aKind > 2.5 ? 0.6 : 0.85, 1.0, uDark);                            // day atlas: dark ink, lighter dust
    alpha *= mix(1.0, 0.28, uDim * (1.0 - lit));
    vec3 litColor = center ? uAmber : uStar;
    vColor = mix(base, litColor, lit);
    vAlpha = mix(alpha, 1.0, lit);
    float size = aSize * mix(1.0, center ? 2.6 : 1.45, lit) * mix(0.68, 1.0, uDark);
    float attenuation = pow(${REF_DISTANCE.toFixed(1)} / max(-mv.z, 1.0), 0.75);
    gl_PointSize = max(size * attenuation, 2.2) * uPixelRatio;
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  uniform float uDark;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a;
    if (uDark > 0.5) {
      float core = smoothstep(0.55, 0.0, d);
      float glow = exp(-d * d * 4.0) * 0.7;
      a = clamp(core + glow, 0.0, 1.0);
    } else {
      a = 1.0 - smoothstep(0.5, 0.95, d);
    }
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

const LINE_VERTEX = /* glsl */ `
  attribute float aHop;
  attribute float aDelay;
  attribute float aLevel;
  uniform float uClock;
  uniform vec3 uStrong;
  uniform vec3 uText;
  uniform vec3 uInferred;
  uniform vec3 uStarDim;
  uniform float uBase;
  uniform float uDim;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float lit = aHop > 0.5 ? smoothstep(aDelay, aDelay + 300.0, uClock) : 0.0;
    vec3 level = aLevel < 0.5 ? uStrong : (aLevel < 1.5 ? uText : uInferred);
    vec3 litColor = aHop < 1.5 ? level : uStarDim;
    float litAlpha = aHop < 1.5 ? 0.9 : 0.42;
    vColor = mix(uStarDim, litColor, lit);
    vAlpha = mix(uBase * mix(1.0, 0.4, uDim), litAlpha, lit);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINE_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() { gl_FragColor = vec4(vColor, vAlpha); }
`;

const HALO_VERTEX = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * uPixelRatio;
    gl_Position = projectionMatrix * mv;
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPulse;
  uniform float uDark;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float ringRadius = 0.62 + uPulse * 0.04 * sin(uTime * 2.0);
    float ring = smoothstep(0.07, 0.0, abs(d - ringRadius));
    float glow = exp(-d * d * 7.0) * (uDark > 0.5 ? 0.38 : 0.18);
    gl_FragColor = vec4(uColor, (ring * 0.85 + glow) * uOpacity);
  }
`;

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function starSize(kind: number, degree: number): number {
  switch (kind) {
    case KIND.disease:
      return 3.4 + Math.min(Math.sqrt(degree), 9) * 0.75;
    case KIND.lonely:
      return 2.8;
    case KIND.gene:
      return 2.6 + Math.min(Math.sqrt(degree), 6) * 0.45;
    case KIND.backgroundGene:
      return 2.0;
    default:
      return 2.1 + Math.min(Math.sqrt(degree), 6) * 0.2;
  }
}

export default function SkyCanvas({ sky, motion, initialFocus, onReady, onFail, onHover, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onFail, onHover, onSelect });
  callbacks.current = { onReady, onFail, onHover, onSelect };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let failed = false;
    const fail = (reason: string) => {
      if (failed || disposed) return;
      failed = true;
      callbacks.current.onFail(reason);
    };
    let needsFrame = true;
    let drag: { x: number; y: number; moved: number; pointerType: string; time: number } | null = null;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
    } catch {
      fail("init");
      return;
    }
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "pan-y";
    host.appendChild(canvas);
    const onContextLost = (event: Event) => {
      event.preventDefault();
      fail("context-lost");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 1, 2000);
    const world = new Group();
    scene.add(world);

    // ---- stars
    const n = sky.count;
    const sizes = new Float32Array(n);
    const kinds = new Float32Array(n);
    const seeds = new Float32Array(n);
    const hops = new Float32Array(n);
    const delays = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      sizes[i] = starSize(sky.kind[i], sky.degree[i]);
      kinds[i] = sky.kind[i];
      seeds[i] = ((i * 2654435761) % 1000) / 1000;
    }
    const starGeometry = new BufferGeometry();
    starGeometry.setAttribute("position", new BufferAttribute(sky.positions, 3));
    starGeometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
    starGeometry.setAttribute("aKind", new BufferAttribute(kinds, 1));
    starGeometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    const hopAttribute = new BufferAttribute(hops, 1);
    const delayAttribute = new BufferAttribute(delays, 1);
    starGeometry.setAttribute("aHop", hopAttribute);
    starGeometry.setAttribute("aDelay", delayAttribute);

    const shared = {
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uClock: { value: 0 },
      uDim: { value: 0 },
      uDark: { value: 1 },
    };
    const starUniforms = {
      ...shared,
      uTwinkle: { value: motion ? 1 : 0 },
      uStar: { value: new Color() },
      uStarDim: { value: new Color() },
      uAmber: { value: new Color() },
    };
    const starMaterial = new ShaderMaterial({
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      uniforms: starUniforms,
      transparent: true,
      depthWrite: false,
    });
    const stars = new Points(starGeometry, starMaterial);
    stars.frustumCulled = false;
    world.add(stars);

    // ---- edges
    const m = sky.edgeCount;
    const linePositions = new Float32Array(m * 6);
    const lineHops = new Float32Array(m * 2);
    const lineDelays = new Float32Array(m * 2);
    const lineLevels = new Float32Array(m * 2);
    for (let e = 0; e < m; e++) {
      const s = sky.edgeSource[e] * 3;
      const t = sky.edgeTarget[e] * 3;
      linePositions.set([sky.positions[s], sky.positions[s + 1], sky.positions[s + 2], sky.positions[t], sky.positions[t + 1], sky.positions[t + 2]], e * 6);
      const level = sky.edgeCode[e] % 4;
      lineLevels[e * 2] = lineLevels[e * 2 + 1] = level;
    }
    const lineGeometry = new BufferGeometry();
    lineGeometry.setAttribute("position", new BufferAttribute(linePositions, 3));
    const lineHopAttribute = new BufferAttribute(lineHops, 1);
    const lineDelayAttribute = new BufferAttribute(lineDelays, 1);
    lineGeometry.setAttribute("aHop", lineHopAttribute);
    lineGeometry.setAttribute("aDelay", lineDelayAttribute);
    lineGeometry.setAttribute("aLevel", new BufferAttribute(lineLevels, 1));
    const lineUniforms = {
      uClock: shared.uClock,
      uDim: shared.uDim,
      uBase: { value: 0.05 },
      uStrong: { value: new Color() },
      uText: { value: new Color() },
      uInferred: { value: new Color() },
      uStarDim: { value: new Color() },
    };
    const lineMaterial = new ShaderMaterial({
      vertexShader: LINE_VERTEX,
      fragmentShader: LINE_FRAGMENT,
      uniforms: lineUniforms,
      transparent: true,
      depthWrite: false,
    });
    const lines = new LineSegments(lineGeometry, lineMaterial);
    lines.frustumCulled = false;
    world.add(lines);

    // ---- halo (focus) and hover ring
    const makeHalo = (size: number) => {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(new Float32Array(3), 3));
      const material = new ShaderMaterial({
        vertexShader: HALO_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        uniforms: {
          uPixelRatio: shared.uPixelRatio,
          uTime: shared.uTime,
          uDark: shared.uDark,
          uSize: { value: size },
          uColor: { value: new Color() },
          uOpacity: { value: 0 },
          uPulse: { value: motion ? 1 : 0 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });
      const points = new Points(geometry, material);
      points.frustumCulled = false;
      points.renderOrder = 2;
      world.add(points);
      return { geometry, material, points };
    };
    const halo = makeHalo(54);
    const hoverRing = makeHalo(26);

    // ---- palette
    let palette: SkyPalette = readPalette();
    const applyPalette = () => {
      palette = readPalette();
      const dark = palette.dark ? 1 : 0;
      shared.uDark.value = dark;
      renderer.setClearColor(new Color(palette.bg), 1);
      starUniforms.uStar.value.set(palette.star);
      starUniforms.uStarDim.value.set(palette.starDim);
      starUniforms.uAmber.value.set(palette.amber);
      lineUniforms.uStrong.value.set(palette.lvlStrong);
      lineUniforms.uText.value.set(palette.lvlText);
      lineUniforms.uInferred.value.set(palette.lvlInferred);
      lineUniforms.uStarDim.value.set(palette.starDim);
      lineUniforms.uBase.value = palette.dark ? 0.06 : 0.07;
      halo.material.uniforms.uColor.value.set(palette.amber);
      hoverRing.material.uniforms.uColor.value.set(palette.star);
      const blending = palette.dark ? AdditiveBlending : NormalBlending;
      for (const material of [starMaterial, lineMaterial, halo.material, hoverRing.material]) {
        material.blending = blending;
        material.needsUpdate = true;
      }
      needsFrame = true;
    };
    const stopTheme = watchTheme(applyPalette);

    // ---- camera state: orbit angles around a target, plus an offset so the sky sits right of the hero on wide screens
    const view = {
      yaw: 0.35,
      pitch: -0.18,
      distance: HOME_DISTANCE,
      target: new Vector3(0, 0, 0),
      yawVelocity: 0,
      pitchVelocity: 0,
    };
    let width = 1;
    let height = 1;
    const resize = () => {
      width = Math.max(host.clientWidth, 1);
      height = Math.max(host.clientHeight, 1);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      shared.uPixelRatio.value = dpr;
      camera.aspect = width / height;
      // wide: centre of the sky at ~64 % of the width, so the glass hero on the left keeps a calm background
      const shift = width >= 1024 ? -width * 0.16 : 0;
      const lift = width < 1024 ? height * 0.1 : 0;
      camera.setViewOffset(width, height, shift, lift, width, height);
      camera.updateProjectionMatrix();
      needsFrame = true;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const placeCamera = () => {
      const cosPitch = Math.cos(view.pitch);
      camera.position.set(
        view.target.x + view.distance * Math.sin(view.yaw) * cosPitch,
        view.target.y + view.distance * Math.sin(view.pitch),
        view.target.z + view.distance * Math.cos(view.yaw) * cosPitch,
      );
      camera.lookAt(view.target);
    };

    // ---- focus / flight
    let focus: number | null = null;
    let clockStart = -1;
    let dimTarget = 0;
    let flight: { from: Vector3; to: Vector3; fromDistance: number; toDistance: number; start: number; resolve: () => void; igniteAt: number; star: number } | null = null;

    const setConstellation = (index: number | null) => {
      hops.fill(0);
      delays.fill(0);
      lineHops.fill(0);
      lineDelays.fill(0);
      if (index !== null) {
        const c = constellationOf(sky, index);
        for (const [star, info] of c.stars) {
          hops[star] = info.hop === 0 ? 3 : info.hop;
          delays[star] = info.delay;
        }
        for (const [edge, info] of c.edges) {
          lineHops[edge * 2] = lineHops[edge * 2 + 1] = info.hop;
          lineDelays[edge * 2] = lineDelays[edge * 2 + 1] = Math.max(info.delay, 0);
        }
        halo.geometry.attributes.position.array.set(sky.positions.subarray(index * 3, index * 3 + 3));
        halo.geometry.attributes.position.needsUpdate = true;
      }
      hopAttribute.needsUpdate = true;
      delayAttribute.needsUpdate = true;
      lineHopAttribute.needsUpdate = true;
      lineDelayAttribute.needsUpdate = true;
      focus = index;
      dimTarget = index === null ? 0 : 1;
      clockStart = index === null ? -1 : performance.now();
      if (!motion) clockStart = performance.now() - 5000;
      needsFrame = true;
    };

    const worldPositionOf = (index: number) => new Vector3(sky.positions[index * 3], sky.positions[index * 3 + 1], sky.positions[index * 3 + 2]).applyMatrix4(world.matrixWorld);

    const flyTo = (id: string, opts?: { instant?: boolean }) =>
      new Promise<void>((resolve) => {
        const index = sky.indexById.get(id);
        if (index === undefined) return resolve();
        flight?.resolve();
        world.updateMatrixWorld();
        const to = worldPositionOf(index);
        if (!motion || opts?.instant) {
          view.target.copy(to);
          view.distance = FOCUS_DISTANCE;
          setConstellation(index);
          flight = null;
          needsFrame = true;
          resolve();
          return;
        }
        if (focus !== index) {
          // clear the old figure right away, ignite the new one near the end of the flight
          setConstellation(null);
          dimTarget = 0.6;
        }
        flight = { from: view.target.clone(), to, fromDistance: view.distance, toDistance: FOCUS_DISTANCE, start: performance.now(), resolve, igniteAt: 0.55, star: index };
        if (focus === index) flight.igniteAt = 2; // already lit
        needsFrame = true;
      });

    let previewTimer = 0;
    const preview = (id: string | null) => {
      window.clearTimeout(previewTimer);
      if (id === null) return;
      previewTimer = window.setTimeout(() => void flyTo(id), 220);
    };
    registerSkyController({ flyTo, preview });

    // ---- pointer: drag orbit (mouse/pen), hover pick, click to open
    const projected = new Float32Array(n * 2);
    let projectedValid = false;
    const projectAll = () => {
      world.updateMatrixWorld();
      camera.updateMatrixWorld();
      const v = new Vector3();
      for (let i = 0; i < n; i++) {
        v.set(sky.positions[i * 3], sky.positions[i * 3 + 1], sky.positions[i * 3 + 2]).applyMatrix4(world.matrixWorld).project(camera);
        if (v.z > 1 || v.z < -1) {
          projected[i * 2] = -1e5;
          continue;
        }
        projected[i * 2] = (v.x * 0.5 + 0.5) * width;
        projected[i * 2 + 1] = (-v.y * 0.5 + 0.5) * height;
      }
      projectedValid = true;
    };
    const pick = (x: number, y: number): number | null => {
      if (!projectedValid) projectAll();
      let best: number | null = null;
      let bestScore = Infinity;
      for (let i = 0; i < n; i++) {
        const dx = projected[i * 2] - x;
        const dy = projected[i * 2 + 1] - y;
        const d2 = dx * dx + dy * dy;
        const radius = sky.kind[i] === KIND.symptom || sky.kind[i] === KIND.backgroundGene ? 7 : 12;
        if (d2 > radius * radius) continue;
        const score = d2 - (sky.kind[i] <= KIND.gene ? 40 : 0);
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      return best;
    };

    let hovered: number | null = null;
    const setHovered = (index: number | null, x = 0, y = 0) => {
      hovered = index;
      if (index !== null) {
        hoverRing.geometry.attributes.position.array.set(sky.positions.subarray(index * 3, index * 3 + 3));
        hoverRing.geometry.attributes.position.needsUpdate = true;
        callbacks.current.onHover({ index, x, y });
      } else callbacks.current.onHover(null);
      canvas.style.cursor = index !== null ? "pointer" : drag ? "grabbing" : "grab";
      needsFrame = true;
    };

    const local = (event: PointerEvent | WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onPointerDown = (event: PointerEvent) => {
      const p = local(event);
      drag = { x: p.x, y: p.y, moved: 0, pointerType: event.pointerType, time: performance.now() };
      if (event.pointerType === "mouse") canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const p = local(event);
      if (drag && event.pointerType === "mouse" && event.buttons & 1) {
        const dx = p.x - drag.x;
        const dy = p.y - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        drag.x = p.x;
        drag.y = p.y;
        view.yawVelocity = -dx * 0.0032;
        view.pitchVelocity = dy * 0.0024;
        view.yaw += view.yawVelocity;
        view.pitch = Math.max(-1.1, Math.min(1.1, view.pitch + view.pitchVelocity));
        projectedValid = false;
        if (hovered !== null) setHovered(null);
        canvas.style.cursor = "grabbing";
        needsFrame = true;
        return;
      }
      if (event.pointerType !== "mouse") return;
      const index = pick(p.x, p.y);
      if (index !== hovered || index !== null) setHovered(index, p.x, p.y);
    };
    const onPointerUp = (event: PointerEvent) => {
      const p = local(event);
      const wasDrag = drag;
      drag = null;
      canvas.style.cursor = hovered !== null ? "pointer" : "grab";
      if (!wasDrag || wasDrag.moved > 6) return;
      if (wasDrag.pointerType !== "mouse" && performance.now() - wasDrag.time > 400) return;
      const index = pick(p.x, p.y);
      if (index !== null) callbacks.current.onSelect(index);
    };
    const onPointerLeave = () => {
      if (!drag) setHovered(null);
    };
    const onWheel = (event: WheelEvent) => {
      // plain wheel scrolls the page; pinch (ctrlKey) zooms the sky
      if (!event.ctrlKey) return;
      event.preventDefault();
      view.distance = Math.max(50, Math.min(380, view.distance * Math.exp(event.deltaY * 0.01)));
      projectedValid = false;
      needsFrame = true;
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.style.cursor = "grab";

    // ---- loop
    let frames = 0;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    intersection.observe(host);

    const selfTest = (): boolean => {
      // one-off probe right after a render (drawing buffer still valid): is anything but the clear colour on screen?
      const gl = renderer.getContext();
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      const pixels = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const bg = new Color(palette.bg);
      const br = Math.round(bg.r * 255), bgG = Math.round(bg.g * 255), bb = Math.round(bg.b * 255);
      let lit = 0;
      for (let p = 0; p < pixels.length; p += 4 * 7) {
        if (Math.abs(pixels[p] - br) + Math.abs(pixels[p + 1] - bgG) + Math.abs(pixels[p + 2] - bb) > 40) lit++;
      }
      return lit > 25;
    };

    const tick = () => {
      raf = 0;
      if (disposed || failed) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      shared.uTime.value = (now - start) / 1000;

      if (flight) {
        const t = Math.min((now - flight.start) / FLIGHT_MS, 1);
        const k = easeInOut(t);
        view.target.lerpVectors(flight.from, flight.to, k);
        // a slight arc: pull back mid-flight so the eye keeps its bearings
        const arc = Math.sin(Math.PI * t) * 40;
        view.distance = flight.fromDistance + (flight.toDistance - flight.fromDistance) * k + arc;
        if (t >= flight.igniteAt && focus !== flight.star) setConstellation(flight.star);
        if (t >= 1) {
          if (focus !== flight.star) setConstellation(flight.star);
          const done = flight.resolve;
          flight = null;
          done();
        }
        projectedValid = false;
      } else if (motion && focus === null && !drag) {
        view.yaw += dt * 0.018; // drift: one turn in ~6 minutes
        projectedValid = false;
      }
      if (!drag && (Math.abs(view.yawVelocity) > 1e-5 || Math.abs(view.pitchVelocity) > 1e-5)) {
        view.yaw += view.yawVelocity;
        view.pitch = Math.max(-1.1, Math.min(1.1, view.pitch + view.pitchVelocity));
        view.yawVelocity *= 0.92;
        view.pitchVelocity *= 0.92;
        projectedValid = false;
      }
      const dim = shared.uDim.value + (dimTarget - shared.uDim.value) * Math.min(dt * 6, 1);
      shared.uDim.value = motion ? dim : dimTarget;
      shared.uClock.value = clockStart < 0 ? 0 : now - clockStart;
      halo.material.uniforms.uOpacity.value = focus === null ? 0 : Math.min(shared.uClock.value / 300, 1);
      hoverRing.material.uniforms.uOpacity.value = hovered !== null && hovered !== focus ? 0.7 : 0;

      placeCamera();
      renderer.render(scene, camera);
      frames++;
      if (frames === 3) {
        let ok = false;
        try {
          ok = selfTest();
        } catch {
          ok = false;
        }
        if (!ok) {
          fail("blank-frame");
          return;
        }
        callbacks.current.onReady();
      }
      needsFrame = false;
      const animating = motion || flight !== null || frames < 4 || Math.abs(shared.uDim.value - dimTarget) > 0.01 || (clockStart >= 0 && now - clockStart < 1200);
      if (animating || needsFrame) schedule();
    };
    const schedule = () => {
      if (!raf && visible && !document.hidden && !disposed) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      needsFrame = true;
      schedule();
    };
    // any state change wakes the loop
    const wakeTimer = window.setInterval(() => {
      if (needsFrame) schedule();
    }, 100);
    document.addEventListener("visibilitychange", wake);

    try {
      applyPalette();
      resize();
      placeCamera();
      world.updateMatrixWorld();
      if (initialFocus) void flyTo(initialFocus, { instant: !motion });
      schedule();
    } catch {
      fail("init");
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearInterval(wakeTimer);
      window.clearTimeout(previewTimer);
      flight?.resolve();
      registerSkyController(null);
      stopTheme();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", wake);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      starGeometry.dispose();
      starMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      halo.geometry.dispose();
      halo.material.dispose();
      hoverRing.geometry.dispose();
      hoverRing.material.dispose();
      renderer.dispose();
      canvas.remove();
    };
    // the sky object and motion flag are fixed for the life of this canvas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sky, motion]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
