import test from "node:test";
import assert from "node:assert/strict";
import { getSceneSoundEvents } from "../src/audio-engine.js";

test("adds footsteps for walking and running scenes", () => {
  assert.deepEqual(getSceneSoundEvents({ motion: "walk" }), ["footsteps"]);
  assert.deepEqual(getSceneSoundEvents({ motion: "run" }), ["footsteps"]);
});

test("adds a power-down impact for blackout lighting", () => {
  assert.deepEqual(getSceneSoundEvents({ lighting: "blackout" }), ["power-down-impact"]);
});

test("adds a short whoosh for shock scenes", () => {
  assert.deepEqual(getSceneSoundEvents({ motion: "shock" }), ["shock-whoosh"]);
});

test("does not add music or ambient tracks to ordinary scenes", () => {
  assert.deepEqual(getSceneSoundEvents({ motion: "idle", lighting: "cinematic" }), []);
});
