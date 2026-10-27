import type { Mission, World } from "./content";
export interface ModuleState {
  id: string;
  active: boolean;
  step: number;
  done: string[];
  complete: boolean;
  world: World;
  fault: boolean;
}
export interface Evidence {
  action: string;
  module: string;
  correct: boolean;
  assisted: boolean;
  retry: number;
}
export interface GameState {
  modules: ModuleState[];
  strikes: number;
  status: "playing" | "shutdown" | "ready" | "won";
  assisted: boolean;
  retries: number;
  events: Evidence[];
  relay: boolean;
  prediction: boolean;
  feedback: string;
}
export function createState(m: Mission): GameState {
  return {
    modules: m.modules.map((v) => ({
      id: v.id,
      active: !m.activeModules || m.activeModules.includes(v.id),
      step: 0,
      done: [],
      complete: !!m.activeModules && !m.activeModules.includes(v.id),
      world: { ...v.initial },
      fault: false,
    })),
    strikes: 0,
    status: "playing",
    assisted: m.stage === "guided",
    retries: 0,
    events: [],
    relay: !m.relay,
    prediction: !m.prediction,
    feedback: "",
  };
}
export function nextActions(s: GameState, m: Mission, id: string) {
  const mod = s.modules.find((x) => x.id === id)!;
  return (m.modules.find((x) => x.id === id)!.steps[mod.step] || []).filter(
    (a) => !mod.done.includes(a),
  );
}
export function act(
  s: GameState,
  m: Mission,
  id: string,
  action: string,
): boolean {
  if (s.status !== "playing") return false;
  const mod = s.modules.find((v) => v.id === id)!;
  const spec = m.modules.find((v) => v.id === id)!;
  if (!mod.active || mod.complete || mod.fault) return false;
  const good = nextActions(s, m, id).includes(action);
  s.events.push({
    action,
    module: id,
    correct: good,
    assisted: s.assisted,
    retry: s.retries,
  });
  if (action === "test" && spec.startup) {
    const rule = spec.startup;
    mod.world.pressure =
      Number(mod.world.pressure) +
      (mod.world.fan ? rule.deltaWithFan : rule.deltaWithoutFan);
    mod.world.signal =
      Number(mod.world.pressure) >= rule.stopAt ? "stopped" : "safe startup";
  }
  if (!good) {
    s.strikes++;
    mod.fault = true;
    s.feedback = spec.feedback;
    s.status = s.strikes >= 3 ? "shutdown" : "playing";
    return false;
  }
  const effect = { ...spec.effect[action] };
  if (spec.startup && action === "test") {
    delete effect.pressure;
    delete effect.signal;
  }
  Object.assign(mod.world, effect);
  if (spec.pressureRule && /^(small|large)-(open|close)$/.test(action)) {
    const bits = `${Number(!!mod.world.small)}${Number(!!mod.world.large)}` as "00" | "01" | "10" | "11";
    mod.world.pressure = spec.pressureRule[bits];
  }
  mod.done.push(action);
  if (spec.steps[mod.step].every((a) => mod.done.includes(a))) {
    mod.step++;
    mod.done = [];
  }
  if (mod.step === spec.steps.length) {
    mod.complete = true;
    mod.world.signal = "stable";
    s.feedback = "המודול יציב. ההוראה הפכה לפעולה מדויקת.";
  } else s.feedback = "הפעולה התקבלה. המשיכו לפי המדריך.";
  checkReady(s);
  return true;
}
export function checkReady(s: GameState) {
  if (s.modules.every((x) => x.complete) && s.relay && s.prediction)
    s.status = "ready";
}
export function resetModule(s: GameState, m: Mission, id: string) {
  if (s.status === "won" || s.status === "shutdown") return;
  if (!s.modules.find((x) => x.id === id)?.active) return;
  const n = createState(m).modules.find((x) => x.id === id)!;
  const index = s.modules.findIndex((x) => x.id === id);
  s.modules[index] = n;
  s.retries++;
  s.status = "playing";
  s.feedback = "המודול אופס. מצב ההתחלה חזר; הפסילות נשמרות.";
}
export function choose(
  s: GameState,
  m: Mission,
  type: "relay" | "prediction",
  value: number,
) {
  const c = m[type];
  if (!c || s.status !== "playing") return false;
  const good = c.correct === value;
  s.events.push({
    action: `${type}:${value}`,
    module: type,
    correct: good,
    assisted: s.assisted,
    retry: s.retries,
  });
  if (good) {
    s[type] = true;
    s.feedback =
      type === "relay"
        ? "ההודעה שומרת את הפעולה, הסדר והמגבלה."
        : "תחזית נכונה. עכשיו מנעו אותה בעזרת התוכנית.";
    checkReady(s);
  } else {
    s.assisted = true;
    s.feedback =
      "ההודעה השמיטה או שינתה פרט שמשנה את הפעולה. קראו שוב את התנאי, הסדר והאיסור.";
  }
  return good;
}
