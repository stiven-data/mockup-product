import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const AUDIT_FILE_PATTERN = /^label-audit-.*\.csv$/i;
const NUMBER_WITH_OPTIONAL_GROUPS = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)`;
const VALUE_PATTERN = new RegExp(
  String.raw`\$-?${NUMBER_WITH_OPTIONAL_GROUPS}(?:\.\d+)?|-?\d+(?:\.\d+)?%`,
  "g",
);
const TABLE_SEGMENTS = [
  { ariaLabel: "GP sponsors summary", apply: applyGpSponsorsSummaryTable },
  { ariaLabel: "All partners roster", apply: applyGpPartnersRosterTable },
];

export async function loadLabelOverrides(docsDir = "docs") {
  const auditPath = await findLatestAuditCsv(docsDir);
  if (!auditPath) return new Map();

  const csv = await readFile(auditPath, "utf8");
  const rows = parseCsv(csv);
  const overrides = new Map();

  for (const row of rows) {
    const metricKey = String(row.metric_key || "").trim();
    if (!metricKey) continue;
    if (String(row.confidence_level || "").trim().toLowerCase() !== "high") continue;
    if (String(row.requires_review || "").trim().toLowerCase() === "true") continue;

    const recommendedLabel = normalizeText(row.recommended_label);
    if (!recommendedLabel) continue;

    overrides.set(metricKey, {
      metric_key: metricKey,
      frontend_text_found: normalizeText(row.frontend_text_found),
      frontend_file_path: normalizeText(row.frontend_file_path),
      recommended_label: recommendedLabel,
    });
  }

  return overrides;
}

export function enrichMetricMetadata(metric, overrides = new Map()) {
  const override = overrides.get(metric.metric_key) || null;
  const label = normalizeText(metric.label);
  const existingDisplayLabel = normalizeText(metric.display_label);
  const existingSearchLabel = normalizeText(metric.search_label);
  const sourceContext = normalizeText(metric.source_context);
  const existingUiContext = normalizeText(metric.ui_context);

  const preferredOverrideLabel = selectMoreSpecificLabel(existingDisplayLabel, override?.recommended_label);
  const derivedLabel =
    preferredOverrideLabel ||
    existingSearchLabel ||
    pickHumanLabel(label) ||
    pickHumanLabel(sourceContext) ||
    label ||
    metric.metric_key;

  return {
    ...metric,
    display_label: derivedLabel,
    search_label: derivedLabel,
    ui_context: override?.frontend_text_found || existingUiContext || sourceContext || null,
  };
}

export function applySourceLabelOverrides(metrics, html, sourceFile) {
  const normalizedPath = String(sourceFile || "").replaceAll("\\", "/").toLowerCase();
  let overrides = new Map();

  if (normalizedPath.endsWith("/gp mockups.html")) {
    overrides = mergeOverrides(overrides, buildGpOverrides(metrics, html));
  }

  if (normalizedPath.endsWith("/taxes/views/index.html")) {
    overrides = mergeOverrides(overrides, buildTaxesOverrides());
  }

  if (!overrides.size) return metrics;

  return metrics.map((metric) => {
    const override = overrides.get(metric.metric_key);
    if (!override) return metric;
    return {
      ...metric,
      display_label: override.display_label,
      search_label: override.search_label,
      ui_context: override.ui_context,
    };
  });
}

function pickHumanLabel(value) {
  if (!value) return "";
  if (!/[A-Za-z]/.test(value)) return "";
  return value;
}

async function findLatestAuditCsv(docsDir) {
  let entries;
  try {
    entries = await readdir(docsDir, { withFileTypes: true });
  } catch {
    return null;
  }

  const candidates = entries
    .filter((entry) => entry.isFile() && AUDIT_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  if (!candidates.length) return null;
  return path.join(docsDir, candidates[0]);
}

function normalizeText(value) {
  const text = String(value ?? "").trim();
  return text || "";
}

function selectMoreSpecificLabel(existingLabel, overrideLabel) {
  const existing = pickHumanLabel(existingLabel);
  const override = pickHumanLabel(overrideLabel);

  if (!existing) return override;
  if (!override) return existing;
  if (existing === override) return existing;
  if (existing.length > override.length && existing.includes(override)) return existing;
  return override;
}

function buildGpOverrides(metrics, html) {
  const overrides = new Map();
  let occurrenceIndex = 0;
  let cursor = 0;

  for (const segment of findTableSegments(html)) {
    occurrenceIndex += countValueMatches(html.slice(cursor, segment.start));
    occurrenceIndex = segment.apply(segment.tableHtml, metrics, occurrenceIndex, overrides);
    cursor = segment.end;
  }

  return overrides;
}

function buildTaxesOverrides() {
  return new Map([
    ["taxes_modules_taxes_views_index_008", fixedOverride("2025 Assessed Value Before Appeal")],
    ["taxes_modules_taxes_views_index_009", fixedOverride("2025 Assessed Value After Appeal")],
    ["taxes_modules_taxes_views_index_010", fixedOverride("Owner Benefit After Appeal Fees")],
    ["taxes_modules_taxes_views_index_011", fixedOverride("Early Payment Discount")],
    ["taxes_modules_taxes_views_index_012", fixedOverride("Net Payable After Early Payment Discount")],
    ["taxes_modules_taxes_views_index_055", fixedOverride("2024 | Non-Ad Valorem")],
    ["taxes_modules_taxes_views_index_056", fixedOverride("2024 | Grand Total")],
  ]);
}

function findTableSegments(html) {
  const segments = [];

  for (const definition of TABLE_SEGMENTS) {
    const regex = new RegExp(
      `<table\\b[^>]*aria-label="${escapeRegex(definition.ariaLabel)}"[^>]*>[\\s\\S]*?<\\/table>`,
      "i",
    );
    const match = regex.exec(html);
    if (!match || match.index === undefined) continue;

    segments.push({
      ...definition,
      start: match.index,
      end: match.index + match[0].length,
      tableHtml: match[0],
    });
  }

  return segments.sort((left, right) => left.start - right.start);
}

function applyGpSponsorsSummaryTable(tableHtml, metrics, occurrenceIndex, overrides) {
  const headers = parseTableHeaders(tableHtml);
  const sections = parseTableSections(tableHtml, ["tbody", "tfoot"]);

  for (const section of sections) {
    for (const row of parseRows(section)) {
      const cells = parseCells(row);
      if (cells.length < 2) continue;

      const rowLabel = cells[0];
      for (let index = 1; index < cells.length; index += 1) {
        const cellText = cells[index];
        const matches = [...cellText.matchAll(VALUE_PATTERN)];

        for (const match of matches) {
          occurrenceIndex += 1;
          assignOverride(overrides, metrics[occurrenceIndex - 1], {
            display_label: `${rowLabel} | ${headers[index] || "Value"}`,
            search_label: `${rowLabel} | ${headers[index] || "Value"}`,
            ui_context: `${rowLabel} | ${headers[index] || "Value"}`,
          });
        }
      }
    }
  }

  return occurrenceIndex;
}

function applyGpPartnersRosterTable(tableHtml, metrics, occurrenceIndex, overrides) {
  const headers = parseTableHeaders(tableHtml);
  const sections = parseTableSections(tableHtml, ["tbody", "tfoot"]);

  for (const section of sections) {
    for (const row of parseRows(section)) {
      const cells = parseCells(row);
      if (!cells.length || /GP GROUP:/i.test(cells[0])) continue;

      const isFooter = section.tagName === "tfoot";
      const rowLabel = isFooter ? cells[0] : cells[1];

      for (let index = 0; index < cells.length; index += 1) {
        const cellText = cells[index];
        const matches = [...cellText.matchAll(VALUE_PATTERN)];

        for (const [matchIndex, match] of matches.entries()) {
          occurrenceIndex += 1;
          const label = isFooter
            ? `${rowLabel} | ${headers[index] || "Value"}`
            : buildGpPartnerLabel(rowLabel, headers[index] || "Value", cellText, match[0], matchIndex);

          assignOverride(overrides, metrics[occurrenceIndex - 1], {
            display_label: label,
            search_label: label,
            ui_context: label,
          });
        }
      }
    }
  }

  return occurrenceIndex;
}

function buildGpPartnerLabel(partnerName, header, cellText, matchText, matchIndex) {
  if (header === "Amount Invested") {
    return `${partnerName} | Amount Invested`;
  }

  if (header === "% of Total Raise") {
    if (/mgr entity|manager entity/i.test(cellText)) {
      return `${partnerName} | Manager Entity %`;
    }
    return `${partnerName} | % of Total Raise`;
  }

  if (header === "Notes") {
    const lowerText = cellText.toLowerCase();
    const matches = [...cellText.matchAll(VALUE_PATTERN)].map((match) => match[0]);

    if (lowerText.includes("gp project interest")) {
      const lastMatch = matches[matches.length - 1];
      if (matchText === lastMatch || matchIndex === matches.length - 1) {
        return `${partnerName} | GP Project %`;
      }
    }

    if (lowerText.includes("manager entity")) {
      return `${partnerName} | Manager Entity %`;
    }
  }

  return `${partnerName} | ${header}`;
}

function assignOverride(overrides, metric, override) {
  if (!metric?.metric_key || !override?.display_label) return;
  overrides.set(metric.metric_key, override);
}

function fixedOverride(label) {
  return {
    display_label: label,
    search_label: label,
    ui_context: label,
  };
}

function countValueMatches(html) {
  return [...String(html || "").matchAll(VALUE_PATTERN)].length;
}

function parseTableHeaders(tableHtml) {
  const theadMatch = /<thead\b[^>]*>([\s\S]*?)<\/thead>/i.exec(tableHtml);
  if (!theadMatch) return [];
  const headerRow = /<tr\b[^>]*>([\s\S]*?)<\/tr>/i.exec(theadMatch[1]);
  return headerRow ? parseCells(headerRow[0]) : [];
}

function parseTableSections(tableHtml, tagNames) {
  const regex = new RegExp(`<(${tagNames.join("|")})\\b[^>]*>([\\s\\S]*?)<\\/\\1>`, "gi");
  const sections = [];

  for (const match of tableHtml.matchAll(regex)) {
    sections.push({
      tagName: match[1].toLowerCase(),
      html: match[2],
    });
  }

  return sections;
}

function parseRows(section) {
  return [...section.html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
}

function parseCells(rowHtml) {
  return [...rowHtml.matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => cellText(match[2]));
}

function cellText(html) {
  return normalizeText(
    String(html || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " "),
  );
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergeOverrides(base, next) {
  const merged = new Map(base);
  for (const [key, value] of next) {
    merged.set(key, value);
  }
  return merged;
}

function parseCsv(csv) {
  const rows = [];
  const lines = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headers = parseCsvLine(lines.shift() || "");

  for (const line of lines) {
    if (!line.trim()) continue;
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    rows.push(row);
  }

  return rows;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}
