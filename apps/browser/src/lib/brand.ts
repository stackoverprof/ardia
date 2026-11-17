// (fork) Bro is a fork of Ardia. Upstream's interface text says "Ardia" in hundreds of places; rewriting each would
// clash with every merge, so the name is swapped here, where text is shown. Credit and licence lines are left as
// written: they name Ardia and its author on purpose.
const CREDIT = /fork of Ardia|free software|Mantra Patel|General Public License/;

// The app's own name: "Bro", or "Bro for Claude" in the agents' build (platform/app.ts sets it from the bundle).
let appName = "Bro";
export function setBrandName(name: string | undefined) {
  if (name && name !== "Ardia") appName = name;
}

export function brand<T>(text: T): T {
  if (typeof text !== "string" || !text.includes("Ardia") || CREDIT.test(text)) return text;
  return text.replace(/\bArdia\b/g, appName) as T;
}

export function brandDeep<T>(value: T): T {
  if (typeof value === "string") return brand(value);
  if (Array.isArray(value)) return value.map(brandDeep) as T;
  // plain data only: a React element (an object with $$typeof) is passed through untouched
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype && !("$$typeof" in value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, brandDeep(v)])) as T;
  }
  return value;
}
