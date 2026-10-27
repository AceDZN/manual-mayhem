import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createWorkshopSurfaces, createWorkshopEnvironment } from "./surfaces";
import type { Mission } from "./content";
import type { GameState } from "./rules";
type Hit = { module?: string; control?: string; socket?: string };
const CENTERS: Record<string, T.Vector3> = {
  valves: new T.Vector3(-1.0, 3.3, 1.5),
  cable: new T.Vector3(3.25, 2.2, 1.5),
  switches: new T.Vector3(-2.25, 1.15, 1.5),
};
export class EngineScene {
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(39, 1, 0.1, 80);
  renderer: T.WebGLRenderer;
  root = new T.Group();
  ray = new T.Raycaster();
  pointer = new T.Vector2();
  hits: T.Object3D[] = [];
  selected: string | null = null;
  rotation = 0;
  rotTarget = 0;
  settleTime = 3;
  elapsed = 0;
  world: GameState | null = null;
  mission: Mission | null = null;
  onSelect: (id: string | null) => void = () => {};
  onControl: (id: string, c: string) => void = () => {};
  surfaces: ReturnType<typeof createWorkshopSurfaces>;
  wheels: T.Group[] = [];
  needles: T.Group[] = [];
  levers: T.Group[] = [];
  clips: T.Group[] = [];
  tags: T.Mesh[] = [];
  serials: Record<string, T.Mesh> = {};
  indicators: T.Mesh[] = [];
  fan = new T.Group();
  wire!: T.Mesh;
  looseWire!: T.Mesh;
  wirePreview?: T.Mesh;
  freePlug?: T.Group;
  puffs: { sprite: T.Sprite; life: number }[] = [];
  controlGlow: T.Mesh[] = [];
  constructor(public canvas: HTMLCanvasElement) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.surfaces = createWorkshopSurfaces(this.renderer, () => {
      this.settleTime = 2;
      this.renderer.shadowMap.needsUpdate = true;
    });
    const env = createWorkshopEnvironment(this.renderer);
    this.scene.environment = env.texture;
    this.scene.environmentIntensity = 0.65;
    this.scene.backgroundIntensity = 0.58;
    this.scene.background = new T.Color("#302820");
    new T.TextureLoader().load(
      `${import.meta.env.BASE_URL}textures/workshop-backdrop.png`,
      (tex) => {
        tex.colorSpace = T.SRGBColorSpace;
        const source = tex.image as HTMLImageElement;
        const c = document.createElement("canvas");
        c.width = 1440;
        c.height = 810;
        const ctx = c.getContext("2d")!;
        ctx.filter = "blur(5px)";
        ctx.drawImage(source, -8, -8, 1456, 826);
        const softened = new T.CanvasTexture(c);
        softened.colorSpace = T.SRGBColorSpace;
        this.scene.background = softened;
        tex.dispose();
        this.settleTime = 2;
      },
    );
    this.camera.position.set(-4, 6, 16);
    this.scene.add(this.root);
    this.scene.add(new T.HemisphereLight("#ead3ac", "#182125", 0.35));
    const key = new T.SpotLight("#ffdfb4", 70, 40, 0.68, 0.6, 2);
    key.position.set(-5, 9, 7);
    key.target.position.set(0, 2.6, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.normalBias = 0.025;
    key.shadow.bias = -0.00015;
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 28;
    this.scene.add(key, key.target);
    const fill = new T.DirectionalLight("#b8d2da", 0.42);
    fill.position.set(5, 4, 5);
    this.scene.add(fill);
    const rim = new T.SpotLight("#ffa64d", 65, 22, 0.6, 0.8, 2);
    rim.position.set(5, 6, -2);
    rim.target.position.set(0, 2.5, 0);
    this.scene.add(rim, rim.target);
    this.surfaces.wood.color.set("#c8b7a1");
    this.build();
    this.bind();
    this.resize();
    const r = new ResizeObserver(() => this.resize());
    r.observe(canvas);
    window.addEventListener("resize", () => this.resize());
  }
  box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: T.Material = this.surfaces.ivory,
    parent: T.Object3D = this.root,
    r = 0.045,
  ) {
    const o = new T.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  cyl(
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    mat: T.Material = this.surfaces.brass,
    parent: T.Object3D = this.root,
    sides = 48,
  ) {
    const o = new T.Mesh(new T.CylinderGeometry(r, r, h, sides), mat);
    o.rotation.x = Math.PI / 2;
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  tube(
    points: T.Vector3[],
    radius: number,
    mat: T.Material = this.surfaces.brass,
    parent: T.Object3D = this.root,
  ) {
    const o = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 36, radius, 12, false),
      mat,
    );
    o.castShadow = o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  ring(
    r: number,
    t: number,
    x: number,
    y: number,
    z: number,
    mat: T.Material = this.surfaces.brass,
    parent: T.Object3D = this.root,
  ) {
    const o = new T.Mesh(new T.TorusGeometry(r, t, 12, 64), mat);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  hit(o: T.Object3D, data: Hit) {
    o.userData = data;
    this.hits.push(o);
    return o;
  }
  bolt(
    x: number,
    y: number,
    z: number,
    size = 0.055,
    parent: T.Object3D = this.root,
  ) {
    this.cyl(size, 0.034, x, y, z, this.surfaces.steel, parent, 6);
    this.cyl(
      size * 0.58,
      0.04,
      x,
      y,
      z + 0.02,
      this.surfaces.rubber,
      parent,
      12,
    );
    const slot = this.box(
      size,
      0.012,
      0.008,
      x,
      y,
      z + 0.045,
      this.surfaces.steel,
      parent,
      0.001,
    );
    slot.rotation.z = 0.65;
  }
  label(
    text: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = this.root,
    bg = "#d3c4a2",
    fg = "#282a25",
    size = 0,
  ) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = Math.max(90, Math.round((1024 * h) / w));
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#7b6b4b66";
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, c.width - 10, c.height - 10);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = fg;
    ctx.font = `${size || Math.round(c.height * 0.6)}px Arial`;
    ctx.fillText(text, c.width / 2, c.height * 0.53, c.width * 0.94);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    const o = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshStandardMaterial({
        map: tex,
        roughness: 1,
        metalness: 0,
      }),
    );
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  }
  plate(
    text: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = this.root,
  ) {
    this.box(
      w + 0.06,
      h + 0.05,
      0.035,
      x,
      y,
      z - 0.02,
      this.surfaces.ivory,
      parent,
      0.018,
    );
    const o = this.label(text, w, h, x, y, z + 0.005, parent);
    if (w > 0.65) {
      this.bolt(x - w / 2 + 0.055, y, z + 0.025, 0.022, parent);
      this.bolt(x + w / 2 - 0.055, y, z + 0.025, 0.022, parent);
    }
    return o;
  }
  gauge(x: number, y: number, r: number, title: string, blue = false) {
    const s = this.surfaces;
    const maximum = blue ? 5 : 6;
    const ticks = maximum * 10;
    this.cyl(r + 0.09, 0.13, x, y, 1.48, s.rubber);
    this.cyl(r + 0.065, 0.12, x, y, 1.56, s.steel);
    this.ring(r + 0.015, 0.055, x, y, 1.66, s.brass);
    const c = document.createElement("canvas");
    c.width = c.height = 768;
    const ctx = c.getContext("2d")!;
    const center = 384;
    ctx.fillStyle = "#e2d7b6";
    ctx.fillRect(0, 0, 768, 768);
    const shade = ctx.createRadialGradient(330, 310, 80, 384, 384, 380);
    shade.addColorStop(0, "#f2e8d0");
    shade.addColorStop(1, "#b7aa88");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 768, 768);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2b302c";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= ticks; i++) {
      const a = 2.38 + (i / ticks) * 4.61;
      const ro = 324,
        ri = i % 10 === 0 ? 282 : i % 5 === 0 ? 294 : 306;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(a) * ro, center + Math.sin(a) * ro);
      ctx.lineTo(center + Math.cos(a) * ri, center + Math.sin(a) * ri);
      ctx.lineWidth = i % 10 === 0 ? 5 : 2;
      ctx.stroke();
      if (i % 10 === 0) {
        ctx.font = "46px Georgia";
        ctx.fillStyle = "#2b302c";
        ctx.fillText(
          String(i / 10),
          center + Math.cos(a) * 248,
          center + Math.sin(a) * 248,
        );
      }
    }
    ctx.strokeStyle = blue ? "#39717a" : "#8c482e";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(384, 384, 343, 2.38, 6.99);
    ctx.stroke();
    ctx.fillStyle = blue ? "#234f5d" : "#333c37";
    ctx.font = "28px Arial";
    ctx.fillText(title, 384, 507);
    ctx.font = "19px Arial";
    ctx.fillText("FESTIVAL ENGINE CO.", 384, 545);
    ctx.font = "20px Georgia";
    ctx.fillText(`0 – ${maximum}  /  bar`, 384, 583);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    const face = new T.Mesh(
      new T.CircleGeometry(r - 0.035, 72),
      new T.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }),
    );
    face.position.set(x, y, 1.68);
    this.root.add(face);
    this.hit(face, {
      module: title.startsWith("STARTUP") ? "switches" : "valves",
    });
    const pivot = new T.Group();
    pivot.userData.maximum = maximum;
    pivot.position.set(x, y, 1.72);
    this.root.add(pivot);
    const shape = new T.Shape();
    shape.moveTo(-r * 0.18, -0.026);
    shape.lineTo(r * 0.78, 0);
    shape.lineTo(-r * 0.18, 0.026);
    shape.closePath();
    const needle = new T.Mesh(new T.ShapeGeometry(shape), s.rubber);
    pivot.add(needle);
    this.cyl(0.07, 0.05, 0, 0, 0.015, s.brass, pivot);
    const glass = new T.Mesh(
      new T.CircleGeometry(r - 0.02, 72),
      new T.MeshPhysicalMaterial({
        color: "#e8f4ed",
        transparent: true,
        opacity: 0.095,
        roughness: 0.06,
        metalness: 0.05,
        clearcoat: 1,
        depthWrite: false,
      }),
    );
    glass.position.set(x, y, 1.77);
    this.root.add(glass);
    return pivot;
  }
  wheel(r: number, x: number, y: number, control: string) {
    const s = this.surfaces;
    this.tube(
      [
        new T.Vector3(x, 1.98, 1.45),
        new T.Vector3(x, 2.5, 1.46),
        new T.Vector3(x, 4.4, 1.46),
      ],
      0.1,
      s.brass,
    );
    for (const yy of [2.13, 4.25]) {
      this.cyl(0.18, 0.09, x, yy, 1.49, s.steel);
      this.box(0.39, 0.13, 0.16, x, yy, 1.4, s.brass);
    }
    this.cyl(0.35, 0.16, x, y, 1.48, s.petrol);
    const valveBody = new T.Mesh(new T.SphereGeometry(0.3, 32, 20), s.brass);
    valveBody.scale.set(1, 0.85, 0.65);
    valveBody.position.set(x, y, 1.62);
    valveBody.castShadow = valveBody.receiveShadow = true;
    this.root.add(valveBody);
    this.tube(
      [new T.Vector3(x - 0.36, y, 1.53), new T.Vector3(x + 0.36, y, 1.53)],
      0.11,
      s.brass,
    );
    for (const yy of [y - 0.36, y + 0.36]) {
      const collar = this.ring(0.14, 0.045, x, yy, 1.49, s.brass);
      collar.rotation.x = Math.PI / 2;
    }

    this.cyl(0.25, 0.33, x, y, 1.62, s.brass);
    const g = new T.Group();
    g.position.set(x, y, 1.86);
    this.root.add(g);
    this.ring(r, 0.09, 0, 0, 0.015, s.brass, g);
    this.ring(r - 0.068, 0.03, 0, 0, 0.072, s.brass, g);
    this.ring(r + 0.02, 0.023, 0, 0, -0.035, s.steel, g);
    for (let i = 0; i < 5; i++) {
      const sh = new T.Shape();
      sh.moveTo(0.12, -0.07);
      sh.quadraticCurveTo(r * 0.5, -0.16, r * 0.91, -0.06);
      sh.lineTo(r * 0.94, 0.065);
      sh.quadraticCurveTo(r * 0.55, 0.06, 0.12, 0.08);
      sh.closePath();
      const geom = new T.ExtrudeGeometry(sh, {
        depth: 0.065,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.025,
        bevelSegments: 2,
        steps: 1,
      });
      const spoke = new T.Mesh(geom, s.brass);
      spoke.rotation.z = (i * Math.PI * 2) / 5;
      spoke.castShadow = spoke.receiveShadow = true;
      g.add(spoke);
    }
    this.cyl(0.3, 0.16, 0, 0, 0.04, s.brass, g);
    this.cyl(0.25, 0.2, 0, 0, 0.13, s.brass, g);
    this.cyl(0.21, 0.24, 0, 0, 0.24, s.brass, g, 12);
    this.cyl(0.17, 0.18, 0, 0, 0.38, s.brass, g);
    const knurl = new T.InstancedMesh(
      new T.BoxGeometry(0.025, 0.07, 0.065),
      s.brass,
      32,
    );
    const dummy = new T.Object3D();
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16;
      dummy.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.24, 0.24);
      dummy.rotation.z = a;
      dummy.updateMatrix();
      knurl.setMatrixAt(i, dummy.matrix);
    }
    knurl.castShadow = true;
    g.add(knurl);
    this.bolt(0, 0, 0.5, 0.08, g);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      this.bolt(Math.cos(a) * 0.31, Math.sin(a) * 0.31, 0.1, 0.032, g);
    }
    this.cyl(0.045, 0.035, r * 0.8, r * 0.44, 0.075, s.orange, g);
    const proxy = new T.Mesh(
      new T.CircleGeometry(r + 0.12, 64),
      new T.MeshBasicMaterial({ visible: false }),
    );
    proxy.position.z = 0.3;
    g.add(proxy);
    this.hit(proxy, { module: "valves", control });
    this.wheels.push(g);
  }
  screen(x: number, y: number, round: boolean) {
    const s = this.surfaces;
    const w = 0.82,
      h = 0.69;
    if (round) {
      this.cyl(0.46, 0.12, x, y, 1.56, s.brass);
      this.ring(0.39, 0.025, x, y, 1.66, s.steel);
    } else {
      this.box(w + 0.15, h + 0.15, 0.16, x, y, 1.54, s.brass);
      for (const xx of [x - w / 2, x + w / 2])
        for (const yy of [y - h / 2, y + h / 2]) this.bolt(xx, yy, 1.64, 0.025);
    }
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 416;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#082b25";
    ctx.fillRect(0, 0, 512, 416);
    ctx.strokeStyle = "#33715c";
    ctx.lineWidth = 1;
    for (let x = 16; x < 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 416);
      ctx.stroke();
    }
    for (let y = 16; y < 416; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#88d8a2";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#69ffba";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    if (round) {
      ctx.arc(256, 208, 96, 0, Math.PI * 2);
    } else {
      ctx.rect(150, 102, 212, 212);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#85c79b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 25; x < 488; x++) {
      const y = 357 + Math.sin(x * 0.06) * 6;
      if (x === 25) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const map = new T.CanvasTexture(c);
    map.colorSpace = T.SRGBColorSpace;
    const geom = round
      ? new T.CircleGeometry(0.355, 64)
      : new T.PlaneGeometry(w - 0.04, h - 0.04);
    const m = new T.MeshBasicMaterial({
      map,
      color: "#c0e2c1",
      toneMapped: false,
    });
    const face = new T.Mesh(geom, m);
    face.position.set(x, y, 1.65);
    this.root.add(face);
    const glass = new T.Mesh(geom, s.glass);
    glass.position.set(x, y, 1.66);
    this.root.add(glass);
  }
  socket(x: number, y: number, name: string) {
    const s = this.surfaces;
    this.box(0.65, 0.62, 0.05, x, y, 1.5, s.steel);
    for (const xx of [x - 0.24, x + 0.24]) this.bolt(xx, y + 0.22, 1.54, 0.023);
    this.cyl(0.245, 0.13, x, y, 1.57, s.brass);
    this.cyl(0.19, 0.145, x, y, 1.62, s.rubber);
    this.ring(0.196, 0.023, x, y, 1.72, s.steel);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.7;
      this.cyl(
        0.025,
        0.012,
        x + Math.cos(a) * 0.11,
        y + Math.sin(a) * 0.11,
        1.705,
        s.brass,
      );
    }
    const hit = this.cyl(
      0.18,
      0.025,
      x,
      y,
      1.74,
      new T.MeshBasicMaterial({ visible: false }),
    );
    this.hit(hit, { module: "cable", control: "socket", socket: name });
    this.plate(
      name === "square" ? "SQUARE IN" : "ROUND IN",
      0.82,
      0.15,
      x,
      y - 0.45,
      1.53,
    );
  }
  lever(x: number, control: string) {
    const s = this.surfaces;
    this.cyl(0.16, 0.08, x, 1.2, 1.59, s.steel, this.root, 6);
    this.cyl(0.11, 0.1, x, 1.2, 1.66, s.rubber);
    const g = new T.Group();
    g.position.set(x, 1.2, 1.72);
    this.root.add(g);
    const shaft = new T.Mesh(
      new T.CylinderGeometry(0.036, 0.045, 0.36, 16),
      s.steel,
    );
    shaft.position.set(0, 0.12, 0.12);
    shaft.rotation.x = 0.7;
    g.add(shaft);
    const cap = new T.Mesh(new T.CapsuleGeometry(0.065, 0.13, 4, 16), s.orange);
    cap.position.set(0, 0.27, 0.24);
    cap.rotation.x = 0.7;
    cap.castShadow = true;
    g.add(cap);
    const proxy = this.cyl(
      0.22,
      0.04,
      x,
      1.28,
      1.97,
      new T.MeshBasicMaterial({ visible: false }),
    );
    this.hit(proxy, { module: "switches", control });
    this.levers.push(g);
    this.plate(
      control === "left" ? "LEFT / L" : "RIGHT / R",
      0.85,
      0.17,
      x,
      0.88,
      1.73,
    );
    const tag = this.label(
      "TAG",
      0.75,
      0.18,
      x,
      1.9,
      1.8,
      this.root,
      "#d7bd86",
    );
    this.hit(tag, { module: "switches", control: "tag-" + control });
    this.tags.push(tag);
  }
  button(x: number, y: number, module: string, control: string, label: string) {
    const s = this.surfaces;
    this.cyl(0.155, 0.085, x, y, 1.61, s.steel);
    const cap = this.cyl(0.12, 0.11, x, y, 1.68, s.rubber);
    this.hit(cap, { module, control });
    this.plate(label, 0.67, 0.16, x, y - 0.25, 1.73);
  }
  build() {
    const s = this.surfaces;
    this.box(
      23,
      0.35,
      13,
      0,
      0.13,
      1.4,
      s.variant("wood", [2.4, 1]),
      this.scene,
      0.07,
    );
    this.box(9.1, 0.24, 3.0, 0, 0.49, 0, s.rubber);
    this.box(9.2, 4.35, 2.5, 0, 2.88, 0, s.ivory, this.root, 0.23);
    this.box(8.88, 4.02, 0.12, 0, 2.88, 1.29, s.rubber);
    this.box(8.5, 3.75, 0.09, 0, 2.88, 1.37, s.petrol);
    for (const x of [-4.38, -2.67, 1.65, 4.38])
      this.box(
        x === -4.38 || x === 4.38 ? 0.23 : 0.16,
        4.18,
        0.26,
        x,
        2.88,
        1.48,
        s.ivory,
      );
    for (const yy of [0.8, 4.95, 1.89])
      this.box(8.9, yy === 1.89 ? 0.15 : 0.22, 0.27, 0, yy, 1.48, s.ivory);
    // Cast corner guards, screws and seam lines create thickness at the silhouette.
    for (const x of [-4.56, 4.56]) {
      for (const y of [0.86, 4.88]) {
        this.box(0.17, 0.72, 2.53, x, y, 0, s.steel);
        this.box(
          0.52,
          0.2,
          2.57,
          x + (x < 0 ? 0.17 : -0.17),
          y + (y < 2 ? -0.14 : 0.14),
          0,
          s.steel,
        );
      }
      for (let y = 1.35; y < 4.6; y += 0.27) {
        this.box(0.025, 0.08, 1.8, x, y, 0, s.rubber);
      }
    }
    for (const x of [-4.26, -2.66, 1.65, 4.26])
      for (const yy of [1, 4.76]) this.bolt(x, yy, 1.66, 0.075);
    for (const x of [-3.65, 3.65]) {
      this.box(0.78, 0.22, 2.0, x, 0.47, 0, s.rubber);
      for (const yy of [0.68, 5.08])
        this.box(0.8, 0.08, 2.0, x, yy, 0, s.steel);
    }
    const handle = this.tube(
      [
        new T.Vector3(-1.75, 5.05, 0),
        new T.Vector3(-1.75, 5.42, 0),
        new T.Vector3(-1.4, 5.66, 0),
        new T.Vector3(1.4, 5.66, 0),
        new T.Vector3(1.75, 5.42, 0),
        new T.Vector3(1.75, 5.05, 0),
      ],
      0.105,
      s.steel,
    );
    this.hit(handle, { control: "handle" });
    const grip = new T.Mesh(
      new T.CylinderGeometry(0.16, 0.16, 2.9, 32),
      s.orange,
    );
    grip.rotation.z = Math.PI / 2;
    grip.position.set(0, 5.65, 0);
    grip.castShadow = true;
    this.root.add(grip);
    this.hit(grip, { control: "handle" });
    for (const x of [-1.75, 1.75]) {
      this.box(0.48, 0.08, 0.5, x, 5.07, 0, s.steel);
      for (const z of [-0.17, 0.17]) {
        const bolt = this.cyl(0.06, 0.045, x, 5.14, z, s.steel);
        bolt.rotation.x = 0;
      }
    }
    // The front is one coherent instrument, with a gauge cluster and a recessed valve mechanism.
    this.plate("VALVE BAY", 3.75, 0.28, -0.55, 4.68, 1.65);
    this.box(4.05, 2.63, 0.12, -0.55, 3.25, 1.47, s.petrol);
    this.hit(
      this.box(
        4.0,
        2.75,
        0.025,
        -0.55,
        3.3,
        1.55,
        new T.MeshBasicMaterial({ visible: false }),
      ),
      { module: "valves" },
    );
    this.needles.push(this.gauge(-3.5, 3.9, 0.63, "VALVE / P", true));
    this.needles.push(this.gauge(-3.5, 2.45, 0.59, "STARTUP / P"));
    this.wheel(0.64, -1.63, 3.15, "small");
    this.wheel(0.93, 0.35, 3.15, "large");
    this.plate("SMALL VALVE / A", 1.48, 0.22, -1.6, 2.02, 1.62);
    this.plate("LARGE VALVE / B", 1.58, 0.22, 0.4, 2.02, 1.62);
    this.button(-3.5, 1.62, "valves", "test", "TEST V");
    this.serials.valves = this.plate("V-01", 0.85, 0.15, -2.15, 4.36, 1.59);
    // Pipe manifold and realistic unions sit behind the wheels.
    this.tube(
      [
        new T.Vector3(-2.25, 4.1, 1.53),
        new T.Vector3(-2.25, 4.38, 1.53),
        new T.Vector3(0.95, 4.38, 1.53),
        new T.Vector3(1.0, 3.7, 1.53),
      ],
      0.09,
      s.brass,
    );
    for (const x of [-2.2, -0.7, 0.95]) {
      this.box(0.18, 0.35, 0.17, x, 4.38, 1.5, s.steel);
      this.bolt(x, 4.38, 1.64, 0.035);
    }
    for (let i = 0; i < 8; i++) {
      const x = -2.3 + i * 0.46;
      this.bolt(x, 2.25, 1.58, 0.025);
    }
    const arrows = this.label(
      "↶ CLOSE        OPEN ↷",
      3.6,
      0.18,
      -0.5,
      2.32,
      1.58,
      this.root,
      "#20322e",
      "#acaa8c",
    );
    // Patch module: screens give a fixed geometric reference for the sockets underneath.
    this.box(2.45, 3.92, 0.075, 3.05, 2.9, 1.43, s.ivory);
    this.hit(
      this.box(
        2.35,
        3.82,
        0.025,
        3.05,
        2.88,
        1.5,
        new T.MeshBasicMaterial({ visible: false }),
      ),
      { module: "cable" },
    );
    this.plate("PATCH BAY", 2.05, 0.27, 3.05, 4.68, 1.61);
    this.screen(2.45, 4.0, false);
    this.screen(3.65, 4.0, true);
    this.socket(2.45, 3.08, "square");
    this.socket(3.65, 3.08, "round");
    for (const [x, id] of [
      [2.25, "clip-a"],
      [3.85, "clip-b"],
    ] as const) {
      const g = new T.Group();
      g.position.set(x, 2.1, 1.56);
      this.root.add(g);
      this.box(0.36, 0.43, 0.08, 0, 0, 0.03, s.steel, g);
      this.box(0.24, 0.19, 0.15, 0, -0.12, 0.1, s.rubber, g);
      this.cyl(0.07, 0.12, 0, 0.16, 0.06, s.brass, g);
      const h = this.box(
        0.42,
        0.48,
        0.25,
        0,
        0,
        0.15,
        new T.MeshBasicMaterial({ visible: false }),
        g,
      );
      this.hit(h, { module: "cable", control: id });
      this.clips.push(g);
      this.plate(
        id === "clip-a" ? "CLIP A" : "CLIP B",
        0.65,
        0.16,
        x,
        1.72,
        1.61,
      );
    }
    this.button(3.05, 2.1, "cable", "test", "TEST C");
    this.cyl(0.25, 0.1, 3.05, 1.12, 1.58, s.brass);
    this.hit(this.cyl(0.18, 0.22, 3.05, 1.12, 1.7, s.orange), {
      module: "cable",
      control: "source",
    });
    this.plate("CABLE / OUT", 1.0, 0.17, 3.05, 0.8, 1.59);
    this.serials.cable = this.plate("C-01", 0.72, 0.14, 3.05, 1.43, 1.6);
    this.wire = this.makeWire("square");
    this.wire.visible = false;
    this.looseWire = this.tube(
      [
        new T.Vector3(3.05, 1.12, 1.83),
        new T.Vector3(3.5, 0.5, 2.7),
        new T.Vector3(4.0, 0.4, 3.4),
        new T.Vector3(4.8, 0.38, 3.0),
      ],
      0.07,
      s.rubber,
    );
    this.looseWire.visible = true;
    const plug = new T.Group();
    plug.position.set(4.8, 0.48, 3.0);
    plug.rotation.y = -0.7;
    this.root.add(plug);
    this.freePlug = plug;
    this.cyl(0.16, 0.37, 0, 0, 0, s.orange, plug);
    this.cyl(0.11, 0.25, 0, 0, 0.27, s.steel, plug);
    for (const z of [-0.15, -0.05, 0.05, 0.15])
      this.ring(0.16, 0.015, 0, 0, z, s.rubber, plug);
    this.hit(
      this.cyl(
        0.24,
        0.7,
        0,
        0,
        0.05,
        new T.MeshBasicMaterial({ visible: false }),
        plug,
      ),
      { module: "cable", control: "source" },
    );
    // Relay controls form a separate lower instrument strip, not a flat third column.
    this.hit(
      this.box(
        4.5,
        0.97,
        0.08,
        -1.94,
        1.28,
        1.46,
        new T.MeshBasicMaterial({ visible: false }),
      ),
      { module: "switches" },
    );
    this.lever(-3.65, "left");
    this.lever(-2.53, "right");
    this.fan.position.set(-1.17, 1.23, 1.65);
    this.root.add(this.fan);
    this.cyl(0.34, 0.12, 0, 0, 0, s.rubber, this.fan);
    for (let i = 0; i < 7; i++) {
      const blade = this.box(
        0.42,
        0.1,
        0.05,
        0.09,
        0,
        0.08,
        s.steel,
        this.fan,
        0.04,
      );
      blade.rotation.z = (i * Math.PI) / 3.5;
    }
    this.cyl(0.09, 0.17, 0, 0, 0.1, s.brass, this.fan);
    this.hit(
      this.cyl(
        0.38,
        0.03,
        -1.17,
        1.23,
        1.89,
        new T.MeshBasicMaterial({ visible: false }),
      ),
      { module: "switches", control: "fan" },
    );
    this.plate("FAN", 0.67, 0.16, -1.17, 0.88, 1.73);
    this.button(-0.2, 1.22, "switches", "test", "TEST S");
    this.button(0.82, 1.22, "current", "reset", "RESET");
    this.serials.switches = this.plate(
      "S-01 / RELAY",
      1.25,
      0.15,
      -1.25,
      1.68,
      1.59,
    );
    // Jewelled lamps and engraved status plates stay tied to authoritative module state.
    for (const [x, y] of [
      [1.25, 4.55],
      [4.1, 4.55],
      [0.25, 1.65],
    ]) {
      this.cyl(0.1, 0.05, x, y, 1.58, s.brass);
      const l = this.cyl(
        0.067,
        0.085,
        x,
        y,
        1.63,
        new T.MeshPhysicalMaterial({
          color: "#ac6b2e",
          emissive: "#5d2407",
          emissiveIntensity: 0.3,
          roughness: 0.16,
          clearcoat: 1,
        }),
      );
      this.indicators.push(l);
    }
    this.environmentProps();
  }
  makeWire(socket: string) {
    const x = socket === "round" ? 3.65 : 2.45;
    return this.tube(
      [
        new T.Vector3(3.05, 1.12, 1.9),
        new T.Vector3(3.3, 0.65, 2.65),
        new T.Vector3(x - 0.25, 1.6, 2.45),
        new T.Vector3(x, 3.08, 1.82),
      ],
      0.075,
      this.surfaces.rubber,
    );
  }
  environmentProps() {
    const s = this.surfaces;
    s.wood.color.set("#c8b7a1");
    const stainCanvas = document.createElement("canvas");
    stainCanvas.width = stainCanvas.height = 256;
    const stainCtx = stainCanvas.getContext("2d")!;
    const stainGradient = stainCtx.createRadialGradient(
      128,
      128,
      30,
      128,
      128,
      120,
    );
    stainGradient.addColorStop(0, "rgba(28,23,14,.14)");
    stainGradient.addColorStop(0.7, "rgba(28,23,14,.08)");
    stainGradient.addColorStop(1, "rgba(28,23,14,0)");
    stainCtx.fillStyle = stainGradient;
    stainCtx.fillRect(0, 0, 256, 256);
    const stainMap = new T.CanvasTexture(stainCanvas);
    stainMap.colorSpace = T.SRGBColorSpace;
    for (const [x, z, w, h] of [
      [-3.3, 3.7, 2.8, 1.5],
      [3.7, 2.8, 2.4, 1.1],
      [-5.6, -0.8, 1.7, 1.4],
    ]) {
      const stain = new T.Mesh(
        new T.PlaneGeometry(w, h),
        new T.MeshBasicMaterial({
          map: stainMap,
          transparent: true,
          depthWrite: false,
        }),
      );
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(x, 0.312, z);
      this.scene.add(stain);
    }

    const loader = new GLTFLoader();
    for (const [path, scale, pos, rot] of [
      ["pump.glb", 1.7, [-5.6, 0.32, -0.8], 0.6],
      ["service-arm.glb", 1.5, [5.6, 0.32, -2.3], -1.2],
    ] as [string, number, number[], number][]) {
      loader.load(`${import.meta.env.BASE_URL}models/${path}`, (g) => {
        g.scene.scale.setScalar(scale);
        g.scene.position.set(...(pos as [number, number, number]));
        g.scene.rotation.y = rot;
        g.scene.traverse((o) => {
          if (o instanceof T.Mesh) {
            o.castShadow = o.receiveShadow = true;
          }
        });
        this.scene.add(g.scene);
        this.settleTime = 2;
        this.renderer.shadowMap.needsUpdate = true;
      });
    }
    // Foreground spanners, washers and an oil can add the scale and context of the target.
    for (const [x, z, angle, len] of [
      [-4.0, 3.9, -0.35, 2.1],
      [-3.0, 3.45, 0.2, 1.65],
    ] as number[][]) {
      const g = new T.Group();
      g.position.set(x, 0.34, z);
      g.rotation.y = angle;
      this.scene.add(g);
      this.box(len, 0.045, 0.15, 0, 0.025, 0, s.steel, g, 0.035);
      const ring = new T.Mesh(new T.TorusGeometry(0.19, 0.065, 8, 36), s.steel);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(len / 2, 0.04, 0);
      g.add(ring);
      this.box(0.36, 0.06, 0.12, -len / 2, 0.035, -0.15, s.steel, g);
      this.box(0.36, 0.06, 0.12, -len / 2, 0.035, 0.15, s.steel, g);
      this.box(0.1, 0.06, 0.3, -len / 2 + 0.15, 0.035, 0, s.steel, g);
    }
    for (let i = 0; i < 4; i++) {
      const o = new T.Mesh(new T.TorusGeometry(0.08, 0.025, 6, 20), s.brass);
      o.rotation.x = Math.PI / 2;
      o.position.set(-1.4 + i * 0.25, 0.36, 3.8 + (i % 2) * 0.15);
      this.scene.add(o);
    }
    const lampbase = this.box(
      0.8,
      0.1,
      0.65,
      6,
      0.4,
      -0.8,
      s.rubber,
      this.scene,
    );
    this.tube(
      [
        new T.Vector3(6, 0.4, -0.8),
        new T.Vector3(6, 2.2, -0.8),
        new T.Vector3(5.7, 4.5, -0.5),
      ],
      0.055,
      s.steel,
      this.scene,
    );
    const shade = new T.Mesh(
      new T.ConeGeometry(0.6, 0.45, 48, 1, true),
      s.petrol,
    );
    shade.rotation.z = -0.4;
    shade.position.set(5.6, 4.6, -0.4);
    this.scene.add(shade);
    const lamp = new T.PointLight("#ffb95e", 20, 10, 1.6);
    lamp.position.set(5.5, 4.25, -0.3);
    this.scene.add(lamp);
  }
  pick(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    return this.ray.intersectObjects(
      this.hits.filter((o) => o.visible && o.parent?.visible !== false),
      false,
    )[0];
  }
  bind() {
    let drag: { x: number; y: number; data: Hit; moved: boolean } | null = null;
    this.canvas.addEventListener("pointerdown", (e) => {
      const h = this.pick(e);
      drag = {
        x: e.clientX,
        y: e.clientY,
        data: h?.object.userData || {},
        moved: false,
      };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      const h = this.pick(e);
      this.canvas.style.cursor = h ? "pointer" : "grab";
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) + Math.abs(e.clientY - drag.y) > 7) drag.moved = true;
      this.settleTime = 2;
      if (drag.data.control === "source" && this.selected === "cable") {
        if (this.wirePreview) {
          this.root.remove(this.wirePreview);
          this.wirePreview.geometry.dispose();
        }
        const v = this.ray.ray.intersectPlane(
          new T.Plane(new T.Vector3(0, 0, 1), -2.1),
          new T.Vector3(),
        );
        if (v) {
          this.root.worldToLocal(v);
          this.wirePreview = this.tube(
            [new T.Vector3(3.05, 1.12, 1.9), new T.Vector3(3.2, 0.6, 2.8), v],
            0.06,
            this.surfaces.orange,
          );
        }
      } else if (
        (!drag.data.control && !this.selected) ||
        drag.data.control === "handle"
      ) {
        this.rotTarget = T.MathUtils.clamp(
          this.rotTarget + dx * 0.0025,
          -0.4,
          0.4,
        );
        drag.x = e.clientX;
      }
    });
    this.canvas.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const d = drag.data;
      const target = this.pick(e)?.object.userData as Hit | undefined;
      if (d.control === "reset") {
        if (this.selected) this.onControl(this.selected, "reset");
        else this.onSelect("switches");
      } else if (d.control === "source") {
        if (this.selected !== "cable") this.onSelect("cable");
        else if (target?.socket)
          this.onControl("cable", "connect-" + target.socket);
      } else if (d.module) {
        if (this.selected !== d.module) this.onSelect(d.module);
        else if (
          d.control &&
          (d.control === "small" || d.control === "large" || !drag.moved)
        )
          this.onControl(
            d.module,
            d.socket ? "connect-" + d.socket : d.control,
          );
      }
      this.clearPreview();
      drag = null;
    });
    this.canvas.addEventListener("pointercancel", () => {
      this.clearPreview();
      drag = null;
    });
  }
  clearPreview() {
    if (this.wirePreview) {
      this.root.remove(this.wirePreview);
      this.wirePreview.geometry.dispose();
      this.wirePreview = undefined;
    }
  }
  select(id: string | null) {
    this.selected = id;
    this.rotTarget = 0;
    this.settleTime = 2;
  }
  sync(state: GameState, mission: Mission) {
    this.world = state;
    this.mission = mission;
    this.settleTime = 2;
    this.renderer.shadowMap.needsUpdate = true;
    state.modules.forEach((mod, i) => {
      const mat = this.indicators[i].material as T.MeshPhysicalMaterial;
      mat.color.set(
        !mod.active ? "#5d6256" : mod.complete ? "#d7d998" : mod.fault ? "#e5783f" : "#9a6939",
      );
      mat.emissive.set(
        !mod.active ? "#000000" : mod.complete ? "#68a84c" : mod.fault ? "#c13b12" : "#60300a",
      );
      mat.emissiveIntensity = !mod.active ? 0 : mod.complete ? 1.4 : mod.fault ? 1 : 0.25;
      const mesh = this.serials[mod.id];
      const tex = (mesh.material as T.MeshStandardMaterial).map!;
      const c = tex.image as HTMLCanvasElement;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#d3c4a2";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#242c27";
      ctx.font = `${Math.round(c.height * 0.55)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        mission.modules[i].serial +
          " / " +
          (!mod.active ? "STANDBY" : mod.complete ? "STABLE" : mod.fault ? "VENTED" : "READY"),
        c.width / 2,
        c.height / 2,
        c.width * 0.94,
      );
      tex.needsUpdate = true;
    });
    const c = state.modules[1].world;
    this.clips[0].rotation.x = c.clipA ? -0.75 : 0;
    this.clips[1].rotation.x = c.clipB ? -0.75 : 0;
    const socket = String(c.connected);
    const prev = this.wire.userData.socket;
    if (prev !== socket) {
      this.root.remove(this.wire);
      this.wire.geometry.dispose();
      this.wire = this.makeWire(socket);
      this.wire.userData.socket = socket;
    }
    this.wire.visible = socket !== "none";
    this.looseWire.visible = socket === "none";
    if (this.freePlug) this.freePlug.visible = socket === "none";
    this.tags.forEach((tag, i) => {
      const w = state.modules[2].world;
      tag.visible = state.modules[2].active && ("maintenanceTag" in w || "tagLeft" in w || "tagRight" in w);
      const attached = "maintenanceTag" in w
        ? w.maintenanceTag === (i === 0 ? "left" : "right")
        : !!w[i === 0 ? "tagLeft" : "tagRight"];
      const tex = (tag.material as T.MeshStandardMaterial).map!;
      const card = tex.image as HTMLCanvasElement;
      const ctx = card.getContext("2d")!;
      ctx.fillStyle = attached ? "#b6bf91" : "#d7bd86";
      ctx.fillRect(0, 0, card.width, card.height);
      ctx.fillStyle = "#26362c";
      ctx.font = `${card.height * 0.53}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        attached ? "REPLACED" : i === 0 ? "TAG L" : "TAG R",
        card.width / 2,
        card.height / 2,
        card.width * 0.94,
      );
      tex.needsUpdate = true;
    });
  }
  vent(id: string) {
    this.settleTime = 2;
    const center = CENTERS[id];
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(221,218,196,.55)");
    g.addColorStop(1, "rgba(221,218,196,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const map = new T.CanvasTexture(c);
    map.colorSpace = T.SRGBColorSpace;
    for (let i = 0; i < 9; i++) {
      const sprite = new T.Sprite(
        new T.SpriteMaterial({ map, transparent: true, depthWrite: false }),
      );
      sprite.position
        .copy(center)
        .add(new T.Vector3((Math.random() - 0.5) * 0.6, 0, 0.7));
      sprite.scale.setScalar(0.45);
      this.root.add(sprite);
      this.puffs.push({ sprite, life: 1.2 });
    }
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
    this.settleTime = 2;
  }
  screenControls() {
    this.root.updateMatrixWorld(true);
    const r = this.canvas.getBoundingClientRect();
    return this.hits
      .filter(
        (o) =>
          o.visible &&
          o.parent?.visible !== false &&
          o.userData.control &&
          o.userData.control !== "handle",
      )
      .map((o) => {
        const p = o.getWorldPosition(new T.Vector3()).project(this.camera);
        return {
          module:
            o.userData.module === "current" ? this.selected : o.userData.module,
          control: o.userData.socket
            ? "connect-" + o.userData.socket
            : o.userData.control,
          x: Math.round(r.left + ((p.x + 1) * r.width) / 2),
          y: Math.round(r.top + ((-p.y + 1) * r.height) / 2),
        };
      });
  }
  render(dt: number, draw = true) {
    if (dt === 0 && this.settleTime <= 0) return;
    for (const p of this.puffs) {
      p.life -= dt;
      p.sprite.position.y += dt * 0.8;
      p.sprite.scale.multiplyScalar(1 + dt * 0.6);
      p.sprite.material.opacity = Math.max(0, p.life / 1.2);
    }
    this.puffs = this.puffs.filter((p) => {
      if (p.life <= 0) {
        this.root.remove(p.sprite);
        p.sprite.material.dispose();
        return false;
      }
      return true;
    });
    if (this.settleTime <= 0 && !this.world?.modules[2].world.fan) return;
    this.settleTime -= dt;
    this.elapsed += dt;
    this.rotation += (this.rotTarget - this.rotation) * Math.min(1, dt * 8);
    this.root.rotation.y = this.rotation;
    const selected = this.selected;
    const center = selected ? CENTERS[selected] : new T.Vector3(0, 2.8, 0.35);
    const width =
      selected === "valves"
        ? 6.5
        : selected === "switches"
          ? 5.2
          : selected === "cable"
            ? 4.7
            : 10.5;
    const height =
      selected === "switches"
        ? 2.3
        : selected === "cable"
          ? 6.6
          : selected
            ? 4.4
            : 6.5;
    const fov = Math.tan(T.MathUtils.degToRad(this.camera.fov / 2));
    const dist =
      Math.max(width / (2 * fov * this.camera.aspect), height / (2 * fov)) *
      1.05;
    const pos = selected
      ? new T.Vector3(center.x, center.y + 0.13, center.z + dist)
      : new T.Vector3(-dist * 0.39, center.y + dist * 0.22, dist * 0.92);
    this.camera.position.lerp(pos, Math.min(1, dt * 6));
    this.camera.lookAt(center);
    if (this.world) {
      const v = this.world.modules[0].world;
      this.wheels[0].rotation.z +=
        ((v.small ? 0 : Math.PI / 2) - this.wheels[0].rotation.z) *
        Math.min(1, dt * 10);
      this.wheels[1].rotation.z +=
        ((v.large ? Math.PI / 2 : 0) - this.wheels[1].rotation.z) *
        Math.min(1, dt * 10);
      const pressure = [
        Number(v.pressure || 0),
        Number(this.world.modules[2].world.pressure || 0),
      ];
      this.needles.forEach((needle, i) => {
        const maximum = Number(needle.userData.maximum);
        const target = -(
          2.38 +
          (T.MathUtils.clamp(pressure[i], 0, maximum) / maximum) * 4.61
        );
        needle.rotation.z += (target - needle.rotation.z) * Math.min(1, dt * 8);
      });
      const w = this.world.modules[2].world;
      this.levers[0].rotation.x = w.left ? -0.55 : 0.55;
      this.levers[1].rotation.x = w.right ? -0.55 : 0.55;
      if (w.fan) this.fan.rotation.z += dt * 8;
    }
    if (dt === 0) this.settleTime = 0;
    if (draw) this.renderer.render(this.scene, this.camera);
  }
}
