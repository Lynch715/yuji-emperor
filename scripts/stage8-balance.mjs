import { writeFile } from "node:fs/promises";
import { simulate } from "./simulate.mjs";
export const BALANCE_SEEDS = [
  "御极·两百年",
  "御极·长治",
  "御极·边政",
  "御极·宫闱",
];
if (process.argv[1] === import.meta.filename) {
  const reports = [];
  for (const seed of BALANCE_SEEDS) {
    const r = simulate(200, seed);
    reports.push(r);
    console.log(JSON.stringify(r));
    await writeFile("qa/stage8-balance.json", JSON.stringify(reports, null, 2));
  }
  process.exitCode = reports.every(
    (r) =>
      r.collapseRate <= 35 &&
      r.meanChildren >= 4 &&
      r.meanChildren <= 9 &&
      r.eventsPerDecade.length === 20 &&
      r.eventsPerDecade.every((n) => n >= 30 && n <= 80),
  )
    ? 0
    : 1;
}
