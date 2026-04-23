const NUMBER_WITH_OPTIONAL_GROUPS = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)`;
const MONEY_OR_PERCENT_PATTERN = new RegExp(
  String.raw`\$-?${NUMBER_WITH_OPTIONAL_GROUPS}(?:\.\d+)?|-?\d+(?:\.\d+)?%`,
  "g",
);
const PROTECTED_BLOCK_PATTERN = /<(script|style)\b[\s\S]*?<\/\1>/gi;
const TAG_OR_TEXT_PATTERN = /(<[^>]+>|[^<]+)/g;

export function parseDisplayValue(valueDisplay) {
  const value = valueDisplay.trim();

  if (value.startsWith("$")) {
    return {
      value_numeric: Number(value.replace(/[$,]/g, "")),
      value_type: "currency",
      currency: "USD",
    };
  }

  if (value.endsWith("%")) {
    return {
      value_numeric: Number(value.slice(0, -1).replace(/,/g, "")),
      value_type: "percent",
      currency: null,
    };
  }

  return {
    value_numeric: Number(value.replace(/,/g, "")),
    value_type: "number",
    currency: null,
  };
}

export function extractHtmlMetrics(html, options) {
  const metrics = [];
  forEachEditableTextSegment(html, (text) => {
    for (const match of text.matchAll(MONEY_OR_PERCENT_PATTERN)) {
      metrics.push(buildMetric(match[0], options, metrics.length + 1, text));
    }
  });
  return metrics;
}

export function annotateHtmlMetrics(html, options) {
  const metrics = [];
  const parts = splitProtectedBlocks(html);
  const annotatedParts = parts.map((part) => {
    if (part.protected) return part.content;

    return part.content.replace(TAG_OR_TEXT_PATTERN, (segment) => {
      if (segment.startsWith("<")) return segment;

      return segment.replace(MONEY_OR_PERCENT_PATTERN, (valueDisplay) => {
        const metric = buildMetric(valueDisplay, options, metrics.length + 1, segment);
        metrics.push(metric);
        return `<span data-metric-key="${metric.metric_key}">${valueDisplay}</span>`;
      });
    });
  });

  return {
    html: annotatedParts.join(""),
    metrics,
  };
}

export function moduleFromPath(sourceFile) {
  const normalized = sourceFile.replaceAll("\\", "/").toLowerCase();
  if (normalized.includes("/mortgage/")) return "mortgage";
  if (normalized.includes("/insurance/")) return "insurance";
  if (normalized.includes("/taxes/")) return "taxes";
  if (normalized.includes("/gp/")) return "gp";
  return "overview";
}

function buildMetric(valueDisplay, options, occurrence, textContext) {
  const { value_numeric, value_type, currency } = parseDisplayValue(valueDisplay);
  const module = options.module || moduleFromPath(options.sourceFile);
  const metric_key = `${module}_${sourceKey(options.sourceFile)}_${String(occurrence).padStart(3, "0")}`;

  return {
    module,
    metric_key,
    label: labelFromContext(textContext, valueDisplay),
    value_numeric,
    value_display: valueDisplay,
    value_type,
    currency,
    source_file: options.sourceFile,
    source_context: compactText(textContext),
  };
}

function forEachEditableTextSegment(html, callback) {
  for (const part of splitProtectedBlocks(html)) {
    if (part.protected) continue;

    for (const match of part.content.matchAll(TAG_OR_TEXT_PATTERN)) {
      const segment = match[0];
      if (!segment.startsWith("<")) callback(segment);
    }
  }
}

function splitProtectedBlocks(html) {
  const parts = [];
  let cursor = 0;

  for (const match of html.matchAll(PROTECTED_BLOCK_PATTERN)) {
    if (match.index > cursor) {
      parts.push({ content: html.slice(cursor, match.index), protected: false });
    }
    parts.push({ content: match[0], protected: true });
    cursor = match.index + match[0].length;
  }

  if (cursor < html.length) {
    parts.push({ content: html.slice(cursor), protected: false });
  }

  return parts;
}

function sourceKey(sourceFile) {
  return sourceFile
    .replaceAll("\\", "/")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function labelFromContext(textContext, valueDisplay) {
  const label = compactText(textContext.replace(valueDisplay, "")).replace(/[:\-–—]+$/g, "").trim();
  return label || valueDisplay;
}

function compactText(value) {
  return value.replace(/\s+/g, " ").trim();
}
