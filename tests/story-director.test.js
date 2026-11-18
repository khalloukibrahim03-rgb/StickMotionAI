import test from "node:test";
import assert from "node:assert/strict";
import { parseScript, normalizeDuration } from "../src/story-director.js";

test("parses numbered English and Arabic scene lines", () => {
  const scenes = parseScript("Scene 1: A dark tunnel\nالمشهد 2: باب المصعد يفتح\nA final reveal");
  assert.deepEqual(scenes, [
    { id: 1, text: "A dark tunnel" },
    { id: 2, text: "باب المصعد يفتح" },
    { id: 3, text: "A final reveal" }
  ]);
});

test("ignores blank lines and caps the scene count", () => {
  const scenes = parseScript("One\n\nTwo\nThree", 2);
  assert.deepEqual(scenes, [{ id: 1, text: "One" }, { id: 2, text: "Two" }]);
});

test("returns no scenes for empty input", () => {
  assert.deepEqual(parseScript(" \n "), []);
});

test("clamps scene duration to supported limits", () => {
  assert.equal(normalizeDuration(1), 3);
  assert.equal(normalizeDuration(8), 8);
  assert.equal(normalizeDuration(99), 12);
  assert.equal(normalizeDuration("not-a-number"), 6);
});
