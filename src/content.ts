export type Family = "valves" | "cable" | "switches";
export type World = Record<string, boolean | number | string>;
export interface ModuleSpec {
  id: string;
  family: Family;
  title: string;
  serial: string;
  manual: string;
  translation: string;
  help: string;
  initial: World;
  steps: string[][];
  effect: Record<string, World>;
  feedback: string;
  startup?: { deltaWithoutFan: number; deltaWithFan: number; stopAt: number };
  /** Gauge truth table: key is small-open bit followed by large-open bit. */
  pressureRule?: Record<'00' | '01' | '10' | '11', number>;
}
export interface Choice {
  source?: string;
  prompt?: string;
  options: string[];
  correct: number;
}
export interface Mission {
  id: string;
  grade: 7 | 8 | 9;
  stage: "guided" | "independent" | "transfer";
  title: string;
  brief: string;
  modules: ModuleSpec[];
  relay?: Choice;
  prediction?: Choice;
  /** Other physical bays remain present in standby, without learner actions. */
  activeModules?: string[];
}
export const valve = (
  serial: string,
  manual: string,
  steps: string[][],
  extra: Partial<ModuleSpec> = {},
): ModuleSpec => ({
  id: "valves",
  family: "valves",
  title: "VALVE BAY",
  serial,
  manual,
  translation:
    "קראו את הפעולה, את שם הברז ואת סדר הפעולות. Small = קטן; large = גדול; close = לסגור; open = לפתוח.",
  help: "זהו את הפעולה הראשונה במשפט; before מציב אותה לפני הפעולה השנייה.",
  initial: { small: true, large: false, pressure: 1 },
  steps,
  effect: {
    "small-close": { small: false, pressure: 1 },
    "small-open": { small: true, pressure: 3 },
    "large-open": { large: true, pressure: 2 },
    "large-close": { large: false, pressure: 1 },
  },
  feedback:
    "בדקו את “before / after” ואת שם הברז. סדר אחר גורם לשחרור קיטור; אפשר לאפס את המודול ולנסות שוב.",
  ...extra,
});
export const cable = (
  serial: string,
  manual: string,
  socket = "square",
  extra: Partial<ModuleSpec> = {},
): ModuleSpec => ({
  id: "cable",
  family: "cable",
  title: "PATCH BAY",
  serial,
  manual,
  translation:
    "Square = מרובע; round = עגול; below = מתחת. חברו לשקע המתואר, סגרו את התפסים ורק אז בדקו.",
  help: "המסך הוא נקודת הייחוס. השקע הנכון נמצא מתחת לצורה הכתובה; שני התפסים קודמים לבדיקה.",
  initial: { connected: "none", clipA: false, clipB: false, signal: "idle" },
  steps: [["connect-" + socket], ["clip-a", "clip-b"], ["test"]],
  effect: {
    "connect-square": { connected: "square" },
    "connect-round": { connected: "round" },
    "clip-a": { clipA: true },
    "clip-b": { clipB: true },
    test: { signal: "stable" },
  },
  feedback:
    "הביטוי “below the … screen” מציין שקע מסוים. “after both clips are closed” מחייב לסגור את שניהם לפני TEST.",
  ...extra,
});
export const switches = (
  serial: string,
  manual: string,
  steps: string[][],
  extra: Partial<ModuleSpec> = {},
): ModuleSpec => ({
  id: "switches",
  family: "switches",
  title: "RELAY DECK",
  serial,
  manual,
  translation:
    "Left = שמאל; right = ימין (מול המודול). הפעולה והמקבל שלה קובעים איזה מנוף להזיז. Test = בדיקה.",
  help: "קראו מה מופעל ועל ידי איזה מנוף. מנוף השמאל נמצא משמאל כאשר מביטים ישר במודול.",
  initial: {
    left: false,
    right: false,
    fan: false,
    pressure: 4,
    receiver: "none",
    signal: "idle",
  },
  steps,
  effect: {
    "left-on": { left: true, receiver: "cooling line" },
    "right-on": { right: true, receiver: "music line" },
    "left-off": { left: false },
    "right-off": { right: false },
    "fan-on": { fan: true, pressure: 2 },
    "fan-off": { fan: false, pressure: 4 },
    test: { signal: "stable" },
    reset: { signal: "reset" },
  },
  feedback:
    "בדקו את המילים “by”, “before”, “do not” ואת המקבל. פעולה לא מתאימה מוסיפה פסילה; איפוס משחזר את מצב ההתחלה.",
  ...extra,
});
export const MISSIONS: Mission[] = [
  {
    id: "g7-guided",
    grade: 7,
    stage: "guided",
    title: "סיבוב ראשון",
    brief:
      "מנוע הפסטיבל צריך שלושה מודולים יציבים. קראו את תג הדגם, פתחו M ובצעו את ההוראות.",
    modules: [
      valve(
        "V-01",
        "First, close the small valve. Next, open the large valve. Do not press RESET.",
        [["small-close"], ["large-open"]],
        {
          help: "First = קודם: סגרו את הברז הקטן. Next = אחר כך: פתחו את הגדול.",
        },
      ),
      cable(
        "C-01",
        "Connect the cable below the square screen. Close both clips. Finally, press TEST.",
      ),
      switches(
        "S-01",
        "Turn on the left lever. Then press TEST. Do not turn on the right lever.",
        [["left-on"], ["test"]],
      ),
    ],
  },
  {
    id: "g7-independent",
    grade: 7,
    stage: "independent",
    title: "בלי קיצורי דרך",
    brief: "אותה מכונה, הוראות חדשות. חובה ואיסור משנים את הנוהל.",
    modules: [
      valve(
        "V-02",
        "You must open the large valve before you close the small valve. Do not press RESET.",
        [["large-open"], ["small-close"]],
      ),
      cable(
        "C-02",
        "You must connect the cable below the round screen. Close both clips before TEST. Do not use the square socket.",
        "round",
      ),
      switches(
        "S-02",
        "Do not turn on the left lever. You must turn on the right lever before TEST.",
        [["right-on"], ["test"]],
      ),
    ],
  },
  {
    id: "g7-transfer",
    grade: 7,
    stage: "transfer",
    title: "במת הלילה",
    brief: "מודולי במה חלופיים הגיעו. היעזרו במילים ובצורות, לא במיקום שזכרתם.",
    modules: [
      valve(
        "V-03",
        "Open the small valve. Then close the large valve. You must not press RESET.",
        [["small-open"], ["large-close"]],
        {
          initial: { small: false, large: true, pressure: 2 },
          help: "זוהי משימת העברה: חפשו את הפועל ואת החפץ בכל שלב.",
        },
      ),
      cable(
        "C-03",
        "First, close both clips. Next, connect the cable below the round screen. Finally, press TEST.",
        "round",
        { steps: [["clip-a", "clip-b"], ["connect-round"], ["test"]] },
      ),
      switches(
        "S-03",
        "Turn on the right lever. Turn on the left lever after that. Do not press RESET. Finally, press TEST.",
        [["right-on"], ["left-on"], ["test"]],
      ),
    ],
  },
  {
    id: "g8-guided",
    grade: 8,
    stage: "guided",
    title: "מי מקבל את הפעולה?",
    brief: "מקבל הפעולה בסביל מופיע כנושא. מצאו איזה קו נפתח ועל ידי מה.",
    modules: [
      valve(
        "V-11",
        "The small valve is closed by turning its wheel. The large valve is opened after the small valve is closed.",
        [["small-close"], ["large-open"]],
      ),
      cable(
        "C-11",
        "The square-screen socket is connected by the loose cable. Both clips are closed before TEST.",
      ),
      switches(
        "S-11",
        "The cooling line is opened by the left lever. The music line is opened by the right lever. Open only the cooling line, then press TEST.",
        [["left-on"], ["test"]],
        {
          help: "The cooling line מקבל את הפעולה; by the left lever מציין מה מפעיל אותו. הזיזו את המנוף הזה.",
          feedback:
            "“The cooling line is opened by the left lever”: קו הקירור מקבל את הפעולה, והמנוף השמאלי מפעיל אותו. לא מדובר בקירור המנוף.",
        },
      ),
    ],
  },
  {
    id: "g8-independent",
    grade: 8,
    stage: "independent",
    title: "ממסר מדויק",
    brief: "שמרו את סדר הפעולות בהודעה למפעיל. פרט על הקישוט אינו נחוץ לו.",
    relay: {
      source:
        "Festival notice: The flags are orange. Close both clips before you connect the cable below the square screen. Press TEST after the cable is connected.",
      options: [
        "Connect the cable, press TEST, then close both clips.",
        "Close both clips, connect below the square screen, then press TEST.",
        "Close both clips, connect below the round screen, then press TEST.",
      ],
      correct: 1,
    },
    modules: [
      valve("V-12", "Close the small valve after you open the large valve.", [
        ["large-open"],
        ["small-close"],
      ]),
      cable(
        "C-12",
        "Close both clips before you connect the cable below the square screen. Press TEST after the cable is connected.",
        "square",
        { steps: [["clip-a", "clip-b"], ["connect-square"], ["test"]] },
      ),
      switches(
        "S-12",
        "The cooling line is opened by the right lever. The music line is opened by the left lever. Open only the cooling line before TEST.",
        [["right-on"], ["test"]],
        {
          effect: {
            "left-on": { left: true, receiver: "music line" },
            "right-on": { right: true, receiver: "cooling line" },
            test: { signal: "stable" },
          },
        },
      ),
    ],
  },
  {
    id: "g8-transfer",
    grade: 8,
    stage: "transfer",
    title: "מכונת הגשם",
    brief:
      "מכונה חלופית הפכה את חיבורי המנופים. מסרו את המגבלה בלי להשמיט אותה.",
    relay: {
      source:
        "Open only the music line. It is opened by the left lever. Press TEST after it opens. Do not open the cooling line.",
      options: [
        "Open the cooling line with the right lever, then TEST.",
        "Open both lines before TEST.",
        "Open only the music line with the left lever, then TEST.",
      ],
      correct: 2,
    },
    modules: [
      valve(
        "V-13",
        "Before you close the large valve, open the small valve.",
        [["small-open"], ["large-close"]],
        { initial: { small: false, large: true, pressure: 2 } },
      ),
      cable(
        "C-13",
        "The cable is connected below the round screen after both clips are closed. Then TEST.",
        "round",
        { steps: [["clip-a", "clip-b"], ["connect-round"], ["test"]] },
      ),
      switches(
        "S-13",
        "The music line is opened by the left lever. The cooling line is opened by the right lever. Open only the music line, then TEST.",
        [["left-on"], ["test"]],
        {
          effect: {
            "left-on": { left: true, receiver: "music line" },
            "right-on": { right: true, receiver: "cooling line" },
            test: { signal: "stable" },
          },
          help: "חפשו את הקו המבוקש ולא את המנוף ממשימה קודמת.",
        },
      ),
    ],
  },
  {
    id: "g9-guided",
    grade: 9,
    stage: "guided",
    title: "חוק שחוזר בכל בדיקה",
    brief:
      "בדקו את החוק שלוש פעמים. זהו כלל קבוע של המכונה, לא תחזית להתנעה יחידה.",
    modules: [
      valve(
        "V-21",
        "Fixed rule: If the narrow (small) valve is open, the blue gauge rises to three. If it is closed, the gauge falls to one. Calibration targets: three, one, three. Set the gauge to each target and TEST after each setting.",
        [
          ["small-open"],
          ["test"],
          ["small-close"],
          ["test"],
          ["small-open"],
          ["test"],
        ],
        {
          initial: { small: false, large: false, pressure: 1 },
          effect: {
            "small-open": { small: true, pressure: 3 },
            "small-close": { small: false, pressure: 1 },
            test: { signal: "tested" },
          },
          help: "if + הווה ותוצאה בהווה מתארים כאן כלל שחוזר. בדקו פתוח, סגור ואז פתוח שוב.",
          feedback:
            "כאן החוק קבוע: פתוח → 3; סגור → 1. בצעו את שלושת מחזורי הבדיקה לפי ההוראה.",
        },
      ),
      cable(
        "C-21",
        "If both clips are closed, the signal stays steady. Connect below the square screen, close both clips, then TEST.",
      ),
      switches(
        "S-21",
        "If the fan is on, the pressure stays at two. Turn on the fan, then TEST.",
        [["fan-on"], ["test"]],
      ),
    ],
  },
  {
    id: "g9-independent",
    grade: 9,
    stage: "independent",
    title: "יומן התיקונים",
    brief:
      "מה הוחלף אתמול? מה עדיין לא עובד עכשיו? שתי ראיות שונות, שתי החלטות.",
    modules: [
      valve(
        "V-22",
        "Maintenance: The large valve was replaced yesterday. Current test: both valves work. For startup, open the large valve before you close the small valve.",
        [["large-open"], ["small-close"]],
      ),
      cable(
        "C-22",
        "The round-screen socket was replaced yesterday. Current test: the square-screen socket has no signal; the round-screen socket works. Connect below the round screen, close both clips, then TEST.",
        "round",
      ),
      switches(
        "S-22",
        "Record: The left relay was replaced yesterday. Attach the REPLACED tag to the relay named in this record. Current check: the left relay still fails; the right relay works. Leave the replaced relay off. Turn on the working relay, then TEST.",
        [["tag-left"], ["right-on"], ["test"]],
        {
          initial: {
            left: false,
            right: false,
            fan: false,
            pressure: 4,
            receiver: "none",
            signal: "idle",
            maintenanceTag: "none",
          },
          effect: {
            "tag-left": { maintenanceTag: "left" },
            "tag-right": { maintenanceTag: "right" },
            "right-on": { right: true, receiver: "working relay" },
            test: { signal: "stable" },
          },
          feedback:
            "“was replaced” אומר מה הוחלף בעבר, לא מה עובד כעת. “left … still fails; right … works” הוא בדיקת המצב הנוכחי.",
          help: "היומן מזהה את השמאלי כמקבל הפעולה בעבר. בדיקת ההווה מחייבת להשאיר אותו כבוי.",
        },
      ),
    ],
  },
  {
    id: "g9-transfer",
    grade: 9,
    stage: "transfer",
    title: "תחזית להתנעה הבאה",
    brief:
      "הבדיקה הבאה תעלה לחץ בשתיים. צפו מה יקרה, ואז מנעו את העצירה לפי התוכנית.",
    prediction: {
      prompt:
        "Current pressure: 3. The next test adds 2 without the fan. If the pressure reaches five, the engine will stop. What will happen without the fan?",
      options: [
        "The engine will stop: 3 + 2 = 5.",
        "The engine will keep running at three.",
        "The record proves the fan was repaired.",
      ],
      correct: 0,
    },
    relay: {
      source:
        "For this startup: If the pressure reaches five, the engine will stop. Start the fan before the next test. Do not turn on either relay.",
      options: [
        "If the pressure reaches five, the engine will stop. Test first, then start the fan; leave both relays off.",
        "If the pressure reaches five, the engine will stop. Start the fan before TEST; leave both relays off.",
        "If the pressure reaches five, the engine will stop. Start the fan and both relays, then TEST.",
      ],
      correct: 1,
    },
    modules: [
      valve(
        "V-23",
        "Before this startup, close the small valve before you open the large valve.",
        [["small-close"], ["large-open"]],
      ),
      cable(
        "C-23",
        "The square socket was replaced. Current check: both sockets work. For this startup, connect below the round screen after both clips are closed, then TEST.",
        "round",
        { steps: [["clip-a", "clip-b"], ["connect-round"], ["test"]] },
      ),
      switches(
        "S-23",
        "For this startup: If the pressure reaches five, the engine will stop. Current pressure: three. The next test adds two without the fan, or zero with it. Start the fan before TEST. Do not turn on either relay.",
        [["fan-on"], ["test"]],
        {
          startup: { deltaWithoutFan: 2, deltaWithFan: 0, stopAt: 5 },
          initial: {
            left: false,
            right: false,
            fan: false,
            pressure: 3,
            signal: "idle",
          },
          effect: {
            "fan-on": { fan: true, pressure: 3 },
            test: { pressure: 3, signal: "safe startup" },
          },
          feedback:
            "“will stop” היא תחזית להתנעה הזאת. בלי מאוורר: 3 + 2 = 5 → עצירה. ההוראה “before” מחייבת מאוורר לפני TEST.",
        },
      ),
    ],
  },
];
export const STAGE_HE = {
  guided: "תרגול מודרך",
  independent: "ניסיון עצמאי",
  transfer: "העברה להקשר חדש",
};

// Paired workshop variant: same physical panel, changed condition and valid plan.
export const PAIRED_STARTUP: ModuleSpec = switches(
  "S-24",
  "For this startup: If the pressure reaches five, the engine will stop. Current pressure: four. The next test adds one with the fan, or zero without it. Stop the fan before TEST. Do not turn on either relay.",
  [["fan-off"], ["test"]],
  {
    startup: { deltaWithoutFan: 0, deltaWithFan: 1, stopAt: 5 },
    initial: {
      left: false,
      right: false,
      fan: true,
      pressure: 4,
      signal: "idle",
    },
    effect: { "fan-off": { fan: false }, test: { signal: "safe startup" } },
    feedback:
      "כאן המאוורר מוסיף אחת: 4 + 1 = 5. התוכנית השתנתה, ולכן מכבים אותו לפני הבדיקה.",
  },
);
