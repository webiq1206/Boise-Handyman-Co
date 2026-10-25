/**
 * Lock the Handyman wordmark so "Co." (C, o, and the period) is painted with
 * the same terracotta as the family "5", and "BOISE HANDYMAN" stays bone or
 * charcoal. The generator calls this before it writes accent lockups. A rebuild
 * that drops the Co. group, or paints Co. with the letter ink, throws.
 */

export const HANDYMAN_ACCENT = "#CB633B";
export const BONE = "#F7F5F3";
export const CHARCOAL = "#2C302F";

/** Fills that must never be the Co. mark on an accent lockup. */
export const FORBIDDEN_CO_FILLS = [
  BONE,
  CHARCOAL,
  "#FFFFFF",
  "#FBFAF6",
  "#8FAEC4",
  "#000000",
  "#E48F6D",
];

const CO_MARK_START = "M54.179";

function upper(color) {
  return String(color || "").toUpperCase();
}

function pathAttrs(tag) {
  const fill = /fill="(#[0-9A-Fa-f]{6})"/i.exec(tag);
  const d = /\bd="([^"]*)"/.exec(tag);
  return { fill: fill ? upper(fill[1]) : null, d: d ? d[1] : "" };
}

/**
 * Split a wordmark into the letter paths (outside the Co. group) and the Co.
 * paths (inside the translated italic group).
 */
export function readWordmark(svg) {
  const groups = [...svg.matchAll(/<g\b([^>]*)>([\s\S]*?)<\/g>/g)];
  const co = [];
  for (const group of groups) {
    const translate = /translate\(\s*(-?\d+(?:\.\d+)?)/.exec(group[1]);
    const tx = translate ? Number(translate[1]) : 0;
    for (const path of group[2].matchAll(/<path\b[^>]*>/g)) {
      co.push({ ...pathAttrs(path[0]), tx });
    }
  }
  const outside = svg.replace(/<g\b[\s\S]*?<\/g>/g, "");
  const letters = [...outside.matchAll(/<path\b[^>]*>/g)].map((path) => pathAttrs(path[0]));
  return { letters, co };
}

function minXOfPath(d) {
  const tokens = d.match(/[MLQCZ]|-?\d+(?:\.\d+)?/g);
  if (!tokens) throw new Error("wordmark letter path has no coordinates");
  let i = 0;
  let min = Infinity;
  let cmd = "";
  const take = () => {
    const value = Number(tokens[i]);
    i += 1;
    return value;
  };
  while (i < tokens.length) {
    if (/[MLQCZ]/.test(tokens[i])) {
      cmd = tokens[i];
      i += 1;
      if (cmd === "Z") continue;
    }
    if (cmd === "M" || cmd === "L") {
      min = Math.min(min, take());
      take();
    } else if (cmd === "Q") {
      min = Math.min(min, take());
      take();
      min = Math.min(min, take());
      take();
    } else if (cmd === "C") {
      min = Math.min(min, take());
      take();
      min = Math.min(min, take());
      take();
      min = Math.min(min, take());
      take();
    } else {
      throw new Error(`unsupported wordmark path command ${cmd || tokens[i]}`);
    }
  }
  if (!Number.isFinite(min)) throw new Error("wordmark letter path has no x");
  return min;
}

/**
 * Paint the translated Co. group with the accent and every other filled path
 * with the letter ink. Refuses to continue when Co. is not its own group,
 * because that is how a rebuild puts Co. back on bone.
 */
export function forceAccentWordmark(svg, { letters, accent = HANDYMAN_ACCENT }) {
  if (!/<g\b[^>]*transform="translate\(/.test(svg)) {
    throw new Error("Co. glyph group is missing. Refusing to paint Co. with the letter color.");
  }
  const outside = svg.replace(/<g\b[\s\S]*?<\/g>/g, "");
  if (outside.includes(CO_MARK_START)) {
    throw new Error("Co. outlines are inside the letter path. Move C, o, and the period into the accent group.");
  }
  const letterFill = upper(letters);
  const accentFill = upper(accent);
  if (letterFill === accentFill) {
    throw new Error("accent wordmark letters and Co. must not share one fill");
  }
  let coSeen = false;
  const locked = svg.replace(/<g\b[^>]*transform="translate\([\s\S]*?<\/g>/g, (group) => {
    coSeen = true;
    if (!group.includes(CO_MARK_START)) {
      throw new Error("translated group is not the Co. mark");
    }
    return group.replace(/fill="#[0-9A-Fa-f]{6}"/gi, `fill="${accentFill}"`);
  });
  if (!coSeen) throw new Error("Co. glyph group is missing");
  const withLetters = locked.replace(/<path\b[^>]*>/g, (tag) => {
    if (tag.includes(CO_MARK_START)) return tag;
    return tag.replace(/fill="#[0-9A-Fa-f]{6}"/gi, `fill="${letterFill}"`);
  });
  assertAccentWordmark(withLetters, { letters: letterFill, accent: accentFill });
  return withLetters;
}

export function assertAccentWordmark(svg, { letters, accent = HANDYMAN_ACCENT } = {}) {
  const accentFill = upper(accent);
  const letterFill = letters ? upper(letters) : null;
  const { letters: letterPaths, co } = readWordmark(svg);
  if (co.length !== 1) {
    throw new Error(`accent wordmark needs one Co. path, found ${co.length}`);
  }
  if (co[0].fill !== accentFill) {
    throw new Error(`Co. fill ${co[0].fill} is not the family accent ${accentFill}`);
  }
  if (FORBIDDEN_CO_FILLS.includes(co[0].fill)) {
    throw new Error(`Co. fill ${co[0].fill} is not allowed on an accent lockup`);
  }
  if (!co[0].d.includes(CO_MARK_START) || !co[0].d.includes("M89.849") || !co[0].d.includes("M111.899")) {
    throw new Error("Co. path is missing the C, o, or period outline");
  }
  if (letterPaths.length < 1) throw new Error("wordmark is missing the BOISE HANDYMAN letter path");
  for (const path of letterPaths) {
    if (path.fill === accentFill) {
      throw new Error("BOISE HANDYMAN letters must not be solid accent");
    }
    if (letterFill && path.fill !== letterFill) {
      throw new Error(`letter fill ${path.fill} is not ${letterFill}`);
    }
  }
  const fills = new Set([...letterPaths.map((path) => path.fill), co[0].fill]);
  if (fills.size < 2) throw new Error("accent wordmark collapsed to one fill");
  return { letters: letterPaths.map((path) => path.fill), co: co[0].fill };
}

/** Trim the left side bearing so the B starts on the image edge. */
export function cropWordmarkToInk(svg) {
  const { letters } = readWordmark(svg);
  const d = letters.map((path) => path.d).join(" ");
  const minX = minXOfPath(d);
  const view = /viewBox="([^"]+)"/.exec(svg);
  const widthAttr = /\bwidth="([^"]+)"/.exec(svg);
  if (!view || !widthAttr) throw new Error("wordmark is missing viewBox or width");
  const [x, y, w, h] = view[1].split(/\s+/).map(Number);
  const nextX = Number(minX.toFixed(3));
  const right = x + w;
  const nextW = Number((right - nextX).toFixed(3));
  if (!(nextW > 0)) throw new Error("cropped wordmark width is not positive");
  return svg
    .replace(/viewBox="[^"]+"/, `viewBox="${nextX} ${y} ${nextW} ${h}"`)
    .replace(/\bwidth="[^"]+"/, `width="${nextW}"`);
}

export function prepareHeaderWordmark(svg, { letters, accent = HANDYMAN_ACCENT }) {
  const locked = forceAccentWordmark(svg, { letters, accent });
  const cropped = cropWordmarkToInk(locked);
  const note = "<!-- Co. fill matches the family 5: terracotta #CB633B. Letters stay bone or charcoal. -->";
  const withNote = cropped.includes(note) ? cropped : cropped.replace(/(<svg\b[^>]*>)/, `$1${note}`);
  assertAccentWordmark(withNote, { letters, accent });
  return withNote;
}

export function assertFamilyFive(svg, accent = HANDYMAN_ACCENT) {
  const accentFill = upper(accent);
  const strokes = [...svg.matchAll(/\bstroke="(#[0-9A-Fa-f]{6})"/gi)].map((match) => upper(match[1]));
  const accentStrokes = strokes.filter((stroke) => stroke === accentFill);
  if (accentStrokes.length !== 1) {
    throw new Error(`family 5 must be the only ${accentFill} stroke, found ${accentStrokes.length}`);
  }
  if (svg.includes("#8FAEC4")) throw new Error("family mark still uses steel blue");
}
