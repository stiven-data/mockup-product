import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractHtmlMetrics, moduleFromPath } from "./data-driven-core.mjs";

const HTML_FILES = [
  "modules/taxes/views/index.html",
  "modules/insurance/views/insurance_command_center_oasis_trusted.html",
  "modules/Gp/views/gp mockups.html",
];

const OUTPUT_DIR = "supabase";
const CSV_OUTPUT = path.join(OUTPUT_DIR, "ingestion_data.csv");
const SQL_OUTPUT = path.join(OUTPUT_DIR, "seed_ingestion_data.sql");

const mortgageMetrics = [
  metric("mortgage", "mortgage_principal_balance", "Principal Balance", 10853176.39, "$10,853,176.39", "currency", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_interest_rate", "Interest Rate", 8.5, "8.50%", "percent", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_escrow_amount", "Escrow Amount", 32719, "$32,719.00 / mo (taxes + insurance impound)", "currency", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_monthly_payment_io_only", "Monthly Payment IO Only", 79439.22, "$79,439.22", "currency", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_monthly_payment_with_escrow", "Monthly Payment With Escrow", 112158.22, "$112,158.22", "currency", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_current_interest_due", "Current Interest Due", 79439.22, "$79,439.22", "currency", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_current_tax_due", "Current Tax Due", 14572.46, "$14,572.46", "currency", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_current_insurance_due", "Current Insurance Due", 18146.54, "$18,146.54", "currency", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_total_due", "Total Due", 112158.22, "$112,158.22", "currency", "modules/mortgage/views/current-debt-data.js"),
  metric("mortgage", "mortgage_ending_escrow_balance", "Ending Escrow Balance", 281922.98, "$281,922.98", "currency", "modules/mortgage/views/current-debt-data.js"),
];

const insuranceTrendMetrics = [
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_010", "Monthly Insurance Trend | Mar-25", 16496.85, "$16,496.85", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Mar-Jul 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_011", "Monthly Insurance Trend | Apr-25", 16496.85, "$16,496.85", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Mar-Jul 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_012", "Monthly Insurance Trend | May-25", 16496.85, "$16,496.85", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Mar-Jul 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_013", "Monthly Insurance Trend | Jun-25", 16496.85, "$16,496.85", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Mar-Jul 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_014", "Monthly Insurance Trend | Jul-25", 16496.85, "$16,496.85", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Mar-Jul 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_015", "Monthly Insurance Trend | Aug-25", 20353.19, "$20,353.19", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Aug-Dec 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_016", "Monthly Insurance Trend | Sep-25", 20353.19, "$20,353.19", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Aug-Dec 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_017", "Monthly Insurance Trend | Oct-25", 20353.19, "$20,353.19", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Aug-Dec 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_018", "Monthly Insurance Trend | Nov-25", 20353.19, "$20,353.19", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Aug-Dec 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_019", "Monthly Insurance Trend | Dec-25", 20353.19, "$20,353.19", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Aug-Dec 2025"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_020", "Monthly Insurance Trend | Jan-26", 8500, "$8,500.00", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Jan-Feb 2026"),
  metric("insurance", "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_021", "Monthly Insurance Trend | Feb-26", 8500, "$8,500.00", "currency", "modules/insurance/views/insurance_command_center_oasis_trusted.html", "Monthly insurance trend | Jan-Feb 2026"),
];

export const GP_MANUAL_METRICS = [
  metric("gp", "gp_total_gp_sponsors", "Total GP Sponsors (PPC)", 6, "6", "number", "modules/Gp/views/gp mockups.html"),
  metric("gp", "gp_k1_partners_in_manager_entity", "K-1 Partners in Manager Entity", 8, "8", "number", "modules/Gp/views/gp mockups.html"),
  metric("gp", "gp_source_k1_year", "Source K-1 Year", 2024, "2024", "number", "modules/Gp/views/gp mockups.html"),
];

export async function buildIngestionMetrics() {
  const htmlMetrics = (
    await Promise.all(
      HTML_FILES.map(async (sourceFile) => {
        const html = await readFile(sourceFile, "utf8");
        return extractHtmlMetrics(html, {
          module: moduleFromPath(sourceFile),
          sourceFile,
        });
      }),
    )
  ).flat();

  return [...htmlMetrics, ...mortgageMetrics, ...GP_MANUAL_METRICS, ...insuranceTrendMetrics];
}

async function main() {
  const metrics = await buildIngestionMetrics();

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(CSV_OUTPUT, toCsv(metrics), "utf8");
  await writeFile(SQL_OUTPUT, toSeedSql(metrics), "utf8");

  console.log(`Wrote ${metrics.length} metrics`);
  console.log(`- ${CSV_OUTPUT}`);
  console.log(`- ${SQL_OUTPUT}`);
}

function metric(module, metric_key, label, value_numeric, value_display, value_type, source_file, source_context = label) {
  return {
    module,
    metric_key,
    label,
    value_numeric,
    value_display,
    value_type,
    currency: value_type === "currency" ? "USD" : null,
    source_file,
    source_context,
  };
}

function toCsv(rows) {
  const columns = [
    "module",
    "metric_key",
    "label",
    "value_numeric",
    "value_display",
    "value_type",
    "currency",
    "source_file",
    "source_context",
  ];
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n");
}

function toSeedSql(rows) {
  const values = rows
    .map((row) => {
      const values = [
        row.module,
        row.metric_key,
        row.label,
        row.value_numeric,
        row.value_display,
        row.value_type,
        row.currency,
        row.source_file,
        row.source_context,
      ];
      return `  (${values.map(sqlValue).join(", ")})`;
    })
    .join(",\n");

  return `insert into ingestion_data (
  module,
  metric_key,
  label,
  value_numeric,
  value_display,
  value_type,
  currency,
  source_file,
  source_context
)
values
${values}
on conflict (metric_key) do update set
  module = excluded.module,
  label = excluded.label,
  value_numeric = excluded.value_numeric,
  value_display = excluded.value_display,
  value_type = excluded.value_type,
  currency = excluded.currency,
  source_file = excluded.source_file,
  source_context = excluded.source_context,
  updated_at = now();
`;
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function sqlValue(value) {
  if (value === null || value === undefined || value === "") return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
