import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, selectLevel, completeLevel, enterLessonLevel } from '../src/campaign-progress';
const win = { strikes: 0, assisted: false, retries: 0 };
test('fresh campaign starts at1 and rejects locked or invalid selections', () => {
  const p = readProgress(null);
  assert.deepEqual(p, { version: 1, currentLevel: 1, highestUnlocked: 1, completed: {} });
  for (const n of [0, 2, 30, 31, 1.5, NaN]) assert.equal(selectLevel(p, n), p);
  assert.equal(completeLevel(p, 30, win), p);
});
test('only consecutive genuine completions unlock all30, with no wrap at the end', () => {
  let p = readProgress(null);
  for (let level = 1; level <= 30; level++) {
    assert.equal(p.highestUnlocked, level);
    p = completeLevel(p, level, win);
    assert.equal(p.highestUnlocked, Math.min(30, level + 1));
    assert.equal(p.currentLevel, Math.min(30, level + 1));
    assert.equal(Object.keys(p.completed).length, level);
    p = readProgress(JSON.parse(JSON.stringify(p)));
  }
  assert.equal(p.currentLevel, 30);
  assert.equal(p.highestUnlocked, 30);
});
test('replays keep unlocks and best result; chosen replay survives reload', () => {
  let p = readProgress(null);
  p = completeLevel(p, 1, { strikes: 1, assisted: true, retries: 2 });
  p = completeLevel(p, 2, win);
  p = selectLevel(p, 1);
  assert.equal(readProgress(JSON.parse(JSON.stringify(p))).currentLevel, 1);
  p = completeLevel(p, 1, win);
  assert.equal(p.highestUnlocked, 3);
  assert.deepEqual(p.completed[1], win);
  p = completeLevel(p, 1, { strikes: 2, assisted: true, retries: 4 });
  assert.deepEqual(p.completed[1], win);
});
test('corrupt or obsolete saves cannot unlock gaps or out-of-range levels', () => {
  assert.equal(readProgress({ version: 99, highestUnlocked: 30 }).highestUnlocked, 1);
  assert.equal(readProgress({ version: 1, currentLevel: 30, highestUnlocked: 30, completed: { 30: win } }).highestUnlocked, 1);
  const gap = readProgress({ version: 1, currentLevel: 29, completed: { 1: win, 3: win } });
  assert.equal(gap.highestUnlocked, 2);
  assert.equal(gap.currentLevel, 2);
  assert.deepEqual(Object.keys(gap.completed), ['1', '3']);
});

test('explicit lesson entry opens later content without inventing earlier completion', () => {
  let p = enterLessonLevel(readProgress(null), 24);
  assert.equal(p.currentLevel, 24);
  assert.equal(p.highestUnlocked, 24);
  assert.deepEqual(p.completed, {});
  assert.equal(selectLevel(p, 25), p);
  p = completeLevel(p, 24, win);
  assert.deepEqual(Object.keys(p.completed), ['24']);
  assert.equal(p.highestUnlocked, 25);
  assert.equal(readProgress(JSON.parse(JSON.stringify(p))).currentLevel, 25);
  p = enterLessonLevel(p, 12);
  assert.equal(p.highestUnlocked, 25);
  p = completeLevel(p, 12, win);
  assert.deepEqual(Object.keys(p.completed), ['12', '24']);
});
test('invalid lesson entry cannot change progression', () => {
  const p = readProgress(null);
  for (const n of [0,31,NaN,2.5]) assert.equal(enterLessonLevel(p,n), p);
});
