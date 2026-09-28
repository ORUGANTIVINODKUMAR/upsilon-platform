import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITY_STORAGE_KEY,
  IDLE_LOGOUT_MS,
  IDLE_WARNING_MS,
  LOGOUT_STORAGE_KEY,
  announceSignOut,
  getIdleState,
  readSharedActivity,
  writeSharedActivity,
} from "../src/context/sessionActivity.js";

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
  };
};

test("idle state moves from active to warning to expired", () => {
  const start = 1_000_000;
  assert.equal(getIdleState(start, start + IDLE_WARNING_MS - 1), "active");
  assert.equal(getIdleState(start, start + IDLE_WARNING_MS), "warning");
  assert.equal(getIdleState(start, start + IDLE_LOGOUT_MS), "expired");
});

test("activity in another tab keeps this tab signed in", () => {
  const storage = memoryStorage();
  const thisTabLastActive = 0;
  const now = IDLE_LOGOUT_MS + 60_000;
  writeSharedActivity(now - 30_000, storage);
  const lastActivity = Math.max(thisTabLastActive, readSharedActivity(storage));
  assert.equal(getIdleState(lastActivity, now), "active");
});

test("shared activity and sign-out use their own storage keys", () => {
  const storage = memoryStorage();
  writeSharedActivity(42, storage);
  announceSignOut(storage);
  assert.equal(storage.getItem(ACTIVITY_STORAGE_KEY), "42");
  assert.ok(Number(storage.getItem(LOGOUT_STORAGE_KEY)) > 0);
});

test("unavailable storage never throws", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(readSharedActivity(broken), 0);
  assert.doesNotThrow(() => writeSharedActivity(1, broken));
  assert.doesNotThrow(() => announceSignOut(broken));
});
