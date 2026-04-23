import { readFile, writeFile } from "node:fs/promises";

import { annotateHtmlMetrics, moduleFromPath } from "./data-driven-core.mjs";

const HTML_FILES = [
  "modules/taxes/views/index.html",
  "modules/insurance/views/insurance_command_center_oasis_trusted.html",
  "modules/Gp/views/gp mockups.html",
];

for (const sourceFile of HTML_FILES) {
  const html = await readFile(sourceFile, "utf8");
  if (html.includes("data-metric-key=")) {
    console.log(`Skipped already annotated file: ${sourceFile}`);
    continue;
  }

  const { html: annotatedHtml, metrics } = annotateHtmlMetrics(html, {
    module: moduleFromPath(sourceFile),
    sourceFile,
  });
  await writeFile(sourceFile, annotatedHtml, "utf8");
  console.log(`Annotated ${metrics.length} metrics in ${sourceFile}`);
}
