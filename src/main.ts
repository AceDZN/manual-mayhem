import "./style.css";
import { MISSIONS, STAGE_HE, PAIRED_STARTUP, type Mission } from "./content";
import { createState, act, choose, resetModule, type GameState } from "./rules";
import { EngineScene } from "./scene";
import { AudioEngine } from "./audio";
const app = document.querySelector<HTMLDivElement>("#app")!;
const partner =
  new URLSearchParams(location.search).has("manual") ||
  location.pathname.endsWith("/manual");
const audio = new AudioEngine();
let mission: Mission = MISSIONS[0],
  state: GameState = createState(mission),
  started = false,
  manual = true,
  paused = false,
  settings = false,
  selected: string | null = null,
  translation = false,
  controlsOpen = false,
  manualPage = "valves",
  challenge = false,
  time = 240,
  paired = false;
const seed = Math.floor(Math.random() * 0xffffffff);
let renderedPaperKey = "";
let records: Record<
    string,
    { strikes: number; assisted: boolean; retries: number; events: number }
  > = {},
  attempts: Record<string, number> = {};
try {
  records = JSON.parse(localStorage.getItem("mm-records") || "{}");
  attempts = JSON.parse(localStorage.getItem("mm-attempts") || "{}");
} catch {}
const key = () => mission.id + (paired ? "-b" : "");
state.retries = attempts[key()] || 0;
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function remember() {
  attempts[key()] = Math.max(attempts[key()] || 0, state.retries + 1);
  try {
    localStorage.setItem("mm-attempts", JSON.stringify(attempts));
  } catch {}
}
const NAMES: Record<string, string> = {
  valves: "ברזים",
  cable: "חיבור הכבל",
  switches: "מנופים",
  operator: "מסר למפעיל",
};
function manualArticle(m: Mission) {
  return `<article class="manual-mission"><div class="serial">GRADE ${m.grade} / ${STAGE_HE[m.stage]}</div><h2>${m.title}</h2>${m.modules.map((s) => `<section><h3>${s.serial} · ${s.title}</h3><p lang="en" dir="ltr">${s.manual}</p></section>`).join("")}${m.relay ? `<section><h3>OPERATOR MESSAGE</h3><p lang="en" dir="ltr">${m.relay.source}</p></section>` : ""}</article>`;
}
if (partner) {
  app.innerHTML = `<main class="reader"><header><div class="brand">MANUAL MAYHEM<small>FESTIVAL ENGINE / FIELD MANUAL</small></div><button onclick="print()">הדפסה</button></header><div class="reader-intro" dir="rtl"><h1>מדריך השותף</h1><p>המפעיל מתאר את תג המודול ואת מצבו. מצאו את הדגם, קראו את הנוהל ומסרו פעולה, חפץ, סדר ומגבלה. המדריך הזה קבוע ואין בו מידע חי מהמכונה.</p><a href="./">חזרה למכונה ←</a></div>${MISSIONS.map(manualArticle).join("")}<article><h3>S-24 / ALTERNATE STARTUP</h3><p lang="en">${PAIRED_STARTUP.manual}</p></article></main>`;
} else {
  app.innerHTML = `<header class="topbar"><div class="brand">MANUAL MAYHEM<small>בלגן לפי המדריך</small></div><div class="nav-controls"><label>כיתה <select id="grade" aria-label="כיתה"><option value="7">ז׳ / 7</option><option value="8">ח׳ / 8</option><option value="9">ט׳ / 9</option></select></label><select id="mission" aria-label="משימה"></select><button id="settings" aria-label="הגדרות שמע">♫</button><button id="pause" aria-label="השהיה">Ⅱ</button></div></header>
<main id="workspace"><section id="stage"><canvas id="scene" tabindex="0" aria-label="מכונת הפסטיבל: לחצו על מודול כדי להתקרב ולהפעיל אותו"></canvas><div id="hud"></div><div id="mission-strip"></div><div id="welcome"></div><div id="feedback" role="status" aria-live="polite"></div><div id="inspect"></div><nav id="module-tabs" aria-label="מודולים במכונה"></nav><footer><button id="return">↩ כל המכונה</button><button id="manual-toggle" class="book-button">▤ המדריך</button><button id="controls-toggle">כפתורי הפעלה</button><button id="restart" aria-label="התחלה מחדש">↻</button></footer><div class="bench-caption">FESTIVAL ENGINE CO. <span>WORKBENCH 042</span></div></section><aside id="manual" aria-label="מדריך ההפעלה"></aside><div id="overlay"></div></main>`;
  const $ = (id: string) => document.getElementById(id)!;
  const canvas = $("scene") as HTMLCanvasElement;
  const scene = new EngineScene(canvas);
  scene.onSelect = (id) => {
    if (!started || paused || settings) return;
    manual = false;
    selectModule(id);
  };
  scene.onControl = (id, c) => handleControl(id, c);
  canvas.addEventListener(
    "pointerdown",
    () => {
      if (started && !paused && !settings) {
        if (manual) {
          manual = false;
          update();
        }
        audio.duck(false);
      }
    },
    true,
  );
  function selectModule(id: string | null) {
    const changed = selected !== id;
    if (changed)
      state.feedback =
        id && state.modules.find((m) => m.id === id)?.fault
          ? mission.modules.find((m) => m.id === id)!.feedback
          : "";
    selected = id;
    scene.select(id);
    if (id) {
      if (manualPage !== id) audio.cue("page");
      manualPage = id;
    }
    if (changed && id) audio.cue("latch");
    update();
  }
  function begin() {
    challenge = ($("challenge") as HTMLInputElement | null)?.checked || false;
    started = true;
    manual = false;
    audio.start();
    selected = manualPage === "operator" ? null : manualPage;
    scene.select(selected);
    update();
  }
  function operate() {
    if (!started) {
      begin();
      return;
    }
    manual = false;
    if (manualPage !== "operator") {
      selected = manualPage;
      scene.select(selected);
    }
    update();
  }
  function readPage(id: string) {
    const changed = manualPage !== id;
    if (changed) state.feedback = "";
    manualPage = id;
    manual = true;
    translation = false;
    if (changed) audio.cue("page");
    update();
  }
  function load(m: Mission) {
    mission = m;
    paired = m.modules.some((x) => x.serial === "S-24");
    state = createState(m);
    state.retries = attempts[key()] || 0;
    manualPage = "valves";
    selected = null;
    scene.select(null);
    manual = true;
    translation = false;
    controlsOpen = false;
    paused = false;
    time = 240;
    audio.setProgress(0);
    update();
  }
  function actionButtons() {
    if (!selected) return "";
    const mod = state.modules.find((v) => v.id === selected)!;
    const w = mod.world;
    const button = (id: string, text: string) =>
      `<button data-control="${id}" ${mod.complete || mod.fault || state.status !== "playing" ? "disabled" : ""}>${text}</button>`;
    if (selected === "valves")
      return (
        button("small", `${w.small ? "סגירת" : "פתיחת"} הברז הקטן A`) +
        button("large", `${w.large ? "סגירת" : "פתיחת"} הברז הגדול B`) +
        button("test", "TEST · בדיקה") +
        button("reset", "RESET · לחצן במכונה")
      );
    if (selected === "cable")
      return (
        button("connect-square", "חיבור מתחת למסך □") +
        button("connect-round", "חיבור מתחת למסך ○") +
        button("clip-a", "סגירת תפס A") +
        button("clip-b", "סגירת תפס B") +
        button("test", "TEST · בדיקה") +
        button("reset", "RESET · לחצן במכונה")
      );
    return (
      (mission.id === "g9-independent"
        ? button("tag-left", "תג REPLACED לשמאל") +
          button("tag-right", "תג REPLACED לימין")
        : "") +
      button("left", `${w.left ? "כיבוי" : "הפעלת"} מנוף שמאל`) +
      button("right", `${w.right ? "כיבוי" : "הפעלת"} מנוף ימין`) +
      button("fan", `${w.fan ? "כיבוי" : "הפעלת"} מאוורר`) +
      button("test", "TEST · בדיקה") +
      button("reset", "RESET · לחצן במכונה")
    );
  }
  function statusText() {
    if (!selected) return "";
    const w = state.modules.find((m) => m.id === selected)!.world;
    if (selected === "valves")
      return `קטן: ${w.small ? "פתוח" : "סגור"} · גדול: ${w.large ? "פתוח" : "סגור"} · מד כחול: ${w.pressure}`;
    if (selected === "cable")
      return `כבל: ${w.connected === "none" ? "לא מחובר" : w.connected === "square" ? "מחובר למסך המרובע" : "מחובר למסך העגול"} · תפסים: ${w.clipA ? "A סגור" : "A פתוח"}, ${w.clipB ? "B סגור" : "B פתוח"}`;
    return `שמאל: ${w.left ? "פועל" : "כבוי"} · ימין: ${w.right ? "פועל" : "כבוי"} · מאוורר: ${w.fan ? "פועל" : "כבוי"} · לחץ: ${w.pressure}`;
  }
  function handleControl(id: string, c: string) {
    if (
      !started ||
      paused ||
      settings ||
      document.hidden ||
      selected !== id ||
      state.status !== "playing"
    )
      return;
    const mod = state.modules.find((x) => x.id === id)!;
    if (mod.complete || mod.fault) return;
    manual = false;
    audio.duck(false);
    let action = c;
    if (c === "small" || c === "large")
      action = c + (mod.world[c] ? "-close" : "-open");
    if (c === "left" || c === "right" || c === "fan")
      action = c + (mod.world[c] ? "-off" : "-on");
    const was = mod.complete;
    const good = act(state, mission, id, action);
    remember();
    audio.cue(
      good
        ? c.startsWith("connect")
          ? "cable"
          : c.startsWith("clip")
            ? "latch"
            : c === "small" || c === "large"
              ? "knob"
              : "switch"
        : "error",
    );
    if (!good) {
      audio.cue("strike");
      scene.vent(id);
    }
    if (!was && mod.complete) {
      audio.cue("settle");
      audio.cue("activate");
    }
    audio.setProgress(state.modules.filter((m) => m.complete).length);
    update();
  }
  function diagram(id: string) {
    if (id === "valves")
      return `<svg viewBox="0 0 320 95" aria-label="תרשים זיהוי: A ברז קטן, B ברז גדול" class="manual-diagram"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M72 13v65m160-65v65M72 78h160"/><circle cx="72" cy="43" r="24"/><circle cx="232" cy="43" r="34"/><path d="M48 43h48M72 19v48M198 43h68M232 9v68"/></g><g fill="currentColor" font-size="11" font-family="Arial"><text x="43" y="94">SMALL / A</text><text x="203" y="94">LARGE / B</text></g></svg>`;
    if (id === "cable")
      return `<svg viewBox="0 0 320 95" class="manual-diagram" aria-label="שקעים מתחת למסכים"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="50" y="8" width="42" height="32"/><circle cx="238" cy="24" r="20"/><circle cx="71" cy="63" r="12"/><circle cx="238" cy="63" r="12"/><path d="M148 92q-35-16-10-38m0 0h32m-32 0v-15"/></g><g fill="currentColor" font-size="11" font-family="Arial"><text x="44" y="91">SQUARE</text><text x="216" y="91">ROUND</text></g></svg>`;
    return `<svg viewBox="0 0 320 95" class="manual-diagram" aria-label="מבט קדמי: מנוף שמאל, מנוף ימין ומאוורר"><g fill="none" stroke="currentColor" stroke-width="2"><circle cx="65" cy="50" r="13"/><path d="M65 50V20m-8 0h16"/><circle cx="158" cy="50" r="13"/><path d="M158 50V20m-8 0h16"/><circle cx="255" cy="46" r="25"/><path d="m237 28 36 36m-36 0 36-36"/></g><g fill="currentColor" font-size="11" font-family="Arial"><text x="48" y="89">LEFT</text><text x="138" y="89">RIGHT</text><text x="243" y="89">FAN</text></g></svg>`;
  }
  function choiceHtml(type: "relay" | "prediction") {
    const c = mission[type]!;
    const ordered = c.options.map((o, i) => ({ o, i }));
    let s = seed;
    for (const ch of mission.id + type + (paired ? "B" : "A"))
      s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0;
    for (let i = ordered.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = Math.floor((s / 4294967296) * (i + 1));
      [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }
    return `<section class="message-task"><div class="serial">${type === "prediction" ? "STARTUP PREDICTION" : "OPERATOR MESSAGE"} ${state[type] ? "✓" : ""}</div><p dir="rtl">${type === "prediction" ? "מה יקרה בבדיקה המתוארת?" : "איזו הודעה שומרת את ההוראה במדויק?"}</p><p lang="en" dir="ltr">${c.prompt || c.source || ""}</p>${ordered.map(({ o, i }) => `<button data-choice="${type}" data-index="${i}" dir="ltr" ${state[type] ? "disabled" : ""}>${o}</button>`).join("")}</section>`;
  }
  function paper() {
    const spec = mission.modules.find((s) => s.id === manualPage);
    const mod = state.modules.find((s) => s.id === manualPage);
    const idx = mission.modules.findIndex((s) => s.id === manualPage);
    const hasMessage = !!mission.relay || !!mission.prediction;
    const intro = !started;
    const next = state.modules.find((m) => !m.complete && m.id !== manualPage);
    return `<div class="paper-stack"></div><div class="paper-sheet"><header class="paper-header"><div class="paper-brand">FESTIVAL ENGINE CO.<span>FIELD MANUAL · REV. 04</span></div><a href="?manual=1" target="_blank" title="מדריך נפרד לשותף">↗</a></header><div class="read-operate" dir="rtl"><button id="read-mode" class="${manual ? "current" : ""}"><b>1</b> קוראים</button><span>←</span><button id="operate" class="${!manual && started ? "current" : ""}"><b>2</b> מפעילים במכונה</button></div><div class="paper-scroll"><div class="paper-intro" dir="rtl">${intro ? "<h1>מתחילים במדריך.</h1><p>קראו את ההוראה כאן, ואז הפעילו את המודול התואם במכונה משמאל.</p>" : `<p>המדריך של המודול שמולכם. אפשר לקרוא ולחזור להפעלה בכל רגע.</p>`}</div><nav class="paper-tabs" aria-label="פרקים במדריך">${mission.modules.map((s, i) => `<button data-page="${s.id}" class="${manualPage === s.id ? "current" : ""}">${String(i + 1).padStart(2, "0")}<span>${NAMES[s.id]}</span>${state.modules[i].complete ? "✓" : ""}</button>`).join("")}${hasMessage ? `<button data-page="operator" id="operator-page" class="${manualPage === "operator" ? "current" : ""}">✉<span>מסר</span>${state.relay && state.prediction ? "✓" : "•"}</button>` : ""}</nav>${spec ? `<article class="procedure"><div class="module-reference"><span>${String(idx + 1).padStart(2, "0")} / ${spec.title}</span><b>${spec.serial}</b></div><h2 dir="rtl">${NAMES[manualPage]}</h2><div class="english-procedure" lang="en" dir="ltr">${spec.manual}</div>${diagram(manualPage)}<div class="word-help" dir="rtl">${manualPage === "valves" ? "מזהים לפי הגודל והתג A / B. המד הכחול שייך לברזים." : manualPage === "cable" ? "גררו את התקע הכתום אל השקע המתואר. מזהים לפי הצורה שמתחת למסך." : "שמאל וימין נקבעים במבט ישר מול המודול."}</div><button id="translate" class="translation-button">${translation ? "סגירת העזרה" : "עזרה בעברית / תרגום"}</button>${translation ? `<div class="translation" dir="rtl">${spec.translation}<br>${spec.help}</div>` : ""}${mod?.complete ? '<div class="stable-stamp">INSPECTED · STABLE ✓</div>' : ""}</article>` : `<article class="procedure"><div class="module-reference">OPERATOR DESK / לפני ההתנעה</div><h2 dir="rtl">מסר מדויק למפעיל</h2>${mission.prediction ? choiceHtml("prediction") : ""}${mission.relay ? choiceHtml("relay") : ""}</article>`}${intro ? `<label class="challenge-option" dir="rtl"><input type="checkbox" id="challenge" ${challenge ? "checked" : ""}/> מצב אתגר עם שעון (ללא חובה)</label>` : ""}<div class="paper-footnote" dir="rtl">קראו את כל ההוראה. חפשו פעולה, חפץ, סדר ומגבלה.<br>רמז או תרגום מסמנים ניסיון עם תמיכה.</div></div><div class="paper-action">${!started ? '<button id="start" class="primary" dir="rtl">קראתי · עכשיו למכונה ←</button>' : mod?.complete ? `<button id="next-module" class="primary" dir="rtl">${next ? "למדריך של המודול הבא" : (hasMessage && !state.relay) || (hasMessage && !state.prediction) ? "למסר שלפני ההתנעה" : "חזרה למכונה"} ←</button>` : manualPage === "operator" ? '<button id="close-manual" class="primary" dir="rtl">חזרה למכונה ←</button>' : `<button id="operate-bottom" class="primary" dir="rtl">${manual ? "קראתי · להפעלת המודול" : "חזרה להפעלת " + NAMES[manualPage]} ←</button>`}<small>${manual ? "READ → ACT → CHECK" : "אפשר לחזור למדריך עם M בכל רגע"}</small></div><div class="page-number">${manualPage === "operator" ? "04" : String(idx + 1).padStart(2, "0")} <span>MANUAL MAYHEM</span></div></div>`;
  }
  function update() {
    if (state.status === "ready") {
      manual = false;
      selected = null;
      controlsOpen = false;
      scene.select(null);
    }
    document.body.classList.toggle("reading", manual || !started);
    document.body.classList.toggle("operating", started && !manual);
    document.body.classList.toggle("has-inspector", !!selected && controlsOpen);
    $("mission").innerHTML = MISSIONS.filter((m) => m.grade === mission.grade)
      .map(
        (m) =>
          `<option value="${m.id}" ${m.id === mission.id ? "selected" : ""}>${records[m.id] ? "✓ " : ""}${STAGE_HE[m.stage]} · ${m.title}</option>`,
      )
      .join("");
    $("hud").innerHTML =
      `<div class="module-count"><b>${state.modules.filter((m) => m.complete).length}</b><span>/ 3 MODULES</span></div><div class="status-lamps">${state.modules.map((m) => `<i class="${m.complete ? "on" : ""}"></i>`).join("<em></em>")}</div><div class="strikes">${[0, 1, 2].map((i) => `<span class="${i < state.strikes ? "marked" : ""}">×</span>`).join("")}<small>${challenge ? Math.ceil(time) + " s" : "תרגול · ללא שעון"}</small></div>`;
    $("mission-strip").innerHTML =
      `<div class="eyebrow">GRADE ${mission.grade} · ${STAGE_HE[mission.stage]}</div><h1>${mission.title}</h1>${mission.id === "g9-transfer" ? `<button id="paired-model">${paired ? "דגם A" : "דגם B · תוכנית הפוכה"} ↔</button>` : ""}`;
    $("mission-strip").hidden = !!selected;
    $("welcome").innerHTML = !started
      ? '<span class="first-arrow">←</span><p dir="rtl">המכונה מחכה.<br><b>המדריך פתוח בצד ימין.</b></p>'
      : "";
    $("welcome").hidden = started;
    $("module-tabs").innerHTML = mission.modules
      .map(
        (m, i) =>
          `<button data-module="${m.id}" class="${selected === m.id ? "current" : ""} ${state.modules[i].complete ? "stable" : ""}"><small>${String(i + 1).padStart(2, "0")}</small><span>${m.title}<b>${m.serial} ${state.modules[i].complete ? "✓" : ""}</b></span></button>`,
      )
      .join("");
    $("module-tabs").hidden = !started;
    const mod = state.modules.find((m) => m.id === selected);
    $("inspect").hidden = !mod || !controlsOpen;
    $("inspect").innerHTML = mod
      ? `<header><div><small>${mission.modules.find((m) => m.id === selected)!.serial} / ${NAMES[selected!]}</small><h2>כפתורי הפעלה</h2></div><button id="close-inspect" aria-label="סגירת כפתורי הפעלה">×</button></header><p class="world" dir="rtl">${statusText()}</p>${mod.fault ? '<p dir="rtl">שחרור קיטור. קראו את המשוב ואפסו לניסיון חוזר.</p>' : mod.complete ? '<p dir="rtl" class="success-text">המודול יציב ✓</p>' : `<div class="action-grid" dir="rtl">${actionButtons()}</div>`}<div class="inspector-tools"><button id="help">רמז בעברית</button><button id="recover">איפוס לניסיון חוזר</button></div>${translation ? `<div class="translation" dir="rtl">${mission.modules.find((m) => m.id === selected)!.help}</div>` : ""}`
      : "";
    $("feedback").hidden = !state.feedback;
    $("feedback").innerHTML = state.feedback
      ? `<div dir="rtl"><b>${state.modules.some((m) => m.fault) ? "שחרור קיטור" : "בדיקת המכונה"}</b><p>${state.feedback}</p></div>${selected && state.modules.find((m) => m.id === selected)?.fault ? '<button id="recover-inline">איפוס לניסיון חוזר ↻</button>' : ""}`
      : "";
    $("return").hidden = !selected;
    $("controls-toggle").hidden = !selected;
    $("manual-toggle").innerHTML = manual ? "▤ קריאה במדריך" : "▤ חזרה למדריך";
    $("controls-toggle").classList.toggle("current", controlsOpen);
    $("pause").textContent = paused ? "▶" : "Ⅱ";
    const pageKey = mission.id + String(paired) + manualPage;
    const scroll =
      renderedPaperKey === pageKey
        ? $("manual").querySelector(".paper-scroll")?.scrollTop || 0
        : 0;
    renderedPaperKey = pageKey;
    $("manual").innerHTML = paper();
    ($("manual").querySelector(".paper-scroll") as HTMLElement).scrollTop =
      scroll;
    renderOverlay();
    scene.sync(state, mission);
    audio.duck(manual || settings);
    audio.setPaused(paused || !started);
    bindDynamic();
  }
  function renderOverlay() {
    const shown =
      paused ||
      settings ||
      state.status === "ready" ||
      state.status === "won" ||
      state.status === "shutdown";
    $("overlay").hidden = !shown;
    if (settings) {
      const gains = audio.snapshot().gains;
      $("overlay").innerHTML =
        `<div class="modal" dir="rtl"><button id="close-overlay" class="x">×</button><div class="eyebrow">SOUND DESK</div><h2>צלילי הסדנה</h2>${(["master", "music", "sfx", "voice"] as const).map((k, i) => `<label>${["עוצמה כללית", "מוזיקה וסביבה", "אפקטים", "קול (ללא דיבור בחבילה)"][i]}<input type="range" min="0" max="1" step=".05" value="${gains[k]}" data-gain="${k}" aria-label="${k}"/></label>`).join("")}<button id="mute">השתקה כללית</button><button id="sound-check" ${started ? "" : "disabled"}>בדיקת צליל</button><a href="./audio/manual-mayhem-preview.mp3" target="_blank">מיקס של 25 שניות ↗</a></div>`;
    } else if (paused) {
      $("overlay").innerHTML =
        '<div class="modal" dir="rtl"><div class="eyebrow">WORKSHOP PAUSED</div><h2>הסדנה בהפסקה</h2><p>הזמן והצליל עצרו.</p><button id="resume" class="primary">חזרה למכונה</button></div>';
    } else if (state.status === "ready") {
      $("overlay").innerHTML =
        '<div class="modal" dir="rtl"><div class="eyebrow">ALL SYSTEMS STABLE</div><h2>מוכנים להתנעה.</h2><p>שלושת המודולים יציבים. התניעו את מנוע הפסטיבל.</p><button id="engine-start" class="primary">START ENGINE ←</button></div>';
    } else if (state.status === "won") {
      $("overlay").innerHTML =
        `<div class="modal" dir="rtl"><div class="eyebrow">FESTIVAL ENGINE ONLINE</div><h2>המוזיקה חזרה!</h2><p>${state.strikes} פסילות · ${state.retries} ניסיונות חוזרים · ${state.assisted ? "עם תמיכה" : "ללא רמז או תרגום"}</p><p>${mission.stage === "transfer" && !state.assisted && !state.strikes && !state.retries ? "העברה בהקשר חדש בוצעה בניסיון ראשון." : "זהו תרגול של הבנת הוראות. אפשר לחזור לניסיון נוסף."}</p><button id="next" class="primary">למשימה הבאה ←</button><button id="retry-win">ניסיון נוסף</button></div>`;
    } else if (state.status === "shutdown") {
      $("overlay").innerHTML =
        '<div class="modal" dir="rtl"><div class="eyebrow">HARMLESS SHUTDOWN</div><h2>המנוע נח להפסקה.</h2><p>שלוש פסילות עצרו את הבדיקה. אפשר לנסות שוב.</p><button id="retry-shutdown" class="primary">ניסיון מחדש</button></div>';
    }
  }
  function recover() {
    if (!selected) return;
    resetModule(state, mission, selected);
    remember();
    audio.cue("reset");
    update();
  }
  function bindDynamic() {
    const on = (id: string, fn: () => void) => {
      const el = document.getElementById(id);
      if (el) el.onclick = fn;
    };
    on("start", begin);
    on("operate", operate);
    on("operate-bottom", operate);
    on("close-manual", operate);
    on("read-mode", () => {
      manual = true;
      update();
    });
    on("next-module", () => {
      const next = state.modules.find(
        (m) => !m.complete && m.id !== manualPage,
      );
      if (next) readPage(next.id);
      else if (!state.relay || !state.prediction) readPage("operator");
      else {
        manual = false;
        selected = null;
        scene.select(null);
        update();
      }
    });
    on("close-inspect", () => {
      controlsOpen = false;
      update();
    });
    on("recover", recover);
    on("recover-inline", recover);
    for (const id of ["translate", "help"])
      on(id, () => {
        translation = !translation;
        if (translation) {
          state.assisted = true;
          remember();
        }
        update();
      });
    on("close-overlay", () => {
      settings = false;
      update();
    });
    on("resume", () => {
      paused = false;
      audio.start();
      update();
    });
    on("engine-start", () => {
      state.status = "won";
      manual = false;
      records[key()] = {
        strikes: state.strikes,
        assisted: state.assisted,
        retries: state.retries,
        events: state.events.length,
      };
      try {
        localStorage.setItem("mm-records", JSON.stringify(records));
      } catch {}
      remember();
      audio.cue("victory");
      update();
    });
    on("next", () => {
      load(
        MISSIONS[
          (MISSIONS.findIndex((m) => m.id === mission.id) + 1) % MISSIONS.length
        ],
      );
      ($("grade") as HTMLSelectElement).value = String(mission.grade);
    });
    for (const id of ["retry-win", "retry-shutdown"])
      on(id, () => {
        const r = state.retries + 1;
        load(mission);
        state.retries = r;
        remember();
        update();
      });
    on("mute", () => {
      audio.setGains({ master: 0 });
      update();
    });
    on("sound-check", () => audio.cue("victory"));
    document.querySelectorAll<HTMLButtonElement>("[data-module]").forEach(
      (el) =>
        (el.onclick = () => {
          if (!started) return;
          manual = false;
          selectModule(el.dataset.module!);
        }),
    );
    document
      .querySelectorAll<HTMLButtonElement>("[data-page]")
      .forEach((el) => (el.onclick = () => readPage(el.dataset.page!)));
    document
      .querySelectorAll<HTMLButtonElement>("[data-control]")
      .forEach(
        (el) =>
          (el.onclick = () => handleControl(selected!, el.dataset.control!)),
      );
    document
      .querySelectorAll<HTMLInputElement>("[data-gain]")
      .forEach(
        (el) =>
          (el.oninput = () =>
            audio.setGains({ [el.dataset.gain!]: Number(el.value) })),
      );
    document.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach(
      (el) =>
        (el.onclick = () => {
          const good = choose(
            state,
            mission,
            el.dataset.choice as "relay" | "prediction",
            Number(el.dataset.index),
          );
          remember();
          audio.cue(good ? "latch" : "error");
          update();
        }),
    );
    on("paired-model", () => {
      const base = MISSIONS.find((m) => m.id === "g9-transfer")!;
      const wantB = !paired;
      load(
        wantB
          ? {
              ...base,
              title: "תחזית חדשה · דגם B",
              brief: "בבדיקה הזאת המאוורר מוסיף לחץ.",
              modules: base.modules.map((m) =>
                m.id === "switches" ? PAIRED_STARTUP : m,
              ),
              prediction: {
                prompt:
                  "Current pressure: four. The next test adds one with the fan, or zero without it. If the pressure reaches five, the engine will stop. What happens with the fan on?",
                options: [
                  "The engine will stop: 4 + 1 = 5.",
                  "The engine will stay at three.",
                  "The record guarantees success.",
                ],
                correct: 0,
              },
              relay: {
                source:
                  "If the pressure reaches five, the engine will stop. Stop the fan before TEST. Do not turn on either relay.",
                options: [
                  "If the pressure reaches five, the engine will stop. Start the fan before TEST; leave both relays off.",
                  "If the pressure reaches five, the engine will stop. Stop the fan before TEST; leave both relays off.",
                  "If the pressure reaches five, the engine will stop. Stop both relays after TEST; keep the fan on.",
                ],
                correct: 1,
              },
            }
          : base,
      );
    });
  }
  $("return").onclick = () => {
    manual = false;
    selectModule(null);
  };
  $("manual-toggle").onclick = () => {
    if (!started) return;
    manual = !manual;
    update();
  };
  $("controls-toggle").onclick = () => {
    controlsOpen = !controlsOpen;
    manual = false;
    update();
  };
  $("restart").onclick = () => {
    const r = state.retries + 1;
    load(mission);
    state.retries = r;
    remember();
    update();
  };
  $("settings").onclick = () => {
    settings = !settings;
    update();
  };
  $("pause").onclick = () => {
    if (started) {
      paused = !paused;
      update();
    }
  };
  ($("grade") as HTMLSelectElement).onchange = (e) =>
    load(
      MISSIONS.find(
        (m) => m.grade === Number((e.target as HTMLSelectElement).value),
      )!,
    );
  ($("mission") as HTMLSelectElement).onchange = (e) =>
    load(MISSIONS.find((m) => m.id === (e.target as HTMLSelectElement).value)!);
  window.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).matches("input,select,textarea")) return;
    if (e.code === "KeyM") {
      e.preventDefault();
      if (started && !paused && !settings) {
        manual = !manual;
        update();
      }
    }
    if (e.key === "Escape") {
      if (settings) settings = false;
      else if (paused) paused = false;
      else if (controlsOpen) controlsOpen = false;
      else if (manual && started) manual = false;
      else {
        selected = null;
        scene.select(null);
      }
      update();
    }
    if (e.code === "KeyF") {
      if (document.fullscreenElement) document.exitFullscreen();
      else $("workspace").requestFullscreen();
    }
    if (
      started &&
      !paused &&
      !settings &&
      ["Digit1", "Digit2", "Digit3"].includes(e.code)
    ) {
      manual = false;
      selectModule(
        ["valves", "cable", "switches"][Number(e.code.slice(-1)) - 1],
      );
    }
  });
  let last = performance.now(),
    seconds = 0,
    windowBlurred = false;
  document.addEventListener("visibilitychange", () => {
    last = performance.now();
  });
  window.addEventListener("blur", () => {
    windowBlurred = true;
    last = performance.now();
  });
  window.addEventListener("focus", () => {
    windowBlurred = false;
    last = performance.now();
    scene.settleTime = 2;
  });
  function step(ms: number, draw = true) {
    if (
      started &&
      !paused &&
      !settings &&
      !manual &&
      !translation &&
      !selected &&
      state.status === "playing" &&
      challenge &&
      !document.hidden &&
      !windowBlurred
    ) {
      time = Math.max(0, time - ms / 1000);
      if (time === 0) {
        state.status = "shutdown";
        update();
      }
      seconds += ms;
      if (seconds > 1000) {
        seconds = 0;
        const small = document.querySelector(".strikes small");
        if (small) small.textContent = Math.ceil(time) + " s";
      }
    }
    scene.render(
      paused || settings || windowBlurred ? 0 : Math.min(ms / 1000, 0.1),
      draw,
    );
  }
  function loop(now: number) {
    if (now - last >= 33 && !document.hidden) {
      step(now - last);
      last = now;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  (window as any).advanceTime = (ms: number) => {
    for (let i = 0; i < Math.ceil(ms / 16.667); i++)
      step(Math.min(16.667, ms - i * 16.667), false);
    scene.renderer.render(scene.scene, scene.camera);
  };
  (window as any).render_game_to_text = () =>
    JSON.stringify({
      mode: !started
        ? "intro"
        : settings
          ? "settings"
          : paused
            ? "paused"
            : state.status !== "playing"
              ? state.status
              : manual
                ? "manual"
                : state.status,
      mission: {
        id: mission.id,
        grade: mission.grade,
        stage: mission.stage,
        title: mission.title,
        variant: paired ? "B" : "A",
      },
      manual: {
        visible: innerWidth >= 760 || manual || !started,
        reading: manual,
        page: manualPage,
        serial: mission.modules.find((m) => m.id === manualPage)?.serial,
        text: mission.modules.find((m) => m.id === manualPage)?.manual,
      },
      selected,
      controlsOpen,
      coordinateSystem:
        "Fixed front view: x right, y up; gauges left, valves center, patch right, relays lower. Left/right always facing module.",
      view: {
        rotation: scene.rotation,
        camera: scene.camera.position.toArray(),
      },
      controls: scene.screenControls(),
      modules: state.modules.map((m, i) => ({
        id: m.id,
        serial: mission.modules[i].serial,
        complete: m.complete,
        fault: m.fault,
        world: m.world,
      })),
      relay: state.relay,
      prediction: state.prediction,
      strikes: state.strikes,
      time: challenge ? Math.ceil(time) : null,
      evidence: {
        assisted: state.assisted,
        retries: state.retries,
        events: state.events,
      },
      audio: audio.snapshot(),
      feedback: state.feedback,
    });
  (window as any).__audioEngine = audio;
  update();
}
