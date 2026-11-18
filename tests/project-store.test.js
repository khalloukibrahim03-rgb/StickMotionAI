import test from "node:test";
import assert from "node:assert/strict";
import { serializeProject, deserializeProject } from "../src/project-store.js";

test("round-trips script and scene editor settings", () => {
  const source = {
    script: "Scene 1: A tunnel\nالمشهد 2: يركض",
    defaultDuration: 7,
    scenes: [
      { id: 1, duration: 4, motion: "walk", camera: "wide", lighting: "warm", subtitle: "النفق" },
      { id: 2, duration: 9, motion: "run", camera: "tracking", lighting: "blackout", subtitle: "اركض" }
    ]
  };
  assert.deepEqual(deserializeProject(serializeProject(source)), {
    version: 1,
    ...source
  });
});

test("rejects corrupt, unsupported, and oversized projects", () => {
  assert.equal(deserializeProject("{broken"), null);
  assert.equal(deserializeProject(JSON.stringify({ version: 2, script: "", scenes: [] })), null);
  assert.equal(deserializeProject(JSON.stringify({ version: 1, script: "x", scenes: Array(21).fill({ id: 1 }) })), null);
});

test("sanitizes unknown editor settings and clamps durations", () => {
  const loaded = deserializeProject(serializeProject({
    script: "One",
    defaultDuration: 90,
    scenes: [{ id: 1, duration: 1, motion: "fly", camera: "orbit", lighting: "neon", subtitle: "ok" }]
  }));
  assert.equal(loaded.defaultDuration, 12);
  assert.equal(loaded.scenes[0].duration, 3);
  assert.equal(loaded.scenes[0].motion, "idle");
  assert.equal(loaded.scenes[0].camera, "wide");
  assert.equal(loaded.scenes[0].lighting, "cinematic");
});
