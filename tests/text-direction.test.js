import test from "node:test";
import assert from "node:assert/strict";
import { getTextDirection } from "../src/text-direction.js";

test("detects right-to-left Arabic subtitles", () => {
  assert.equal(getTextDirection("مرحبا بالعالم"), "rtl");
});

test("detects left-to-right English subtitles", () => {
  assert.equal(getTextDirection("Science and discovery"), "ltr");
});

test("uses the first strong character for mixed-language subtitles", () => {
  assert.equal(getTextDirection("مرحبا Science"), "rtl");
  assert.equal(getTextDirection("Science مرحبا"), "ltr");
});

test("uses a safe RTL fallback for punctuation and numbers", () => {
  assert.equal(getTextDirection("2026 — !!!"), "rtl");
  assert.equal(getTextDirection("2026 — !!!", "ltr"), "ltr");
});
