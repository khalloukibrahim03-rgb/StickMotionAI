export function getTextDirection(value, fallback = "rtl") {
  const text = String(value ?? "");
  for (const character of text) {
    if (/\p{Script=Arabic}/u.test(character)) return "rtl";
    if (/\p{L}/u.test(character)) return "ltr";
  }
  return fallback === "ltr" ? "ltr" : "rtl";
}
