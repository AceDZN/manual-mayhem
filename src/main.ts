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
  manual = false,
  settings = false,
  paused = false,
  selected: string | null = null,
  translation = false,
  challenge = false,
  time = 240;
const choiceSessionSeed = Math.floor(Math.random() * 0xffffffff);
let paired = false;
let saved: Record<
  string,
  { strikes: number; assisted: boolean; retries: number; events: number }
> = {};
try {
  saved = JSON.parse(localStorage.getItem("mm-records") || "{}");
} catch {}
let attemptHistory: Record<string, number> = {};
try {
  attemptHistory = JSON.parse(localStorage.getItem("mm-attempts") || "{}");
} catch {}
const attemptKey = () => mission.id + (paired ? "-b" : "");
state.retries = attemptHistory[attemptKey()] || 0;
function recordAttempt() {
  attemptHistory[attemptKey()] = Math.max(
    attemptHistory[attemptKey()] || 0,
    state.retries + 1,
  );
  try {
    localStorage.setItem("mm-attempts", JSON.stringify(attemptHistory));
  } catch {}
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const missionManual = (m: Mission) =>
  `<article class="manual-mission"><div class="eyebrow">GRADE ${m.grade} · ${STAGE_HE[m.stage]}</div><h2>${m.title}</h2>${m.modules.map((v) => `<section><div class="serial">${v.serial} / ${v.title}</div><p lang="en" dir="ltr">${v.manual}</p></section>`).join("")}${m.relay ? `<section><div class="serial">OPERATOR MESSAGE</div><p lang="en" dir="ltr">${m.relay.source}</p></section>` : ""}</article>`;
if (partner) {
  app.innerHTML = `<div class="reader"><header><div class="brand">MANUAL MAYHEM<span>FESTIVAL ENGINE / FIELD MANUAL</span></div><button onclick="print()">הדפסה</button></header><div class="reader-intro" dir="rtl"><h1>מדריך השותף</h1><p>המפעיל מתאר את תג המודול ואת מצבו. קוראים את הנוהל המתאים ומוסרים פעולה, חפץ, סדר ומגבלה. המדריך הזה קבוע ואין לו מידע חי על המכונה.</p><p>Left / right מתייחסים למבט ישר מול המודול. Square □ ו-round ○ מתארים מסכים. TEST הוא בדיקה; RESET הוא לחצן במכונה. “איפוס לצורך ניסיון חוזר” הוא פעולת התאוששות חיצונית.</p><a href="./">חזרה למכונה</a></div>${MISSIONS.map(missionManual).join("")}<article class="variant-appendix"><div class="serial">S-24 / ALTERNATE STARTUP</div><p lang="en" dir="ltr">${PAIRED_STARTUP.manual}</p></article></div>`;
} else {
  app.innerHTML = `<header class="topbar"><div class="brand">MANUAL MAYHEM<span>בלגן לפי המדריך · FESTIVAL ENGINE CO.</span></div><div class="nav-controls"><label class="grade-label">כיתה <select id="grade" aria-label="כיתה"><option value="7">ז׳ / 7</option><option value="8">ח׳ / 8</option><option value="9">ט׳ / 9</option></select></label><select id="mission" aria-label="משימה"></select><button id="settings" aria-label="הגדרות שמע">♫ <span>שמע</span></button><button id="pause">Ⅱ <span>השהיה</span></button></div></header>
<main id="workspace"><canvas id="scene" aria-label="מנוע פסטיבל תלת ממדי: לחצו מודול לבדיקה" tabindex="0"></canvas><div class="workshop-label">AIRSHIP SERVICE BENCH <b>№ 042</b></div><div id="mission-strip"></div><div id="hud"></div><div id="module-tabs"></div><div id="inspect"></div><div id="feedback" role="status" aria-live="polite"></div><div id="welcome"></div><div id="overlay"></div><div id="manual"></div><footer><span id="control-tip">גררו רקע או ידית לסיבוב · לחצו מודול לבדיקה</span><div><button id="return">↩ חזרה לשולחן</button><button id="manual-toggle">M · מדריך</button><button id="restart">↻ התחלה מחדש</button></div></footer></main>`;
  const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
  const scene = new EngineScene(canvas);
  scene.onSelect = (id) => {
    if (!started || paused || settings || manual) return;
    selectModule(id);
  };
  scene.onControl = (id, c) => handleControl(id, c);
  const $ = (id: string) => document.getElementById(id)!;
  function selectModule(id: string | null) {
    selected = id;
    scene.select(id);
    audio.cue("latch");
    update();
  }
  function loadMission(m: Mission) {
    paired = m.modules.some((x) => x.serial === "S-24");
    mission = m;
    state = createState(m);
    state.retries = attemptHistory[attemptKey()] || 0;
    selected = null;
    scene.select(null);
    time = 240;
    manual = false;
    translation = false;
    paused = false;
    audio.setProgress(0);
    audio.setPaused(false);
    update();
  }
  function updateMissionOptions() {
    $("mission").innerHTML = MISSIONS.filter((m) => m.grade === mission.grade)
      .map(
        (m) =>
          `<option value="${m.id}" ${m.id === mission.id ? "selected" : ""}>${saved[m.id] ? "✓ " : ""}${STAGE_HE[m.stage]} · ${m.title}</option>`,
      )
      .join("");
  }
  function controls() {
    if (!selected) return "";
    const mod = state.modules.find((m) => m.id === selected)!;
    const w = mod.world;
    const btn = (id: string, label: string) =>
      `<button class="action" data-control="${id}" ${mod.fault || mod.complete || state.status !== "playing" ? "disabled" : ""}>${label}</button>`;
    if (selected === "valves")
      return (
        btn("small", `${w.small ? "סגירת" : "פתיחת"} הברז הקטן A`) +
        btn("large", `${w.large ? "סגירת" : "פתיחת"} הברז הגדול B`) +
        btn("test", "TEST · בדיקה") +
        btn("reset", "RESET · לחצן במכונה")
      );
    if (selected === "cable")
      return (
        btn("connect-square", "חיבור מתחת למסך □") +
        btn("connect-round", "חיבור מתחת למסך ○") +
        btn("clip-a", "סגירת תפס A") +
        btn("clip-b", "סגירת תפס B") +
        btn("test", "TEST · בדיקה") +
        btn("reset", "RESET · לחצן במכונה")
      );
    return (
      (mission.id === "g9-independent"
        ? btn("tag-left", "תג REPLACED לשמאל") +
          btn("tag-right", "תג REPLACED לימין")
        : "") +
      btn("left", `${w.left ? "כיבוי" : "הפעלת"} מנוף שמאל`) +
      btn("right", `${w.right ? "כיבוי" : "הפעלת"} מנוף ימין`) +
      btn("fan", `${w.fan ? "כיבוי" : "הפעלת"} מאוורר`) +
      btn("test", "TEST · בדיקה") +
      btn("reset", "RESET · לחצן במכונה")
    );
  }
  function handleControl(id: string, c: string) {
    if (
      !started ||
      manual ||
      paused ||
      settings ||
      document.hidden ||
      selected !== id
    )
      return;
    const mod = state.modules.find((x) => x.id === id)!;
    if (mod.complete || mod.fault || state.status !== "playing") return;
    let action = c;
    if (c === "small" || c === "large")
      action = c + (mod.world[c] ? "-close" : "-open");
    if (c === "left" || c === "right" || c === "fan")
      action = c + (mod.world[c] ? "-off" : "-on");
    const was = mod.complete;
    const good = act(state, mission, id, action);
    recordAttempt();
    audio.cue(
      good
        ? c.includes("connect")
          ? "cable"
          : c.includes("clip")
            ? "latch"
            : ["small", "large"].includes(c)
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
  function update() {
    updateMissionOptions();
    $("return").hidden = !selected;
    $("pause").innerHTML = paused
      ? "▶ <span>המשך</span>"
      : "Ⅱ <span>השהיה</span>";
    $("manual-toggle").classList.toggle("active", manual);
    $("mission-strip").innerHTML =
      `<div class="eyebrow">GRADE ${mission.grade} / ${STAGE_HE[mission.stage]}</div><h1>${mission.title}</h1><p>${mission.brief}</p>${mission.id === "g9-transfer" ? `<button id="paired-model">${paired ? "דגם A: מאוורר מפחית לחץ" : "דגם B: תוכנית הפוכה"} ↔</button>` : ""}`;
    $("hud").innerHTML =
      `<div class="module-count"><b>${state.modules.filter((v) => v.complete).length}</b> / 3 <span>MODULES</span></div><div class="strikes" aria-label="${state.strikes} פסילות">${[0, 1, 2].map((i) => `<i class="${i < state.strikes ? "marked" : ""}">×</i>`).join("")}<small>${challenge ? Math.ceil(time) + "s" : "PRACTICE · ללא שעון"}</small></div>`;
    $("module-tabs").innerHTML = state.modules
      .map(
        (v, i) =>
          `<button data-module="${v.id}" class="${v.complete ? "stable" : ""} ${selected === v.id ? "selected" : ""}"><small>0${i + 1}</small>${mission.modules[i].title}<span>${v.complete ? "✓ STABLE" : v.fault ? "! VENTED" : mission.modules[i].serial}</span></button>`,
      )
      .join("");
    const mod = state.modules.find((m) => m.id === selected);
    const spec = mission.modules.find((m) => m.id === selected);
    $("inspect").hidden = !mod;
    $("inspect").innerHTML =
      mod && spec
        ? `<div class="inspector-head"><div><small>${spec.serial} / FRONT VIEW</small><h2>${spec.title}</h2></div><button id="close-inspect" aria-label="חזרה למבט כללי">×</button></div><div class="world" dir="ltr">${Object.entries(
            mod.world,
          )
            .map(
              ([k, v]) =>
                `<span>${escape(k)} <b>${typeof v === "boolean" ? (v ? "ON" : "OFF") : escape(String(v))}</b></span>`,
            )
            .join(
              "",
            )}</div>${mod.complete ? '<p class="success-text">✓ המודול יציב</p>' : mod.fault ? '<p dir="rtl">שחרור קיטור. קראו את המשוב, אפסו ונסו שוב.</p>' : `<div class="action-grid" dir="rtl">${controls()}</div>`}<div class="inspector-tools"><button id="help" ${mod.complete ? "disabled" : ""}>רמז בעברית</button><button id="recover" ${mod.complete ? "disabled" : ""}>איפוס לצורך ניסיון חוזר</button></div>${translation ? `<p class="translation" dir="rtl">${spec.help}<br>${spec.translation}</p>` : ""}`
        : "";
    $("feedback").innerHTML = state.feedback
      ? `<span>${state.modules.some((m) => m.fault) ? "!" : "•"}</span><p dir="rtl">${state.feedback}</p>`
      : "";
    $("feedback").hidden = !state.feedback;
    $("welcome").hidden = started;
    $("welcome").innerHTML =
      `<div class="eyebrow">THE FESTIVAL IS WAITING</div><h2>להחזיר את המוזיקה.</h2><p dir="rtl">שלושה מודולים. מדריך אחד.<br>קראו את תג הדגם, פתחו את המדריך ובצעו את הפעולות.</p><div class="start-controls" dir="rtl"><label><input type="checkbox" id="challenge" ${challenge ? "checked" : ""}/> מצב אתגר עם שעון</label><button id="start" class="primary">מתחילים ←</button></div><p class="tiny" dir="rtl">לחיצה לבדיקה · גלגל בסיבוב/לחיצה · כבל בגרירה<br>אפשר גם עם Tab ו־Enter. M למדריך, Esc לחזרה.</p>`;
    $("overlay").hidden = !(
      paused ||
      settings ||
      state.status === "ready" ||
      state.status === "won" ||
      state.status === "shutdown"
    );
    if (settings) {
      const snap = audio.snapshot() as any;
      const gains = snap.gains || {
        master: 0.8,
        music: 0.6,
        sfx: 0.8,
        voice: 1,
      };
      $("overlay").innerHTML =
        `<div class="modal settings" dir="rtl"><button class="x" id="close-overlay" aria-label="סגירה">×</button><div class="eyebrow">SOUND DESK</div><h2>צלילי הסדנה</h2>${["master", "music", "sfx", "voice"].map((k, i) => `<label>${["עוצמה כללית", "מוזיקה וסביבה", "אפקטים", "קול (ללא דיבור בחבילה)"][i]}<input type="range" min="0" max="1" step=".05" value="${gains[k] ?? 0.7}" data-gain="${k}" aria-label="${k}"/></label>`).join("")}<button id="mute">השתקה כללית</button><button id="sound-check" ${started ? "" : "disabled"}>בדיקת צליל</button><p>המוזיקה מוסיפה שכבה עם כל מודול יציב. בזמן קריאת המדריך היא נחלשת.</p><a href="./audio/manual-mayhem-preview.mp3" target="_blank" style="color:#2e574b;font-size:12px">האזנה למיקס של 25 שניות ↗</a></div>`;
    } else if (paused) {
      $("overlay").innerHTML =
        `<div class="modal" dir="rtl"><div class="eyebrow">WORKSHOP PAUSED</div><h2>הסדנה בהפסקה</h2><p>הזמן והצליל עצרו.</p><button id="resume" class="primary">חזרה למכונה</button></div>`;
    } else if (state.status === "ready") {
      $("overlay").innerHTML =
        `<div class="modal" dir="rtl"><div class="eyebrow">ALL SYSTEMS STABLE</div><h2>מוכנים להתנעה.</h2><p>שלושת המודולים יציבים. הפעילו את מנוע הפסטיבל.</p><button id="engine-start" class="primary">START ENGINE ←</button></div>`;
    } else if (state.status === "won") {
      $("overlay").innerHTML =
        `<div class="modal" dir="rtl"><div class="eyebrow">FESTIVAL ENGINE ONLINE</div><h2>המוזיקה חזרה!</h2><p>${state.strikes} פסילות · ${state.retries} ניסיונות חוזרים · ${state.assisted ? "עם תמיכה" : "ללא רמז או תרגום"}</p><p>${mission.stage === "transfer" && !state.assisted && !state.strikes && !state.retries ? "העברה בהקשר חדש בוצעה בניסיון ראשון." : "זהו תרגול של הבנת הוראות. אפשר לחזור לניסיון עצמאי."}</p><button id="next" class="primary">${MISSIONS.findIndex((m) => m.id === mission.id) % 3 === 2 ? "למסלול הבא" : "למשימה הבאה"} ←</button><button id="retry-win">ניסיון נוסף</button></div>`;
    } else if (state.status === "shutdown") {
      $("overlay").innerHTML =
        `<div class="modal" dir="rtl"><div class="eyebrow">HARMLESS SHUTDOWN</div><h2>המנוע נח להפסקה.</h2><p>שלוש פסילות עצרו את הבדיקה. אפשר להתחיל שוב עם אותן הוראות.</p><button id="retry-shutdown" class="primary">ניסיון מחדש</button></div>`;
    }
    $("manual").hidden = !manual;
    $("manual").innerHTML = manual
      ? `<aside class="paper-manual"><header><div><small>FESTIVAL ENGINE CO.</small><h2>FIELD MANUAL</h2></div><button id="close-manual" aria-label="סגירת מדריך">×</button></header><div class="manual-note" dir="rtl">התאימו את תג המודול לדגם במדריך. קראו את כל הסעיף לפני פעולה. אין כאן סימון של הצעד הבא.</div>${missionManual(mission)}${mission.prediction ? choiceHtml("prediction") : ""}${mission.relay ? choiceHtml("relay") : ""}<div class="manual-bottom"><button id="translate">עזרה בעברית / תרגום</button><a href="?manual=1" target="_blank" rel="noopener">מדריך לשותף ↗</a></div>${translation ? `<div class="translation" dir="rtl">${mission.modules.map((s) => `<p><b>${s.serial}</b> ${s.translation}</p>`).join("")}</div>` : ""}<p class="tiny" dir="rtl">המדריך זמין ללא הגבלת זמן. רמז או תרגום מסמנים ניסיון עם תמיכה.</p></aside>`
      : "";
    scene.sync(state, mission);
    audio.duck(manual || translation || settings);
    audio.setPaused(paused || !started);
    bindDynamic();
  }
  function choiceHtml(type: "prediction" | "relay") {
    const c = mission[type]!;
    const ordered = c.options.map((o, i) => ({ o, i }));
    let seed = choiceSessionSeed;
    for (const ch of mission.id + type + (paired ? "B" : "A"))
      seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    for (let i = ordered.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = Math.floor((seed / 4294967296) * (i + 1));
      [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    }
    return `<section class="message-task"><div class="serial">${type === "relay" ? "OPERATOR RELAY" : "STARTUP PREDICTION"} ${state[type] ? "✓" : ""}</div><p dir="rtl">${type === "relay" ? "בחרו הודעה שלמה למפעיל:" : "לפני פעולה: צפו את התוצאה."}</p>${c.prompt ? `<p lang="en" dir="ltr">${c.prompt}</p>` : ""}${ordered
      .map(
        ({ o, i }) =>
          `<button data-choice="${type}" data-index="${i}" dir="ltr" ${state[type] ? "disabled" : ""}>${o}</button>`,
      )
      .join("")}</section>`;
  }
  function bindDynamic() {
    const pair = document.getElementById("paired-model");
    if (pair)
      pair.onclick = () => {
        paired = !paired;
        const original = MISSIONS.find((m) => m.id === "g9-transfer")!;
        mission = paired
          ? {
              ...original,
              title: "תחזית חדשה · דגם B",
              brief: "אותו לוח; הפעם המאוורר מוסיף לחץ. התוכנית חייבת להשתנות.",
              modules: original.modules.map((m) =>
                m.id === "switches" ? PAIRED_STARTUP : m,
              ),
              prediction: {
                prompt:
                  "Current pressure: 4. The next test adds 1 with the fan, or zero without it. If pressure reaches five, the engine will stop. What happens with the fan on?",
                options: [
                  "The engine will stop: 4 + 1 = 5.",
                  "The engine will stay at three.",
                  "The past record guarantees success.",
                ],
                correct: 0,
              },
              relay: {
                source:
                  "For this startup: If the pressure reaches five, the engine will stop. Stop the fan before TEST. Do not turn on either relay.",
                options: [
                  "If the pressure reaches five, the engine will stop. Start the fan before TEST; leave both relays off.",
                  "If the pressure reaches five, the engine will stop. Stop the fan before TEST; leave both relays off.",
                  "If the pressure reaches five, the engine will stop. Stop both relays after TEST; keep the fan on.",
                ],
                correct: 1,
              },
            }
          : original;
        state = createState(mission);
        state.retries = attemptHistory[attemptKey()] || 0;
        selected = null;
        scene.select(null);
        time = 240;
        manual = false;
        translation = false;
        audio.setProgress(0);
        update();
      };
    document
      .querySelectorAll<HTMLButtonElement>("[data-control]")
      .forEach(
        (b) => (b.onclick = () => handleControl(selected!, b.dataset.control!)),
      );
    document.querySelectorAll<HTMLButtonElement>("[data-module]").forEach(
      (b) =>
        (b.onclick = () => {
          if (started && !manual && !paused && !settings)
            selectModule(b.dataset.module!);
        }),
    );
    const click = (id: string, fn: () => void) => {
      const x = document.getElementById(id);
      if (x) x.onclick = fn;
    };
    click("start", () => {
      challenge = (document.getElementById("challenge") as HTMLInputElement)
        .checked;
      started = true;
      audio.start();
      update();
    });
    click("close-inspect", () => selectModule(null));
    click("close-manual", () => toggleManual());
    click("translate", () => {
      translation = !translation;
      if (translation) {
        state.assisted = true;
        recordAttempt();
      }
      update();
    });
    click("help", () => {
      translation = !translation;
      if (translation) {
        state.assisted = true;
        recordAttempt();
      }
      update();
    });
    click("recover", () => {
      resetModule(state, mission, selected!);
      recordAttempt();
      audio.cue("reset");
      update();
    });
    click("close-overlay", () => {
      settings = false;
      update();
    });
    click("resume", () => {
      paused = false;
      audio.start();
      update();
    });
    click("engine-start", () => {
      state.status = "won";
      saved[attemptKey()] = {
        strikes: state.strikes,
        assisted: state.assisted,
        retries: state.retries,
        events: state.events.length,
      };
      localStorage.setItem("mm-records", JSON.stringify(saved));
      recordAttempt();
      audio.cue("victory");
      update();
    });
    click("next", () => {
      const index = MISSIONS.findIndex((m) => m.id === mission.id);
      loadMission(MISSIONS[(index + 1) % MISSIONS.length]);
      ($("grade") as HTMLSelectElement).value = String(mission.grade);
    });
    for (const id of ["retry-win", "retry-shutdown"])
      click(id, () => {
        const retries = state.retries + 1;
        loadMission(mission);
        state.retries = retries;
        recordAttempt();
        update();
      });
    click("mute", () => {
      audio.setGains({ master: 0 });
      update();
    });
    click("sound-check", () => audio.cue("victory"));
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
          recordAttempt();
          audio.cue(good ? "latch" : "error");
          update();
        }),
    );
  }
  function toggleManual() {
    if (!started || paused || settings) return;
    manual = !manual;
    audio.cue("page");
    update();
  }
  $("manual-toggle").onclick = toggleManual;
  $("return").onclick = () => selectModule(null);
  $("restart").onclick = () => {
    const r = state.retries + 1;
    loadMission(mission);
    state.retries = r;
    recordAttempt();
    update();
  };
  $("pause").onclick = () => {
    if (!started) return;
    paused = !paused;
    manual = false;
    update();
  };
  $("settings").onclick = () => {
    settings = !settings;
    manual = false;
    update();
  };
  ($("grade") as HTMLSelectElement).onchange = (e) =>
    loadMission(
      MISSIONS.find(
        (m) => m.grade === Number((e.target as HTMLSelectElement).value),
      )!,
    );
  ($("mission") as HTMLSelectElement).onchange = (e) =>
    loadMission(
      MISSIONS.find((m) => m.id === (e.target as HTMLSelectElement).value)!,
    );
  window.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).matches("input,select,textarea")) return;
    if (e.code === "KeyM") {
      e.preventDefault();
      toggleManual();
    }
    if (e.key === "Escape") {
      if (manual) manual = false;
      else if (settings) settings = false;
      else if (paused) paused = false;
      else selectModule(null);
      update();
    }
    if (e.code === "KeyF") {
      if (document.fullscreenElement) document.exitFullscreen();
      else $("workspace").requestFullscreen();
    }
    if (
      ["Digit1", "Digit2", "Digit3"].includes(e.code) &&
      started &&
      !manual &&
      !paused &&
      !settings
    )
      selectModule(
        ["valves", "cable", "switches"][Number(e.code.slice(-1)) - 1],
      );
  });
  let last = performance.now(),
    seconds = 0;
  let windowBlurred = false;
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
    const dt = Math.min(ms / 1000, 0.1);
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
        if (small) small.textContent = Math.ceil(time) + "s";
      }
    }
    scene.render(paused || settings || windowBlurred ? 0 : dt, draw);
  }
  function loop(now: number) {
    if (now - last >= 40 && !document.hidden) {
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
        : manual
          ? "manual"
          : settings
            ? "settings"
            : paused
              ? "paused"
              : state.status,
      mission: {
        id: mission.id,
        grade: mission.grade,
        stage: mission.stage,
        title: mission.title,
        variant: paired ? "B" : "A",
      },
      coordinateSystem:
        "device front: x right, y up; left/right fixed facing module; z toward player",
      selected,
      view: {
        rotation: Math.round(scene.rotation * 1000) / 1000,
        camera: scene.camera.position.toArray(),
      },
      modules: state.modules.map((m, i) => ({
        id: m.id,
        serial: mission.modules[i].serial,
        complete: m.complete,
        fault: m.fault,
        world: m.world,
      })),
      manual: manual
        ? mission.modules.map((m) => ({ serial: m.serial, text: m.manual }))
        : undefined,
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
