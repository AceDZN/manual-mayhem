import { valve, cable, switches, type Mission, type ModuleSpec, type Choice, type World } from './content';

/** grade is source provenance only. The campaign is open to everyone. */
export interface CampaignLevel extends Mission {
  level: number;
  chapter: string;
  skill: string;
  activeModules?: string[];
  sourceModules: string[];
}

const IMP = ['modals-and-imperatives', 'reading-functional-texts'];
const PASS = ['present-simple-passive-reference', 'connectors-and-time-clauses'];
const MED = 'mediation-and-shared-understanding';
const PAST = 'past-simple-passive-reference';
const COND = 'conditionals-reference';
const MED9 = 'mediation-reference';
const serial = (prefix: string, n: number) => `${prefix}-${String(n).padStart(2, '0')}`;
const merge = (base: ModuleSpec, extra: Partial<ModuleSpec>): ModuleSpec => ({
  ...base, ...extra, effect: { ...base.effect, ...extra.effect },
});
const V = (n: number, manual: string, steps: string[][], extra: Partial<ModuleSpec> = {}) => merge(valve(serial('V', n), manual, steps), {
  help: 'זהו את הפועל ואת החפץ. before = לפני; after = אחרי; first = תחילה; finally = לבסוף. קראו גם את האיסור ואת מצב ההתחלה.',
  translation: 'מילון עזר: small = קטן; large = גדול; close = לסגור; open = לפתוח; keep = להשאיר; do not / must not = אסור. זה אינו תחליף לקריאת הסדר והתנאים במקור.',
  ...extra,
  effect: { test: { signal: 'tested' }, ...extra.effect },
});
const C = (n: number, manual: string, socket: 'square' | 'round', extra: Partial<ModuleSpec> = {}) => merge(cable(serial('C', n), manual, socket), {
  help: 'המסך הוא נקודת הייחוס. קראו אם התפסים קודמים לחיבור או באים אחריו, ואם אחד מהם כבר סגור.',
  translation: 'מילון עזר: square = מרובע; round = עגול; below = מתחת; both = שניהם; already = כבר; before = לפני; after = אחרי. סדר התפסים והחיבור משתנה בין הדגמים.',
  ...extra,
});
const S = (n: number, manual: string, steps: string[][], extra: Partial<ModuleSpec> = {}) => merge(switches(serial('S', n), manual, steps), {
  help: 'Left ו־right קבועים במבט ישר מול המודול. חפשו את המקבל, את המנוף המפעיל, את הסדר ואת מה שחייב להישאר כבוי.',
  translation: 'מילון עזר: left = שמאל; right = ימין; turn on / start = להפעיל; turn off / stop = לכבות; by = על ידי; only = רק; then = אחר כך. בדקו את התנאים במקור לפני פעולה.',
  ...extra,
});
const initV = (small: boolean, large: boolean, pressure = 1): World => ({ small, large, pressure });
const initS = (extra: World = {}): World => ({ left: false, right: false, fan: false, pressure: 4, receiver: 'none', signal: 'idle', ...extra });
const route = (left: string, right: string) => ({
  'left-on': { left: true, receiver: left }, 'right-on': { right: true, receiver: right },
});
const clipsFirst = (socket: 'square' | 'round') => [['clip-a', 'clip-b'], [`connect-${socket}`], ['test']];
const standby = (spec: ModuleSpec): ModuleSpec => ({ ...spec, manual: 'STANDBY — this bay is already stable. Leave its controls unchanged.', translation: 'המודול הזה במצב המתנה יציב. אין צורך להפעיל אותו בשלב הזה.', help: 'בשלבים הראשונים עובדים רק במודולים הפעילים.', steps: [] });
const build = (
  level: number, title: string, skill: string, modules: ModuleSpec[],
  extra: Partial<CampaignLevel> = {},
): CampaignLevel => ({
  level, id: `level-${String(level).padStart(2, '0')}`,
  grade: level <= 10 ? 7 : level <= 20 ? 8 : 9,
  stage: [1, 2, 3, 11, 21, 24, 27].includes(level) ? 'guided' : [10, 20, 30].includes(level) ? 'transfer' : 'independent',
  title, brief: 'קראו את תג הדגם ואת הנוהל המלא. המילים קובעות את הפעולה; אפשר לקרוא ללא לחץ זמן.',
  chapter: level <= 10 ? 'הוראות וסדר פעולות' : level <= 20 ? 'מקבל הפעולה ומסר מדויק' : level <= 23 ? 'יומן תחזוקה ובדיקה עכשווית' : level <= 26 ? 'כלל קבוע וכיול' : 'תחזית ותוכנית התנעה',
  skill, sourceModules: level <= 10 ? IMP : level <= 20 ? PASS : level <= 23 ? [PAST, MED9] : [COND, MED9],
  activeModules: ['valves', 'cable', 'switches'], modules, ...extra,
});
const relay = (source: string, options: string[], correct: number): Choice => ({ source, options, correct });
const maintenance = (replaced: 'left' | 'right', working: 'left' | 'right', n: number, tail = '') => S(n,
  `Record: The ${replaced} relay was replaced yesterday. Attach the REPLACED tag to that relay. Current check: the ${working} relay works; the ${working === 'left' ? 'right' : 'left'} relay fails. Turn on only the working relay, then press TEST. ${tail || 'Leave the failing relay off.'}`,
  [[`tag-${replaced}`], [`${working}-on`], ['test']], {
    initial: initS({ maintenanceTag: 'none', tagLeft: true, tagRight: true }),
    effect: { 'tag-left': { maintenanceTag: 'left' }, 'tag-right': { maintenanceTag: 'right' }, [`${working}-on`]: { [working]: true, receiver: 'working relay' } },
    help: 'was replaced מציין איזה רכיב הוחלף. Current check הוא המקור למה שעובד עכשיו.',
    translation: `סמנו את הממסר ה${replaced === 'left' ? 'שמאלי' : 'ימני'} כמוחלף. לפי הבדיקה העכשווית מפעילים רק את ה${working === 'left' ? 'שמאלי' : 'ימני'}.`,
    feedback: 'המקבל ב־was replaced מזהה את התיקון בעבר; הבדיקה העכשווית קובעת איזה ממסר מותר להפעיל. אל תסיקו שאירוע בעבר מוכיח שהרכיב עובד עכשיו.',
  });

export const CAMPAIGN: CampaignLevel[] = [
  build(1, 'סגירה ראשונה', 'imperative: action + object', [
    V(1, 'Close the small valve. Leave the large valve closed. Do not press RESET.', [['small-close']], { help: 'Close = לסגור. Small valve = הברז הקטן A. בשלב הזה נדרשת פעולה אחת בלבד.' }),
    standby(C(1, '', 'square')), standby(S(1, '', [])),
  ], { activeModules: ['valves'], brief: 'פעולה אחת, חפץ אחד: סגירת הברז הקטן.' }),
  build(2, 'השקע שמתחת למסך', 'shape reference + ordered procedure', [
    standby(V(2, '', [])),
    C(2, 'Connect the cable below the square screen. Close both clips. Finally, press TEST. Do not use the round socket.', 'square'),
    standby(S(2, '', [])),
  ], { activeModules: ['cable'], brief: 'מזהים צורה, מחברים, סוגרים שני תפסים ובודקים.' }),
  build(3, 'רק המנוף השמאלי', 'imperative + negative instruction', [
    standby(V(3, '', [])), standby(C(3, '', 'square')),
    S(3, 'Turn on the left lever. Then press TEST. Do not turn on the right lever or the fan.', [['left-on'], ['test']], { help: 'Left הוא שמאל במבט ישר מול המודול. Do not אוסר את שתי הפעולות האחרות.' }),
  ], { activeModules: ['switches'] }),
  build(4, 'הכנת הבמה', 'two procedures with different objects', [
    V(4, 'First, close the small valve. Next, open the large valve. Do not press RESET.', [['small-close'], ['large-open']]),
    C(4, 'Connect below the round screen. Close both clips, then press TEST. Do not connect below the square screen.', 'round'),
    standby(S(4, '', [])),
  ], { activeModules: ['valves', 'cable'], brief: 'שני מודולים פעילים. בכל אחד קוראים את תג הדגם שלו.' }),
  build(5, 'נוהל חובה', 'must + reversed order + prohibition', [
    V(5, 'You must open the large valve before you close the small valve. Do not press RESET.', [['large-open'], ['small-close']]),
    standby(C(5, '', 'square')),
    S(5, 'Do not turn on the left lever. Turn on the right lever, then press TEST. Leave the fan off.', [['right-on'], ['test']]),
  ], { activeModules: ['valves', 'switches'] }),
  build(6, 'שני נהלים', 'before + two-step relay order', [
    standby(V(6, '', [])),
    C(6, 'Close both clips before you connect below the square screen. Finally, press TEST.', 'square', { steps: clipsFirst('square') }),
    S(6, 'First, turn on the right lever. Next, turn on the left lever. Finally, press TEST. Do not press RESET.', [['right-on'], ['left-on'], ['test']]),
  ], { activeModules: ['cable', 'switches'] }),
  build(7, 'שלוש מערכות מתעוררות', 'three families + reopen instruction', [
    V(7, 'Close the small valve, open the large valve, and then open the small valve again. Do not close the large valve.', [['small-close'], ['large-open'], ['small-open']]),
    C(7, 'Connect below the square screen. Close clip A before clip B. Then press TEST.', 'square', { steps: [['connect-square'], ['clip-a'], ['clip-b'], ['test']] }),
    S(7, 'Turn on the fan. Then turn on the left lever and press TEST. Leave the right lever off.', [['fan-on'], ['left-on'], ['test']]),
  ]),
  build(8, 'מנוע הערב', 'changed initial state + keep closed', [
    V(8, 'Close the large valve. Then open the small valve. Keep the large valve closed.', [['large-close'], ['small-open']], { initial: initV(false, true, 2) }),
    C(8, 'Connect below the round screen. Close clip B before clip A. Press TEST last.', 'round', { steps: [['connect-round'], ['clip-b'], ['clip-a'], ['test']] }),
    S(8, 'Start the fan. Turn on the left lever, then turn it off. Finally, press TEST. Do not turn on the right lever.', [['fan-on'], ['left-on'], ['left-off'], ['test']]),
  ]),
  build(9, 'בדיקת ערב', 'negation over final state + named clip order', [
    V(9, 'Close the small valve. Open the large valve, then close it again. Do not reopen the small valve.', [['small-close'], ['large-open'], ['large-close']]),
    C(9, 'Close clip B first, then clip A. Connect below the round screen only after both clips are closed. Press TEST.', 'round', { steps: [['clip-b'], ['clip-a'], ['connect-round'], ['test']] }),
    S(9, 'Turn on the right lever, then the left lever. Turn off the right lever before TEST. You must not leave it on.', [['right-on'], ['left-on'], ['right-off'], ['test']]),
  ]),
  build(10, 'במה חדשה, אותו מדריך', 'unaided changed-context imperative transfer', [
    V(10, 'Open the small valve. Close the large valve after that. Finally, close the small valve. Do not press RESET.', [['small-open'], ['large-close'], ['small-close']], { initial: initV(false, true, 2) }),
    C(10, 'Clip B is already closed. First, connect below the round screen. Next, close clip A. Finally, press TEST. Leave clip B closed.', 'round', { initial: { connected: 'none', clipA: false, clipB: true, signal: 'idle' }, steps: [['connect-round'], ['clip-a'], ['test']] }),
    S(10, 'The fan is already on. Turn it off. Then turn on the right lever before the left lever. Press TEST last.', [['fan-off'], ['right-on'], ['left-on'], ['test']], { initial: initS({ fan: true, pressure: 2 }) }),
  ]),
  build(11, 'מי מקבל את הפעולה', 'present passive receiver + by-agent', [
    V(11, 'The small valve is closed by turning its wheel. The large valve is opened after the small valve is closed.', [['small-close'], ['large-open']]),
    C(11, 'The square-screen socket is connected by the loose cable. Both clips are closed after the cable is connected. Then press TEST.', 'square'),
    S(11, 'The music line is opened by the left lever. The cooling line is opened by the right lever. Open only the music line, then press TEST.', [['left-on'], ['test']], { effect: route('music line', 'cooling line'), help: 'The music line הוא מקבל הפעולה. by the left lever מציין מה פותח אותו.' }),
  ], { sourceModules: [...PASS, MED] }),
  build(12, 'מפת קווים חדשה', 'changed passive receiver mapping', [
    V(12, 'The large valve is opened before the small valve is closed. Do not press RESET.', [['large-open'], ['small-close']]),
    C(12, 'Both clips are closed before the cable is connected below the square screen. Press TEST after the connection.', 'square', { steps: clipsFirst('square') }),
    S(12, 'The cooling line is opened by the right lever; the music line is opened by the left lever. Open only the cooling line. Start the fan after that, then TEST.', [['right-on'], ['fan-on'], ['test']], { effect: route('music line', 'cooling line') }),
    ], { sourceModules: [...PASS, MED], relay: relay('The cooling line is opened by the right lever. Open only that line. Start the fan after it opens, then TEST.', ['Open only cooling with the right lever; then start the fan and TEST.', 'Open cooling with the left lever, then TEST.', 'Start both lines and TEST before the fan.'], 0) }),
  build(13, 'שני קווים, סדר אחד', 'passive receivers + after sequence', [
    V(13, 'Before the large valve is closed, the small valve is opened. Keep the small valve open.', [['small-open'], ['large-close']], { initial: initV(false, true, 2) }),
    C(13, 'The cable is connected below the round screen. After both clips are closed, press TEST.', 'round'),
    S(13, 'The music line is opened by the left lever, and cooling is opened by the right lever. Open music before cooling. Press TEST after both lines are open.', [['left-on'], ['right-on'], ['test']], { effect: route('music line', 'cooling line') }),
  ]),
  build(14, 'הודעה בלי קישוטים', 'relevant relay preserves receiver/order/prohibition', [
    V(14, 'After the small valve is closed, open the large valve. Then reopen the small valve. Do not close the large valve.', [['small-close'], ['large-open'], ['small-open']]),
    C(14, 'Both clips are closed before the cable is connected below the round screen. Press TEST after the connection.', 'round', { steps: clipsFirst('round') }),
    S(14, 'The cooling line is opened by the left lever; music is opened by the right lever. Open cooling. Turn it off before you open music. Then TEST.', [['left-on'], ['left-off'], ['right-on'], ['test']]),
  ], { sourceModules: [...PASS, MED], relay: relay('The bunting is orange. Both clips are closed before the cable is connected below the round screen. TEST follows the connection. Do not use the square socket.', ['Connect below round, then TEST and close clips.', 'Close both clips; connect below round; TEST. Do not use square.', 'Close both clips; connect below square; TEST.'], 1) }),
  build(15, 'כשהקו נפתח', 'when clause + reversed receiver', [
    V(15, 'The small valve is opened before the large valve is opened. When both are open, close the large valve. Leave the small valve open.', [['small-open'], ['large-open'], ['large-close']], { initial: initV(false, false) }),
    C(15, 'Clip A is already closed. The cable is connected below the square screen before clip B is closed. When both clips are closed, TEST.', 'square', { initial: { connected: 'none', clipA: true, clipB: false, signal: 'idle' }, steps: [['connect-square'], ['clip-b'], ['test']] }),
    S(15, 'The music line is opened by the right lever; cooling is opened by the left lever. When the music line is open, start the fan. Then TEST. Do not open cooling.', [['right-on'], ['fan-on'], ['test']]),
  ]),
  build(16, 'לשמור על מילה קטנה', 'only + before clause in mediated instruction', [
    V(16, 'Close the large valve before the small valve is opened. Close the small valve again after it is opened.', [['large-close'], ['small-open'], ['small-close']], { initial: initV(false, true, 2) }),
    C(16, 'Clip B is already closed. Close clip A before the cable is connected below the round screen. Then TEST.', 'round', { initial: { connected: 'none', clipA: false, clipB: true, signal: 'idle' }, steps: [['clip-a'], ['connect-round'], ['test']] }),
    S(16, 'Cooling is opened by the right lever. Music is opened by the left lever. Start the fan before you open only music. Then press TEST. Leave cooling closed.', [['fan-on'], ['left-on'], ['test']], { effect: route('music line', 'cooling line') }),
  ], { sourceModules: [...PASS, MED], relay: relay('Cooling is opened by the right lever. Music is opened by the left lever. Start the fan before opening only music. TEST follows. Leave cooling closed.', ['Open music with left, TEST, then start the fan.', 'Start the fan, then open both lines and TEST.', 'Start the fan; open only music with left; TEST. Leave cooling closed.'], 2) }),
  build(17, 'חיווט הבמה', 'explicit current state + ordered passive procedure', [
    V(17, 'The large valve is closed after the small valve is closed. Open the large valve again before TEST.', [['small-close'], ['large-close'], ['large-open'], ['test']], { initial: initV(true, true, 2) }),
    C(17, 'The cable is already connected below the square screen. Clip B is closed before clip A. Press TEST when both clips are closed. Do not reconnect the cable.', 'square', { initial: { connected: 'square', clipA: false, clipB: false, signal: 'idle' }, steps: [['clip-b'], ['clip-a'], ['test']] }),
    S(17, 'The music line is opened by the right lever. Open it, start the fan, then close the music line before TEST. Leave the left lever off.', [['right-on'], ['fan-on'], ['right-off'], ['test']]),
  ]),
  build(18, 'הסדר במסר משנה', 'retain reference and sequence across relay', [
    V(18, 'The small valve is closed after the large valve is opened. Close the large valve before you reopen the small valve.', [['large-open'], ['small-close'], ['large-close'], ['small-open']]),
    C(18, 'Connect below the round screen. Close clip A before clip B. Press TEST after both are closed. Do not use the square socket.', 'round', { steps: [['connect-round'], ['clip-a'], ['clip-b'], ['test']] }),
    S(18, 'Cooling is opened by the left lever; music is opened by the right lever. Open cooling before music. Turn cooling off after music opens, then TEST.', [['left-on'], ['right-on'], ['left-off'], ['test']]),
  ], { sourceModules: [...PASS, MED], relay: relay('Connect below the round screen. Close A before B, then TEST. Do not use the square socket. The concert begins at dusk.', ['Connect below round; close A then B; TEST. Do not use square.', 'Close B then A, connect below round, TEST.', 'Connect below square; close A then B; TEST.'], 0) }),
  build(19, 'הנמען צריך את התנאי', 'when + explicit current state + preserved only', [
    V(19, 'Both valves are open now. Before the small valve is closed, close the large valve. When both are closed, open only the large valve.', [['large-close'], ['small-close'], ['large-open']], { initial: initV(true, true, 4) }),
    C(19, 'Clip A is closed now. Close clip B before connecting below the square screen. Press TEST when the cable is connected. Leave clip A closed.', 'square', { initial: { connected: 'none', clipA: true, clipB: false, signal: 'idle' }, steps: [['clip-b'], ['connect-square'], ['test']] }),
    S(19, 'Music is opened by the left lever, cooling by the right lever. Open cooling before music. Start the fan only after both lines are open. Then TEST.', [['right-on'], ['left-on'], ['fan-on'], ['test']], { effect: route('music line', 'cooling line') }),
  ], { sourceModules: [...PASS, MED], relay: relay('Clip A is closed. Close B before connecting below the square screen. TEST follows the connection. Leave A closed.', ['Open A, close B, connect below square, TEST.', 'Leave A closed; close B; connect below square; TEST.', 'Close B; connect below round; TEST.'], 1) }),
  build(20, 'מנוע מסירת המסר', 'changed-context passive/time-clause transfer', [
    V(20, 'Before the large valve is opened, the small valve is closed. After the large valve is opened, close it again. Then reopen the small valve.', [['small-close'], ['large-open'], ['large-close'], ['small-open']]),
    C(20, 'The cable is already connected below the round screen. Close clip A before clip B. TEST is pressed when both are closed. Do not move the cable.', 'round', { initial: { connected: 'round', clipA: false, clipB: false, signal: 'idle' }, steps: [['clip-a'], ['clip-b'], ['test']] }),
    S(20, 'Music is opened by the right lever, cooling by the left lever. Start the fan. Open music before cooling. Then turn the fan off before TEST.', [['fan-on'], ['right-on'], ['left-on'], ['fan-off'], ['test']]),
  ], { sourceModules: [...PASS, MED], relay: relay('Start the fan. Music is opened by right, cooling by left. Open music before cooling. Turn the fan off before TEST. Do not press RESET.', ['Start fan; open left then right; fan off; TEST.', 'Start fan; open right then left; TEST; fan off.', 'Start fan; open music with right, then cooling with left; fan off; TEST. No RESET.'], 2) }),
  build(21, 'מה הוחלף ומה עובד', 'past passive receiver + independent current check', [
    V(21, 'The large valve was replaced yesterday. Current test: both valves work. Close the small valve, then open the large valve.', [['small-close'], ['large-open']]),
    C(21, 'The round socket was replaced yesterday. Current check: only the round socket works. Connect below round, close both clips, then TEST.', 'round'),
    maintenance('left', 'right', 21),
  ]),
  build(22, 'תיקון אינו הבטחה', 'past passive changed receiver; explicit failure remains', [
    V(22, 'The small valve was replaced. Current check: both valves work. Open the small valve before closing the large valve.', [['small-open'], ['large-close']], { initial: initV(false, true, 2) }),
    C(22, 'The square socket was replaced. Current check: square fails and round works. Close both clips before connecting below round. Then TEST.', 'round', { steps: clipsFirst('round') }),
    maintenance('right', 'left', 22),
  ], { relay: relay('The right relay was replaced. It still fails in the current check. The left relay works. Tag the right relay, leave it off, turn on left, then TEST.', ['Tag left and turn on right because right was repaired.', 'Tag right; leave right off; turn on working left; TEST.', 'Turn on both relays and TEST.'], 1) }),
  build(23, 'אותו רישום, בדיקה חדשה', 'past passive does not determine current repair outcome', [
    V(23, 'The large valve was replaced. Current check: both valves work. Open the large valve before closing the small one. Close the large valve again last.', [['large-open'], ['small-close'], ['large-close']]),
    C(23, 'The round socket was replaced yesterday. Current check: both sockets work. Today, connect below square before closing clip B and then clip A. TEST last.', 'square', { steps: [['connect-square'], ['clip-b'], ['clip-a'], ['test']] }),
    maintenance('left', 'left', 23),
  ], { relay: relay('The left relay was replaced. Current check: left works, right fails. Tag left, turn on only left, then TEST. Leave right off.', ['Tag left; use working left; TEST; keep right off.', 'Tag right; use left; TEST.', 'The replaced relay must still fail, so use right.'], 0) }),
  build(24, 'כלל קבוע: פתוח וסגור', 'repeat a zero-conditional calibration', [
    V(24, 'Fixed rule: If the small valve is open, the gauge reads three. If it is closed, the gauge reads one. Keep the large valve closed. Calibration targets: three, one, three. TEST after each setting.', [['small-open'], ['test'], ['small-close'], ['test'], ['small-open'], ['test']], { initial: initV(false, false), pressureRule: { '00': 1, '01': 1, '10': 3, '11': 3 }, effect: { test: { signal: 'calibration tested' } }, help: 'זהו חוק שחוזר בכל פעם: קטן פתוח → 3; קטן סגור → 1. מתאימים את שלוש הקריאות ובודקים בכל פעם.', feedback: 'המשפט מתאר כלל קבוע, לא תחזית חד־פעמית. התאימו את מצב הברז ליעדי הכיול: 3, 1, 3.' }),
    C(24, 'Connect below square, close both clips, then TEST. Do not use round.', 'square'),
    S(24, 'Start the fan before turning on the right lever. Then TEST. Keep left off.', [['fan-on'], ['right-on'], ['test']]),
  ]),
  build(25, 'כיוונון חדש', 'reversed zero-conditional effect', [
    V(25, 'Fixed rule: If the large valve is open, the gauge reads two. If it is closed, the gauge reads four. Keep the small valve closed. Calibration targets: two, four, two. TEST after each setting.', [['large-open'], ['test'], ['large-close'], ['test'], ['large-open'], ['test']], { initial: initV(false, false, 4), pressureRule: { '00': 4, '01': 2, '10': 4, '11': 2 }, effect: { test: { signal: 'calibration tested' } }, help: 'במכונה הזאת פתיחת הגדול דווקא מורידה ל־2. אל תעתיקו את החוק הקודם.', feedback: 'החוק השתנה: גדול פתוח → 2; גדול סגור → 4. קראו איזו פעולה גורמת לאיזו קריאה.' }),
    C(25, 'Close clip A, then clip B. Connect below round after both are closed. TEST last.', 'round', { steps: [['clip-a'], ['clip-b'], ['connect-round'], ['test']] }),
    S(25, 'The fan is on now. Turn it off, turn on only the left lever, then TEST.', [['fan-off'], ['left-on'], ['test']], { initial: initS({ fan: true, pressure: 2 }) }),
  ], { relay: relay('A fixed rule: large open gives two; large closed gives four. Keep small closed. Targets are two, four, two, with TEST after each setting.', ['Open small for three; close it for one; TEST.', 'Keep small closed. Set large to open, closed, open; TEST after each setting for 2, 4, 2.', 'Open large and TEST once; all targets are done.'], 1) }),
  build(26, 'כל ארבעת המצבים', 'zero conditional with joint valve conditions', [
    V(26, 'Fixed rules: if both valves are closed, the gauge reads one; if only small is open, it reads two; if only large is open, it reads three; if both are open, it reads four. Targets: two, four, three, one. Change one valve between targets and TEST each setting.', [['small-open'], ['test'], ['large-open'], ['test'], ['small-close'], ['test'], ['large-close'], ['test']], { initial: initV(false, false), pressureRule: { '00': 1, '01': 3, '10': 2, '11': 4 }, effect: { test: { signal: 'calibration tested' } }, help: 'שני הברזים קובעים יחד את הקריאה. רק קטן → 2; שניהם → 4; רק גדול → 3; שניהם סגורים → 1.', feedback: 'אל תשמיטו both או only: כל צירוף של שני הברזים מוביל לקריאה אחרת.' }),
    C(26, 'The cable is already below square. Close clip B before clip A. Then TEST. Do not reconnect it.', 'square', { initial: { connected: 'square', clipA: false, clipB: false, signal: 'idle' }, steps: [['clip-b'], ['clip-a'], ['test']] }),
    S(26, 'Cooling is opened by right, music by left. Open cooling then music; close cooling before TEST.', [['right-on'], ['left-on'], ['right-off'], ['test']], { effect: route('music line', 'cooling line') }),
  ], { sourceModules: [COND, ...PASS, MED9] }),
  build(27, 'הבדיקה הבאה', 'first conditional prediction and fan prevention', [
    V(27, 'Close small before opening large. Do not press RESET.', [['small-close'], ['large-open']]),
    C(27, 'Connect below round, close both clips, then TEST.', 'round'),
    S(27, 'For this startup: If pressure reaches five, the engine will stop. Current pressure: three. The next test adds two without the fan or zero with it. Start the fan before TEST. Leave both relays off.', [['fan-on'], ['test']], { initial: initS({ pressure: 3 }), startup: { deltaWithoutFan: 2, deltaWithFan: 0, stopAt: 5 }, effect: { 'fan-on': { fan: true, pressure: 3 } }, feedback: 'זוהי תחזית לבדיקה הבאה: בלי מאוורר 3+2=5. הפעלת המאוורר לפני TEST מונעת את הסף.' }),
  ], { prediction: { prompt: 'Pressure is 3. The next test adds 2 without the fan. If pressure reaches 5, the engine will stop. What will happen if you TEST now, with the fan off?', options: ['The engine will stop at 5.', 'Pressure will stay at 3.', 'The maintenance record proves the fan works.'], correct: 0 } }),
  build(28, 'סבב בדיקה נוסף', 'reversed first-conditional startup plan', [
    V(28, 'Open large before closing small. Then close large again.', [['large-open'], ['small-close'], ['large-close']]),
    C(28, 'Close both clips before connecting below square. Then TEST.', 'square', { steps: clipsFirst('square') }),
    S(28, 'For this startup: If pressure reaches five, the engine will stop. Pressure is four and the fan is on. The next test adds one with the fan or zero without it. Stop the fan before TEST. Do not turn on either relay.', [['fan-off'], ['test']], { initial: initS({ fan: true, pressure: 4 }), startup: { deltaWithoutFan: 0, deltaWithFan: 1, stopAt: 5 }, effect: { 'fan-off': { fan: false, pressure: 4 } }, feedback: 'התנאי אינו אומר שתמיד צריך מאוורר. הפעם המאוורר מוסיף 1: 4+1=5. מכבים אותו לפני TEST.' }),
  ], { prediction: { prompt: 'Pressure is 4; the fan is on. The next test adds 1 with the fan and 0 without it. If pressure reaches 5, the engine will stop. What will happen if you TEST without changing anything?', options: ['The engine will run at 4 because fans always help.', 'The engine will stop at 5.', 'Both relays will be repaired.'], correct: 1 }, relay: relay('For this startup, pressure reaching five will stop the engine. Stop the fan before TEST. Leave both relays off.', ['Start the fan, then TEST; keep relays off.', 'TEST first, then stop the fan.', 'Stop fan before TEST; leave both relays off; at five the engine will stop.'], 2) }),
  build(29, 'סף חדש להתנעה', 'varied first-conditional threshold + preserved relay', [
    V(29, 'Both valves are open. Close large before small. Reopen only small last.', [['large-close'], ['small-close'], ['small-open']], { initial: initV(true, true, 4) }),
    C(29, 'Clip B is closed now. Connect below round, close A, then TEST. Do not move B.', 'round', { initial: { connected: 'none', clipA: false, clipB: true, signal: 'idle' }, steps: [['connect-round'], ['clip-a'], ['test']] }),
    S(29, 'For this startup: If pressure reaches six, the engine will stop. Current pressure: three. TEST adds three without the fan or one with it. Start the fan before TEST. Keep both relays off.', [['fan-on'], ['test']], { initial: initS({ pressure: 3 }), startup: { deltaWithoutFan: 3, deltaWithFan: 1, stopAt: 6 }, effect: { 'fan-on': { fan: true, pressure: 3 } }, feedback: 'הסף הוא עכשיו 6. בלי מאוורר 3+3=6; עם מאוורר 3+1=4. התחזית והתוכנית צריכות להתאים לנתונים החדשים.' }),
  ], { prediction: { prompt: 'Pressure is 3; fan off. TEST adds 3 without the fan or 1 with it. If pressure reaches 6, the engine will stop. What will happen if you TEST now?', options: ['It will stay at 3.', 'It will safely reach 4 with the fan still off.', 'It will stop at 6.'], correct: 2 }, relay: relay('If pressure reaches six this startup, the engine will stop. Start the fan before TEST; leave both relays off. The parade lights are green.', ['At six it will stop. Start fan before TEST and leave both relays off.', 'At five it will stop. TEST before starting fan.', 'Start the fan and both relays, then TEST.'], 0) }),
  build(30, 'מנוע הפסטיבל — מסירה מלאה', 'mixed capstone: record + current check + zero rule + startup prediction + relay', [
    V(30, 'Fixed rule: small open gives three; small closed gives one. Keep large closed. Calibration targets: three, one, three. TEST each setting. Do not press RESET.', [['small-open'], ['test'], ['small-close'], ['test'], ['small-open'], ['test']], { initial: initV(false, false), pressureRule: { '00': 1, '01': 1, '10': 3, '11': 3 }, effect: { test: { signal: 'calibration tested' } }, feedback: 'בחוק הכיול הקבוע קטן פתוח מוביל ל־3 וסגור ל־1; שומרים גדול סגור ובודקים כל יעד בנפרד.' }),
    C(30, 'The round socket was replaced yesterday. Current check: round fails; square works. Close clip B before A. Then connect below square and TEST. Do not use round.', 'square', { steps: [['clip-b'], ['clip-a'], ['connect-square'], ['test']] }),
    S(30, 'Record: the right relay was replaced. Tag that relay. Current check: right still fails; left works. Turn on only left. For this startup, if pressure reaches six, the engine will stop. Pressure is three; the fan is on. TEST adds three with the fan or one without it. Stop the fan before TEST. Keep right off.', [['tag-right'], ['left-on'], ['fan-off'], ['test']], { initial: initS({ fan: true, pressure: 3, maintenanceTag: 'none', tagLeft: true, tagRight: true }), startup: { deltaWithoutFan: 1, deltaWithFan: 3, stopAt: 6 }, effect: { 'tag-left': { maintenanceTag: 'left' }, 'tag-right': { maintenanceTag: 'right' }, 'left-on': { left: true, receiver: 'working relay' }, 'fan-off': { fan: false, pressure: 3 } }, feedback: 'שומרים את כל חלקי המקור: ימין הוחלף אך עדיין נכשל, שמאל עובד; המאוורר הנוכחי יוביל ל־6, ולכן מכבים לפני TEST. רישום העבר אינו תחליף לבדיקה העכשווית.' }),
  ], { stage: 'transfer', sourceModules: [PAST, COND, MED9, 'reading-functional-texts'], prediction: { prompt: 'Before you act: pressure is 3 and fan is on. TEST adds 3 with the fan, 1 without. If pressure reaches 6, the engine will stop. What will happen if you TEST now?', options: ['It will stop at 6; switching the fan off first would instead give 4.', 'It will run at 4 because the fan is currently on.', 'The replaced right relay proves the startup is safe.'], correct: 0 }, relay: relay('The right relay was replaced, but currently right fails and left works. Tag right and leave it off. Turn on only left. If pressure reaches six, the engine will stop. Stop the fan before TEST.', ['Tag right; use left; TEST first and then stop fan.', 'Tag right and leave it off; turn on only working left; stop fan before TEST. At six the engine will stop.', 'Tag left because it works; start both relays and fan before TEST.'], 1) }),
];

/** Authoring guard, not a learner mastery test. */
if (CAMPAIGN.length !== 30 || CAMPAIGN.some((level, i) => level.level !== i + 1)) {
  throw new Error('Manual Mayhem campaign must contain exactly 30 ordered levels.');
}
