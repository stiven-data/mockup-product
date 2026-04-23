import { readFile, writeFile } from "node:fs/promises";

import { annotateHtmlMetrics, injectMetricsRuntime, moduleFromPath } from "./data-driven-core.mjs";

const HTML_FILES = [
  "modules/taxes/views/index.html",
  "modules/insurance/views/insurance_command_center_oasis_trusted.html",
  "modules/Gp/views/gp mockups.html",
];

const RUNTIME_PATH = "../../../assets/js/supabase-data.js";

for (const sourceFile of HTML_FILES) {
  const html = await readFile(sourceFile, "utf8");
  const alreadyAnnotated = html.includes("data-metric-key=");
  const baseHtml = alreadyAnnotated
    ? html
    : annotateHtmlMetrics(html, {
        module: moduleFromPath(sourceFile),
        sourceFile,
      }).html;
  const finalHtml = injectMetricsRuntime(baseHtml, RUNTIME_PATH);
  await writeFile(sourceFile, finalHtml, "utf8");
  console.log(
    alreadyAnnotated
      ? `Injected runtime into already annotated file: ${sourceFile}`
      : `Annotated and injected runtime for ${sourceFile}`,
  );
}
