import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const base = JSON.parse(readFileSync("src/assets/maps/Map001.json", "utf8"));
const map079 = JSON.parse(readFileSync("src/assets/maps/Map079.json", "utf8"));
const make = (size, auto) => ({
  ...base,
  width: size,
  height: size,
  data: Array.from({ length: 3 }, (_, layer) =>
    Array.from({ length: size * size }, (_, i) =>
      auto
        ? layer === 0
          ? 94
          : 0
        : layer === 0
          ? 384 + (i % 32)
          : i % (layer * 7 + 3) === 0
            ? 393 + layer
            : 0
    )
  ),
});
const fixtures = [
  { label: "sample-50x20", map: base },
  { label: "sample-57x128", map: map079 },
  { label: "autotiles-256", map: make(256, true) },
  { label: "mixed-256", map: make(256, false) },
  { label: "limit-512", map: make(512, false) },
];
mkdirSync("output", { recursive: true });
writeFileSync(
  "output/fixture-performance.pw",
  readFileSync("scripts/fixture-performance.pw", "utf8")
    .replace("/* FIXTURES */ []", JSON.stringify(fixtures))
    .replace(
      '/* PROVINCE */ ""',
      JSON.stringify(resolve("src/assets/tilesets/Province de Vigo.png"))
    )
);
console.log(
  "Prepared output/fixture-performance.pw with real samples and generated stress maps"
);
