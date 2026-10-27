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
      // Only a consecutive completed run can unlock the next level.
      if (!result || !Number.isFinite(result.strikes) ||
          !Number.isFinite(result.retries) || typeof result.assisted !== "boolean") break;
      completed[n] = {
        strikes: Math.max(0, Math.floor(result.strikes)),
        retries: Math.max(0, Math.floor(result.retries)),
        assisted: result.assisted,
      };
    }
  }
  const highestUnlocked = Math.min(LEVEL_COUNT, Object.keys(completed).length + 1);
  const currentLevel = levelNumber(p?.currentLevel) && p!.currentLevel! <= highestUnlocked
    ? p!.currentLevel! : highestUnlocked;
  return { version: 1, currentLevel, highestUnlocked, completed };
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
  return readProgress({ version: 1, completed, currentLevel: Math.min(LEVEL_COUNT, level + 1) });
}
