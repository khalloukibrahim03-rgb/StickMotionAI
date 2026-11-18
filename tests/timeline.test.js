import test from "node:test";
import assert from "node:assert/strict";
import { parseScript } from "../src/story-director.js";
import {
  buildTimeline, updateScene, setAllDurations,
  getTimelineDuration, getSceneAtTime
} from "../src/timeline.js";

test("builds editable scenes with inferred defaults", () => {
  const scenes = buildTimeline(parseScript("Scene 1: He walks into the tunnel\nالمشهد 2: يبدأ بالركض\nScene 3: blackout"));
  assert.equal(scenes[0].motion, "walk");
  assert.equal(scenes[1].motion, "run");
  assert.equal(scenes[1].camera, "tracking");
  assert.equal(scenes[2].lighting, "blackout");
  assert.equal(scenes[0].duration, 6);
});

test("updates only the selected scene and validates controls", () => {
  const scenes = buildTimeline(parseScript("One\nTwo"));
  const updated = updateScene(scenes, 2, { duration: 9, motion: "run", camera: "tracking", lighting: "warm", subtitle: "مرحبا" });
  assert.equal(updated[0].duration, 6);
  assert.deepEqual(
    { duration: updated[1].duration, motion: updated[1].motion, camera: updated[1].camera, lighting: updated[1].lighting, subtitle: updated[1].subtitle },
    { duration: 9, motion: "run", camera: "tracking", lighting: "warm", subtitle: "مرحبا" }
  );
  assert.equal(updateScene(scenes, 1, { motion: "invalid" })[0].motion, "idle");
});

test("calculates total runtime and resolves the scene at a timeline position", () => {
  let scenes = buildTimeline(parseScript("One\nTwo\nThree"));
  scenes = updateScene(scenes, 1, { duration: 4 });
  scenes = updateScene(scenes, 2, { duration: 8 });
  assert.equal(getTimelineDuration(scenes), 18);
  assert.equal(getSceneAtTime(scenes, 5).scene.id, 2);
  assert.equal(getSceneAtTime(scenes, 5).localTime, 1);
  assert.equal(getSceneAtTime(scenes, 17).scene.id, 3);
});

test("changes all durations without mutating the input", () => {
  const scenes = buildTimeline(parseScript("One\nTwo"));
  const changed = setAllDurations(scenes, 10);
  assert.equal(scenes[0].duration, 6);
  assert.equal(changed[0].duration, 10);
  assert.equal(getTimelineDuration(changed), 20);
});
