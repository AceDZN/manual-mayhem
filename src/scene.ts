import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { Mission } from "./content";
import type { GameState } from "./rules";
const ivory = new T.MeshStandardMaterial({
  color: "#e4d9bf",
  roughness: 0.45,
  metalness: 0.45,
});
const dark = new T.MeshStandardMaterial({
  color: "#163b3d",
  roughness: 0.5,
  metalness: 0.55,
});
const brass = new T.MeshStandardMaterial({
  color: "#ba8b41",
  roughness: 0.27,
  metalness: 0.78,
});
const orange = new T.MeshStandardMaterial({ color: "#e5682e", roughness: 0.6 });
const steel = new T.MeshStandardMaterial({
  color: "#8d9d97",
  roughness: 0.3,
  metalness: 0.85,
});
const rubber = new T.MeshStandardMaterial({ color: "#142322", roughness: 0.8 });
const paper = new T.MeshStandardMaterial({ color: "#f0e6c7", roughness: 0.8 });
interface HitData {
  module?: string;
  control?: string;
  socket?: string;
}
export class EngineScene {
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
  renderer: T.WebGLRenderer;
  root = new T.Group();
  ray = new T.Raycaster();
  pointer = new T.Vector2();
  hits: T.Object3D[] = [];
  wheelSmall = new T.Group();
  wheelLarge = new T.Group();
  toggleL!: T.Mesh;
  toggleR!: T.Mesh;
  fan!: T.Group;
  gaugeNeedle!: T.Mesh;
  wire!: T.Mesh;
  wirePreview?: T.Mesh;
  lights: T.Mesh[] = [];
  tagButtons: T.Mesh[] = [];
  clips: T.Mesh[] = [];
  valveStates: T.Mesh[] = [];
  puffs: { sprite: T.Sprite; life: number }[] = [];
  moduleGroups: Record<string, T.Group> = {};
  selected: string | null = null;
  rotation = 0;
  rotTarget = 0;
  elapsed = 0;
  settleTime = 3;
  faultFlash = 0;
  world: GameState | null = null;
  mission: Mission | null = null;
  labels: Record<string, T.Mesh> = {};
  onSelect: (id: string | null) => void = () => {};
  onControl: (id: string, control: string) => void = () => {};
  constructor(public canvas: HTMLCanvasElement) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene.background = new T.Color("#202f30");
    this.scene.fog = new T.Fog("#202f30", 21, 48);
    this.camera.position.set(5.8, 5.3, 12.7);
    this.scene.add(this.root);
    this.scene.add(new T.HemisphereLight("#f7e8c4", "#334848", 2.3));
    const key = new T.DirectionalLight("#ffe3b1", 5);
    key.position.set(-5, 11, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -8;
    this.scene.add(key);
    const fill = new T.DirectionalLight("#afdadc", 1.7);
    fill.position.set(8, 4, -5);
    this.scene.add(fill);
    const lamp = new T.PointLight("#ffb36c", 40, 20);
    lamp.position.set(-6, 5, 0);
    this.scene.add(lamp);
    this.build();
    this.bind();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }
  box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: T.Material = ivory,
    parent: T.Object3D = this.root,
    r = 0.06,
  ) {
    const mesh = new T.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  cyl(
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    mat: T.Material = brass,
    parent: T.Object3D = this.root,
  ) {
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, h, 32), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  line(
    points: T.Vector3[],
    r: number,
    mat: T.Material = brass,
    parent: T.Object3D = this.root,
  ) {
    const mesh = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 32, r, 8, false),
      mat,
    );
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  label(
    text: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = this.root,
    bg = "#e6dabc",
    fg = "#203d3d",
  ) {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = Math.max(96, Math.round((768 * h) / w));
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.min(160, c.height * 0.72)}px monospace`;
    if (text === "□" || text === "○") {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 18;
      const size = Math.min(c.width, c.height) * 0.65;
      ctx.beginPath();
      if (text === "□")
        ctx.rect((c.width - size) / 2, (c.height - size) / 2, size, size);
      else ctx.arc(c.width / 2, c.height / 2, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else ctx.fillText(text, c.width / 2, c.height / 2, c.width * 0.96);
    const texture = new T.CanvasTexture(c);
    texture.anisotropy = 4;
    const mesh = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        transparent: true,
      }),
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  hit(obj: T.Object3D, data: HitData) {
    obj.userData = data;
    this.hits.push(obj);
    return obj;
  }
  wheel(group: T.Group, r: number, x: number, y: number) {
    group.position.set(x, y, 1.54);
    this.root.add(group);
    this.cyl(0.18, 0.23, 0, 0, 0, brass, group);
    const torus = new T.Mesh(new T.TorusGeometry(r, 0.065, 12, 48), brass);
    group.add(torus);
    for (let i = 0; i < 4; i++) {
      const spoke = this.box(r * 1.8, 0.065, 0.07, 0, 0, 0, brass, group, 0.02);
      spoke.rotation.z = (i * Math.PI) / 2;
    }
    this.cyl(0.06, 0.08, r * 0.74, r * 0.58, 0.06, orange, group);
    this.hit(torus, { module: "valves", control: r < 0.5 ? "small" : "large" });
    const proxy = new T.Mesh(
      new T.CircleGeometry(r + 0.13, 32),
      new T.MeshBasicMaterial({ visible: false }),
    );
    group.add(proxy);
    this.hit(proxy, { module: "valves", control: r < 0.5 ? "small" : "large" });
  }
  build() {
    const floor = this.box(
      60,
      0.5,
      60,
      0,
      -0.5,
      0,
      new T.MeshStandardMaterial({ color: "#324342", roughness: 0.95 }),
      this.scene,
    );
    floor.receiveShadow = true;
    const table = this.box(
      18,
      0.35,
      8,
      0,
      0.15,
      0,
      new T.MeshStandardMaterial({ color: "#72513a", roughness: 0.82 }),
      this.scene,
    );
    for (let i = 0; i < 30; i++) {
      this.box(
        0.012,
        0.003,
        7.9,
        -8.6 + i * 0.58,
        0.329,
        0,
        new T.MeshStandardMaterial({ color: i % 2 ? "#896346" : "#543e2f" }),
        this.scene,
        0.001,
      );
    }
    this.box(10.4, 0.17, 3.6, 0, 0.45, 0.1, rubber);
    this.box(9.45, 3.7, 2.25, 0, 2.45, 0, ivory);
    this.box(9.25, 3.44, 0.13, 0, 2.45, 1.19, dark);
    this.box(9.5, 0.22, 0.3, 0, 0.7, 1.28, steel);
    this.box(9.5, 0.22, 0.3, 0, 4.2, 1.28, ivory);
    for (const x of [-4.4, 4.4]) {
      this.box(0.35, 3.7, 2.45, x, 2.45, 0, steel);
      this.box(0.22, 2.9, 0.3, x, 2.45, 1.28, ivory);
      for (const y of [0.8, 4.05]) this.cyl(0.1, 0.07, x, y, 1.48, steel);
    }
    for (const x of [-2.7, 2.7]) {
      this.box(0.21, 0.8, 0.24, x, 4.55, 0, steel);
      this.cyl(0.18, 0.35, x, 4.85, 0, steel);
    }
    this.box(5.6, 0.32, 0.34, 0, 4.92, 0, orange);
    this.hit(
      this.box(
        6,
        0.6,
        0.7,
        0,
        4.9,
        0,
        new T.MeshBasicMaterial({ visible: false }),
      ),
      { control: "handle" },
    );
    const panels = [
      ["valves", -2.35, 3.5],
      ["cable", 0.95, 2.85],
      ["switches", 3.28, 1.55],
    ] as const;
    for (const [id, x, w] of panels) {
      const g = new T.Group();
      this.moduleGroups[id] = g;
      this.root.add(g);
      this.box(w, 3.05, 0.18, x, 2.45, 1.33, dark, g);
      this.hit(
        this.box(
          w,
          3.05,
          0.015,
          x,
          2.45,
          1.45,
          new T.MeshBasicMaterial({ visible: false }),
          g,
        ),
        { module: id },
      );
      this.label(
        id === "valves"
          ? "01 / VALVE BAY"
          : id === "cable"
            ? "02 / PATCH BAY"
            : "03 / RELAY",
        w - 0.2,
        0.25,
        x,
        3.82,
        1.47,
      );
      this.labels[id] = this.label("", w - 0.2, 0.17, x, 1.08, 1.47);
      const l = this.cyl(
        0.065,
        0.05,
        x + w / 2 - 0.15,
        3.81,
        1.53,
        new T.MeshStandardMaterial({
          color: "#b36d40",
          emissive: "#a64f16",
          emissiveIntensity: 0.7,
        }),
      );
      this.lights.push(l);
      for (const xx of [x - w / 2 + 0.1, x + w / 2 - 0.1])
        for (const yy of [1.15, 3.73])
          this.cyl(0.04, 0.02, xx, yy, 1.49, steel);
    }
    this.wheel(this.wheelSmall, 0.43, -3.12, 2.5);
    this.wheel(this.wheelLarge, 0.66, -1.68, 2.5);
    this.label("SMALL / A", 1, 0.2, -3.12, 1.68, 1.51);
    this.label("LARGE / B", 1.2, 0.2, -1.68, 1.41, 1.51);
    for (const x of [-3.12, -1.68])
      this.line(
        [
          new T.Vector3(x, 1.4, 1.5),
          new T.Vector3(x, 2, 1.5),
          new T.Vector3(x, 3.36, 1.5),
        ],
        0.075,
      );
    this.cyl(0.4, 0.15, -2.4, 3.25, 1.51, brass);
    this.cyl(
      0.33,
      0.17,
      -2.4,
      3.25,
      1.59,
      new T.MeshStandardMaterial({ color: "#c9e6ea", roughness: 0.35 }),
    );
    this.label("1  2  3", 0.53, 0.13, -2.4, 3.33, 1.69);
    this.gaugeNeedle = this.box(0.3, 0.025, 0.02, -2.4, 3.22, 1.71, rubber);
    this.label(
      "GAUGE",
      0.65,
      0.12,
      -2.4,
      3.02,
      1.71,
      this.root,
      "#c9e6ea",
      "#17516c",
    );
    this.hit(
      this.label("TEST", 0.62, 0.22, -3.48, 1.31, 1.51, this.root, "#df7138"),
      { module: "valves", control: "test" },
    );
    // socket module: screens establish reference, never color alone
    this.box(0.78, 0.58, 0.13, 0.3, 3.18, 1.52, brass);
    this.box(
      0.67,
      0.46,
      0.05,
      0.3,
      3.18,
      1.61,
      new T.MeshStandardMaterial({
        color: "#143d38",
        emissive: "#1c6b52",
        emissiveIntensity: 0.45,
      }),
    );
    this.label(
      "□",
      0.5,
      0.35,
      0.3,
      3.18,
      1.65,
      this.root,
      "#153c35",
      "#b9e2ba",
    );
    this.cyl(0.34, 0.1, 1.57, 3.18, 1.54, brass);
    this.cyl(0.28, 0.12, 1.57, 3.18, 1.6, dark);
    this.label(
      "○",
      0.42,
      0.35,
      1.57,
      3.18,
      1.68,
      this.root,
      "#153c35",
      "#b9e2ba",
    );
    for (const [x, id] of [
      [0.3, "square"],
      [1.57, "round"],
    ] as const) {
      this.cyl(0.22, 0.12, x, 2.45, 1.6, steel);
      this.hit(this.cyl(0.15, 0.15, x, 2.45, 1.68, rubber), {
        module: "cable",
        control: "socket",
        socket: id,
      });
      this.label(id === "square" ? "□ IN" : "○ IN", 0.6, 0.18, x, 2.04, 1.54);
    }
    this.hit(this.cyl(0.17, 0.18, 0.91, 1.43, 1.7, orange), {
      module: "cable",
      control: "source",
    });
    this.label("OUT", 0.5, 0.15, 0.91, 1.16, 1.55);
    for (const [x, id] of [
      [0.07, "clip-a"],
      [1.83, "clip-b"],
    ] as const) {
      const clip = this.box(0.35, 0.4, 0.23, x, 1.6, 1.63, steel);
      this.clips.push(clip);
      this.hit(clip, { module: "cable", control: id });
      this.label(id === "clip-a" ? "A" : "B", 0.3, 0.17, x, 1.31, 1.78);
    }
    this.hit(
      this.label("TEST", 0.65, 0.26, 0.94, 1.89, 1.55, this.root, "#df7138"),
      { module: "cable", control: "test" },
    );
    this.wire = this.line(
      [
        new T.Vector3(0.91, 1.43, 1.88),
        new T.Vector3(0.9, 0.75, 2.8),
        new T.Vector3(0.3, 1.3, 2.6),
        new T.Vector3(0.3, 2.45, 1.8),
      ],
      0.065,
      rubber,
    );
    this.wire.visible = false;
    // raised lever controls
    for (const [x, side] of [
      [2.91, "left"],
      [3.64, "right"],
    ] as const) {
      this.cyl(0.14, 0.1, x, 2.75, 1.57, steel);
      const lever = this.box(0.08, 0.42, 0.1, x, 2.88, 1.75, steel);
      this.hit(this.box(0.25, 0.15, 0.18, x, 3.07, 1.8, orange), {
        module: "switches",
        control: side,
      });
      this.hit(lever, { module: "switches", control: side });
      if (side === "left") this.toggleL = lever;
      else this.toggleR = lever;
      this.label(side === "left" ? "LEFT" : "RIGHT", 0.61, 0.17, x, 2.45, 1.55);
    }
    for (const [x, side] of [
      [2.91, "left"],
      [3.64, "right"],
    ] as const) {
      const tag = this.label(
        "LOG " + (side === "left" ? "L" : "R"),
        0.58,
        0.21,
        x,
        2.15,
        1.63,
        this.root,
        "#e4c994",
      );
      this.hit(tag, { module: "switches", control: "tag-" + side });
      this.tagButtons.push(tag);
    }
    this.fan = new T.Group();
    this.fan.position.set(3.27, 1.85, 1.65);
    this.root.add(this.fan);
    this.cyl(0.28, 0.08, 0, 0, 0, steel, this.fan);
    for (let i = 0; i < 3; i++) {
      const b = this.box(0.44, 0.11, 0.07, 0, 0, 0.1, dark, this.fan);
      b.rotation.z = (i * Math.PI) / 3;
    }
    this.hit(this.fan.children[0], { module: "switches", control: "fan" });
    this.hit(
      this.label("FAN", 0.6, 0.19, 3.28, 1.44, 1.57, this.root, "#e2d5b5"),
      { module: "switches", control: "fan" },
    );
    this.hit(
      this.label("TEST", 0.6, 0.24, 3.28, 1.13, 1.57, this.root, "#df7138"),
      { module: "switches", control: "test" },
    );
    // side vents, bolts, feet and live gauge glass
    for (let i = 0; i < 8; i++) {
      this.box(0.06, 0.12, 1.42, -4.59, 1.3 + i * 0.31, -0.1, rubber);
      this.box(0.06, 0.12, 1.42, 4.59, 1.3 + i * 0.31, -0.1, rubber);
    }
    for (const x of [-3.65, 3.65]) {
      this.box(0.9, 0.25, 1.9, x, 0.48, 0, rubber);
    }
    // room detail with physical depth and restrained palette
    for (let i = 0; i < 4; i++) {
      this.box(
        25,
        0.12,
        0.25,
        0,
        1 + i * 1.4,
        -6,
        new T.MeshStandardMaterial({ color: "#364440" }),
        this.scene,
      );
    }
    this.box(2.7, 3.6, 0.2, -8, 2.2, -5, ivory, this.scene);
    for (let i = 0; i < 6; i++)
      this.box(2.2, 0.025, 0.03, -8, 3.5 - i * 0.4, -4.87, steel, this.scene);
    this.box(0.2, 4, 0.2, 7, 2, -3, steel, this.scene);
    this.box(2, 0.15, 1.3, 6.3, 4, -3, orange, this.scene);
    const loader = new GLTFLoader();
    for (const [path, scale, pos, rot] of [
      ["pump.glb", 2.1, [-5.15, 0.33, 1.3], 0.5],
      ["service-arm.glb", 2.8, [5.3, 0.33, -1.5], -0.8],
    ] as [string, number, number[], number][]) {
      loader.load(
        `${import.meta.env.BASE_URL}models/${path}`,
        (g) => {
          g.scene.scale.setScalar(scale);
          g.scene.position.set(...(pos as [number, number, number]));
          g.scene.rotation.y = rot;
          g.scene.traverse((o) => {
            if (o instanceof T.Mesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          this.scene.add(g.scene);
          this.renderer.shadowMap.needsUpdate = true;
        },
        undefined,
        (e) => console.warn("Model unavailable", path, e),
      );
    }
  }
  pick(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    return this.ray.intersectObjects(
      this.hits.filter((o) => o.visible),
      false,
    )[0];
  }
  bind() {
    let drag: { x: number; y: number; data: HitData; moved: boolean } | null =
      null;
    this.canvas.addEventListener("pointerdown", (e) => {
      const hit = this.pick(e);
      drag = {
        x: e.clientX,
        y: e.clientY,
        data: hit?.object.userData || {},
        moved: false,
      };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      const hit = this.pick(e);
      if (drag) this.settleTime = 2;
      this.canvas.style.cursor = hit ? "pointer" : "grab";
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) + Math.abs(e.clientY - drag.y) > 8) drag.moved = true;
      if (drag.data.control === "source") {
        if (this.wirePreview) this.root.remove(this.wirePreview);
        const v = this.ray.ray.at(11, new T.Vector3());
        this.root.worldToLocal(v);
        this.wirePreview = this.line(
          [new T.Vector3(0.91, 1.43, 1.9), new T.Vector3(0.8, 1, 2.8), v],
          0.045,
          orange,
        );
      } else if (
        (!drag.data.control && !this.selected) ||
        drag.data.control === "handle"
      ) {
        this.rotTarget = Math.max(
          -0.65,
          Math.min(0.65, this.rotTarget + dx * 0.003),
        );
        drag.x = e.clientX;
      }
    });
    this.canvas.addEventListener("pointerup", (e) => {
      if (!drag) return;
      const target = this.pick(e)?.object.userData as HitData | undefined;
      const d = drag.data;
      if (d.control === "source") {
        if (this.selected !== "cable") this.onSelect("cable");
        else if (target?.socket)
          this.onControl("cable", "connect-" + target.socket);
      } else if (d.control === "small" || d.control === "large") {
        if (this.selected === "valves") this.onControl("valves", d.control);
        else this.onSelect("valves");
      } else if (!drag.moved && d.module) {
        if (this.selected === d.module && d.control) {
          this.onControl(
            d.module,
            d.socket ? "connect-" + d.socket : d.control,
          );
        } else this.onSelect(d.module);
      }
      if (this.wirePreview) {
        this.root.remove(this.wirePreview);
        (this.wirePreview.geometry as T.BufferGeometry).dispose();
        this.wirePreview = undefined;
      }
      drag = null;
    });
    this.canvas.addEventListener("pointercancel", () => {
      drag = null;
      if (this.wirePreview) {
        this.root.remove(this.wirePreview);
        this.wirePreview = undefined;
      }
    });
  }
  select(id: string | null) {
    this.settleTime = 2;
    this.selected = id;
    this.rotTarget = 0;
  }
  sync(state: GameState, mission: Mission) {
    this.settleTime = 2;
    this.world = state;
    this.mission = mission;
    this.renderer.shadowMap.needsUpdate = true;
    for (const [i, mod] of state.modules.entries()) {
      (this.lights[i].material as T.MeshStandardMaterial).color.set(
        mod.complete ? "#9ec99a" : mod.fault ? "#ed6e2a" : "#8e6840",
      );
      (this.lights[i].material as T.MeshStandardMaterial).emissive.set(
        mod.complete ? "#448d60" : mod.fault ? "#a54012" : "#553516",
      );
      const old = this.labels[mod.id];
      const spec = mission.modules.find((x) => x.id === mod.id)!;
      const x = mod.id === "valves" ? -2.35 : mod.id === "cable" ? 0.95 : 3.28;
      const w = mod.id === "valves" ? 3.3 : mod.id === "cable" ? 2.65 : 1.35;
      this.root.remove(old);
      (old.material as T.MeshStandardMaterial).map?.dispose();
      old.geometry.dispose();
      this.labels[mod.id] = this.label(
        spec.serial +
          " • " +
          (mod.complete ? "STABLE" : mod.fault ? "RESET" : "READY"),
        w,
        0.17,
        x,
        1.01,
        1.49,
      );
    }
    this.tagButtons.forEach((tag, i) => {
      tag.visible = mission.id === "g9-independent";
      const attached =
        state.modules[2].world.maintenanceTag === (i === 0 ? "left" : "right");
      const mat = tag.material as T.MeshStandardMaterial;
      mat.color.set(attached ? "#a6d9ad" : "#ffffff");
      const tex = mat.map!;
      const card = tex.image as HTMLCanvasElement;
      const ctx = card.getContext("2d")!;
      ctx.fillStyle = "#e4c994";
      ctx.fillRect(0, 0, card.width, card.height);
      ctx.fillStyle = "#203d3d";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 108px monospace";
      ctx.fillText(
        attached ? "REPLACED" : i === 0 ? "TAG L" : "TAG R",
        card.width / 2,
        card.height / 2,
        card.width * 0.94,
      );
      tex.needsUpdate = true;
    });
    const c = state.modules[1].world;
    this.clips[0].rotation.x = c.clipA ? -0.7 : 0;
    this.clips[1].rotation.x = c.clipB ? -0.7 : 0;
    this.wire.visible = c.connected !== "none";
    if (this.wire.visible) {
      this.root.remove(this.wire);
      this.wire.geometry.dispose();
      this.wire = this.line(
        [
          new T.Vector3(0.91, 1.43, 1.88),
          new T.Vector3(0.9, 0.76, 2.6),
          new T.Vector3(c.connected === "round" ? 1.57 : 0.3, 1.35, 2.35),
          new T.Vector3(c.connected === "round" ? 1.57 : 0.3, 2.45, 1.84),
        ],
        0.065,
        rubber,
      );
    }
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height, false);
    this.settleTime = 2;
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }
  vent(id: string) {
    this.settleTime = 2;
    const x = id === "valves" ? -2.35 : id === "cable" ? 0.95 : 3.28;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(225,231,212,.6)");
    g.addColorStop(1, "rgba(225,231,212,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const map = new T.CanvasTexture(c);
    for (let i = 0; i < 8; i++) {
      const sprite = new T.Sprite(
        new T.SpriteMaterial({ map, transparent: true, depthWrite: false }),
      );
      sprite.position.set(
        x + (Math.random() - 0.5) * 0.7,
        2.5 + Math.random() * 0.3,
        1.9,
      );
      sprite.scale.setScalar(0.4 + Math.random() * 0.4);
      this.root.add(sprite);
      this.puffs.push({ sprite, life: 1.4 });
    }
  }
  render(dt: number) {
    for (const p of this.puffs) {
      p.life -= dt;
      p.sprite.position.y += dt * 0.9;
      p.sprite.scale.multiplyScalar(1 + dt * 0.7);
      p.sprite.material.opacity = Math.max(0, p.life / 1.4);
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
    const center =
      this.selected === "valves"
        ? -2.35
        : this.selected === "cable"
          ? 0.95
          : this.selected === "switches"
            ? 3.28
            : 0;
    const pos = this.selected
      ? new T.Vector3(center, 2.65, 9.3)
      : new T.Vector3(5.8, 5.3, 12.7);
    const look = this.selected
      ? new T.Vector3(center, 2.45, 1.3)
      : new T.Vector3(0, 2.35, 0.2);
    if (this.camera.aspect < 0.85 && !this.selected) pos.set(7, 7, 22);
    this.camera.position.lerp(pos, Math.min(1, dt * 5));
    this.camera.lookAt(look);
    if (this.world) {
      const v = this.world.modules[0].world;
      const target = v.small ? 0 : Math.PI / 2;
      this.wheelSmall.rotation.z +=
        (target - this.wheelSmall.rotation.z) * Math.min(1, dt * 9);
      this.wheelLarge.rotation.z +=
        ((v.large ? Math.PI / 2 : 0) - this.wheelLarge.rotation.z) *
        Math.min(1, dt * 9);
      this.gaugeNeedle.rotation.z = 0.9 - Number(v.pressure || 1) * 0.5;
      const s = this.world.modules[2].world;
      this.toggleL.rotation.x = s.left ? -0.5 : 0.5;
      this.toggleR.rotation.x = s.right ? -0.5 : 0.5;
      if (s.fan) this.fan.rotation.z += dt * 7;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
