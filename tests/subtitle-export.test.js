import test from "node:test";
import assert from "node:assert/strict";
import { buildSrt } from "../src/subtitle-export.js";

test("builds sequential SRT cues using scene durations", () => {
  const srt = buildSrt([
    { duration: 4, subtitle: "Hello" },
    { duration: 6, subtitle: "مرحبا" }
  ]);
  assert.match(srt, /00:00:00,000 --> 00:00:04,000/);
  assert.match(srt, /00:00:04,000 --> 00:00:10,000/);
  assert.ok(srt.includes("مرحبا"));
});

test("skips empty subtitles without breaking timeline offsets", () => {
  const srt = buildSrt([
    { duration: 3, subtitle: "" },
    { duration: 5, subtitle: "Second scene" }
  ]);
  assert.ok(srt.startsWith("1\n00:00:03,000 --> 00:00:08,000"));
});

test("clamps scene durations and returns empty output for no subtitles", () => {
  assert.equal(buildSrt([{ duration: 99, subtitle: "Long" }]).includes("00:00:12,000"), true);
  assert.equal(buildSrt([{ subtitle: "  " }]), "");
});
