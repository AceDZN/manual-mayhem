export const LEVEL_COUNT = 30;
export const CAMPAIGN_SAVE_KEY = "mm-campaign-v1";
export interface LevelResult {
  strikes: number;
  assisted: boolean;
  retries: number;
}
export interface CampaignProgress {
  version: 1;
  currentLevel: number;
  /** Explicit lesson entry; opens levels without inventing completions. */
  entryLevel?: number;
  highestUnlocked: number;
  completed: Record<number, LevelResult>;
}
const levelNumber = (n: unknown) =>
  typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= LEVEL_COUNT;
export function readProgress(raw: unknown): CampaignProgress {
  const p = raw as Partial<CampaignProgress> | null;
  const completed: Record<number, LevelResult> = {};
  if (p?.version === 1 && p.completed && typeof p.completed === "object") {
    for (let n = 1; n <= LEVEL_COUNT; n++) {
      const result = p.completed[n];
      // Preserve earned lesson replays, including completions above a campaign gap.
      if (!result || !Number.isFinite(result.strikes) ||
          !Number.isFinite(result.retries) || typeof result.assisted !== "boolean") continue;
      completed[n] = {
        strikes: Math.max(0, Math.floor(result.strikes)),
        retries: Math.max(0, Math.floor(result.retries)),
        assisted: result.assisted,
      };
    }
  }
  const entryLevel = p?.version === 1 && levelNumber(p.entryLevel) ? p.entryLevel! : 1;
  let highestUnlocked = entryLevel;
  while (highestUnlocked < LEVEL_COUNT && completed[highestUnlocked]) highestUnlocked++;
  const currentLevel = levelNumber(p?.currentLevel) && p!.currentLevel! <= highestUnlocked
    ? p!.currentLevel! : highestUnlocked;
  return { version: 1, currentLevel, highestUnlocked, completed, ...(entryLevel > 1 ? { entryLevel } : {}) };
}
/** The Workbook lesson URL is the explicit permission to enter a later level. */
export function enterLessonLevel(p: CampaignProgress, level: number): CampaignProgress {
  if (!levelNumber(level)) return p;
  return readProgress({ ...p, entryLevel: Math.max(p.entryLevel || 1, level), currentLevel: level });
}
export function selectLevel(p: CampaignProgress, level: number): CampaignProgress {
  return levelNumber(level) && level <= p.highestUnlocked
    ? { ...p, currentLevel: level } : p;
}
export function completeLevel(p: CampaignProgress, level: number, result: LevelResult): CampaignProgress {
  if (!levelNumber(level) || level > p.highestUnlocked) return p;
  const previous = p.completed[level];
  const score = (r: LevelResult) => r.strikes * 1000 + r.retries * 10 + Number(r.assisted);
  const completed = { ...p.completed,
    [level]: !previous || score(result) < score(previous) ? { ...result } : previous };
  return readProgress({ version: 1, entryLevel: p.entryLevel, completed, currentLevel: Math.min(LEVEL_COUNT, level + 1) });
}
