import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** Locally authored procedural PBR maps. No remote assets or runtime generation. */
export type WorkshopSurface =
  | "ivory"
  | "petrol"
  | "brass"
  | "steel"
  | "rubber"
  | "wood"
  | "orange"
  | "paper";
export interface WorkshopSurfaces {
  ivory: T.MeshStandardMaterial;
  petrol: T.MeshStandardMaterial;
  /** Compatibility alias for the recessed petrol painted metal. */
  dark: T.MeshStandardMaterial;
  brass: T.MeshStandardMaterial;
  steel: T.MeshStandardMaterial;
  rubber: T.MeshStandardMaterial;
  wood: T.MeshStandardMaterial;
  orange: T.MeshStandardMaterial;
  paper: T.MeshStandardMaterial;
  glass: T.MeshPhysicalMaterial;
  /** All texture requests have settled. Errors reject this promise. */
  ready: Promise<void>;
  /** A clone with independently adjustable texture tiling. Defaults remain unchanged. */
  variant: (
    kind: WorkshopSurface,
    repeat?: [number, number],
  ) => T.MeshStandardMaterial;
  dispose: () => void;
}

/**
 * Enamel/paint uses correlated edge chips, grime, roughness and exposed metal.
 * Brass/steel uses flowing tarnish fields and directional brushing.
 * Wood uses warped growth rings, knots, pores and long swept scratches.
 * Default maps cover one UV face. Do not densely tile edge-worn paint maps.
 */
export function createWorkshopSurfaces(
  renderer?: T.WebGLRenderer,
  onLoad?: () => void,
): WorkshopSurfaces {
  const loader = new T.TextureLoader();
  const anisotropy = Math.min(
    8,
    renderer?.capabilities.getMaxAnisotropy() ?? 4,
  );
  const textures: T.Texture[] = [];
  const pending: Promise<void>[] = [];
  const variants: T.Material[] = [];
  const load = (kind: WorkshopSurface, channel: string, color = false) => {
    let resolve!: () => void;
    let reject!: (reason: Error) => void;
    pending.push(
      new Promise<void>((yes, no) => {
        resolve = yes;
        reject = no;
      }),
    );
    const path = `${import.meta.env.BASE_URL}textures/${kind}-${channel}.png`;
    const texture = loader.load(
      path,
      () => {
        resolve();
        onLoad?.();
      },
      undefined,
      () => reject(new Error(`Workshop texture unavailable: ${path}`)),
    );
    texture.name = `${kind}/${channel}`;
    texture.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.anisotropy = anisotropy;
    texture.minFilter = T.LinearMipmapLinearFilter;
    textures.push(texture);
    return texture;
  };
  const materials = {} as Record<WorkshopSurface, T.MeshStandardMaterial>;
  const bumps: Record<WorkshopSurface, number> = {
    ivory: 0.009,
    petrol: 0.007,
    brass: 0.004,
    steel: 0.003,
    rubber: 0.005,
    wood: 0.018,
    orange: 0.005,
    paper: 0.003,
  };
  for (const kind of [
    "ivory",
    "petrol",
    "brass",
    "steel",
    "rubber",
    "wood",
    "orange",
    "paper",
  ] as const) {
    materials[kind] = new T.MeshStandardMaterial({
      name: `workshop/${kind}`,
      color: 0xffffff,
      map: load(kind, "color", true),
      roughness: 1,
      roughnessMap: load(kind, "roughness"),
      metalness: ["ivory", "petrol", "brass", "steel"].includes(kind) ? 1 : 0,
      metalnessMap: ["ivory", "petrol", "brass", "steel"].includes(kind)
        ? load(kind, "metalness")
        : null,
      bumpMap: load(kind, "height"),
      bumpScale: bumps[kind],
      envMapIntensity: kind === "brass" || kind === "steel" ? 1.15 : 0.85,
    });
  }
  const glass = new T.MeshPhysicalMaterial({
    name: "workshop/gauge-glass",
    color: "#c8e2dc",
    roughness: 0.075,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.055,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    envMapIntensity: 1.3,
    side: T.DoubleSide,
  });
  // Keep transparent gauge glass slightly proud of dial faces to avoid z-fighting.
  // No transmission pass is needed; this keeps the mechanism readable and cheap.
  return {
    ...materials,
    dark: materials.petrol,
    glass,
    ready: Promise.all(pending).then(() => undefined),
    variant(kind, repeat = [1, 1]) {
      const material = materials[kind].clone();
      for (const slot of [
        "map",
        "roughnessMap",
        "metalnessMap",
        "bumpMap",
      ] as const) {
        const source = material[slot];
        if (source) {
          const texture = source.clone();
          texture.repeat.set(...repeat);
          texture.needsUpdate = true;
          material[slot] = texture;
          textures.push(texture);
        }
      }
      variants.push(material);
      return material;
    },
    dispose() {
      textures.forEach((texture) => texture.dispose());
      Object.values(materials).forEach((material) => material.dispose());
      variants.forEach((material) => material.dispose());
      glass.dispose();
    },
  };
}

/**
 * Reflection source for believable brass/enamel highlights. It is independent
 * of the 2D workshop backdrop: the background is never used as fake geometry.
 * Assign `scene.environment = env.texture`, then tune directional lights/exposure.
 * Start scene.environmentIntensity around .6–.9 and hemisphere intensity <= .8.
 */
export function createWorkshopEnvironment(renderer: T.WebGLRenderer) {
  const room = new RoomEnvironment();
  room.traverse((object) => {
    if (object instanceof T.Light) object.color.set("#ffe8c8");
    if (object instanceof T.Mesh) {
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) {
        // Room walls are non-emissive. Warm only existing area-light panels;
        // warming every material would turn the entire room into a light box.
        if (
          "emissive" in material &&
          material.emissive instanceof T.Color &&
          material.emissive.getHex() !== 0
        )
          material.emissive.set("#fff1d6");
      }
    }
  });
  const generator = new T.PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.035);
  room.dispose();
  generator.dispose();
  return { texture: target.texture, dispose: () => target.dispose() };
}
