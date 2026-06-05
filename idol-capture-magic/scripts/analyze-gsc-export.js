import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(appRoot, "..");
const defaultDataRoot = path.join(workspaceRoot, "goole-search-console-data");
const targetCtr = 0.25;
const trackedPagePaths = [
  "/photo-with-idol",
  "/photo-strip",
  "/strip",
  "/photo-booth",
  "/template",
  "/"
];

const options = parseArgs(process.argv.slice(2));

const exportDir = resolveExportDir(options.exportArg);
const report = buildReport(exportDir);

if (options.baselineArg) {
  report.baselineComparison = compareReports(
    report,
    buildReport(resolveExportDir(options.baselineArg))
  );
}

if (options.jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printMarkdown(report);
}

function parseArgs(args) {
  const parsed = {
    exportArg: null,
    baselineArg: null,
    jsonOutput: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      parsed.jsonOutput = true;
    } else if (arg === "--baseline") {
      if (!args[index + 1] || args[index + 1].startsWith("--")) {
        throw new Error("Missing value for --baseline");
      }
      parsed.baselineArg = args[index + 1];
      index += 1;
    } else if (arg.startsWith("--baseline=")) {
      parsed.baselineArg = arg.slice("--baseline=".length);
      if (!parsed.baselineArg) {
        throw new Error("Missing value for --baseline");
      }
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!parsed.exportArg) {
      parsed.exportArg = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (parsed.baselineArg === undefined) {
    throw new Error("Missing value for --baseline");
  }

  return parsed;
}

function resolveExportDir(exportArg) {
  return path.resolve(exportArg ?? findLatestExport(defaultDataRoot));
}

function findLatestExport(dataRoot) {
  const candidates = fs
    .readdirSync(dataRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && entry.name.startsWith("idolbooth.com-Performance-on-Search-")
    )
    .map((entry) => path.join(dataRoot, entry.name))
    .sort((a, b) => a.localeCompare(b));

  if (!candidates.length) {
    throw new Error(`No GSC export folders found in ${dataRoot}`);
  }

  return candidates.at(-1);
}

function buildReport(sourceDir) {
  const chartRows = readMetricRows(sourceDir, "Chart.csv");
  const queryRows = readMetricRows(sourceDir, "Queries.csv", "Top queries");
  const pageRows = readMetricRows(sourceDir, "Pages.csv", "Top pages").map((row) => ({
    ...row,
    path: pathFromUrl(row.label)
  }));
  const countryRows = readMetricRows(sourceDir, "Countries.csv", "Country");
  const deviceRows = readMetricRows(sourceDir, "Devices.csv", "Device");

  const totals = summarize(chartRows);
  const sortedChartRows = [...chartRows].sort((a, b) => a.label.localeCompare(b.label));
  const last14Rows = sortedChartRows.slice(-14);
  const prior14Rows = sortedChartRows.slice(-28, -14);
  const last14 = summarize(last14Rows);
  const prior14 = summarize(prior14Rows);

  const report = {
    exportDir: sourceDir,
    dateRange: {
      start: sortedChartRows[0]?.label ?? null,
      end: sortedChartRows.at(-1)?.label ?? null
    },
    totals,
    recentTrend: {
      prior14,
      last14,
      clickDelta: last14.clicks - prior14.clicks,
      impressionDelta: last14.impressions - prior14.impressions,
      positionDelta: round(last14.position - prior14.position, 2)
    },
    topQueries: queryRows.slice(0, 10).map(compactMetricRow),
    queryOpportunities: opportunityRows(queryRows).slice(0, 12).map(compactMetricRow),
    pageOpportunities: pageRows
      .filter((row) => row.impressions >= 20)
      .map((row) => ({
        ...compactMetricRow(row),
        path: row.path,
        note: pageNote(row, totals.ctr)
      }))
      .sort((a, b) => b.impressions - a.impressions),
    countryOpportunities: countryRows
      .filter((row) => row.impressions >= 100 && row.ctr < totals.ctr)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)
      .map(compactMetricRow),
    devices: deviceRows.map(compactMetricRow)
  };

  Object.defineProperty(report, "sourceRows", {
    value: {
      queries: queryRows,
      pages: pageRows,
      countries: countryRows,
      devices: deviceRows
    }
  });

  return report;
}

function readMetricRows(sourceDir, fileName, labelColumn) {
  const rows = parseCsv(fs.readFileSync(path.join(sourceDir, fileName), "utf8"));
  return rows.map((row) => {
    const label = row[labelColumn ?? Object.keys(row)[0]];
    return {
      label,
      clicks: numberFrom(row.Clicks),
      impressions: numberFrom(row.Impressions),
      ctr: percentFrom(row.CTR),
      position: numberFrom(row.Position)
    };
  });
}

function compareReports(current, baseline) {
  const trackedQueryLabels = [
    ...new Set([
      ...baseline.queryOpportunities.slice(0, 6).map((row) => row.label),
      ...current.queryOpportunities.slice(0, 6).map((row) => row.label)
    ])
  ];

  return {
    baselineExportDir: baseline.exportDir,
    currentExportDir: current.exportDir,
    baselineDateRange: baseline.dateRange,
    currentDateRange: current.dateRange,
    totals: compareSummary(current.totals, baseline.totals),
    last14: compareSummary(current.recentTrend.last14, baseline.recentTrend.last14),
    trackedPages: compareRows(
      trackedPagePaths,
      rowMap(current.sourceRows.pages, "path"),
      rowMap(baseline.sourceRows.pages, "path")
    ),
    trackedQueries: compareRows(
      trackedQueryLabels,
      rowMap(current.sourceRows.queries, "label"),
      rowMap(baseline.sourceRows.queries, "label")
    ),
    trackedCountries: compareRows(
      ["Vietnam", "Philippines", "United States", "Thailand"],
      rowMap(current.sourceRows.countries, "label"),
      rowMap(baseline.sourceRows.countries, "label")
    ),
    trackedDevices: compareRows(
      ["Mobile", "Desktop", "Tablet"],
      rowMap(current.sourceRows.devices, "label"),
      rowMap(baseline.sourceRows.devices, "label")
    )
  };
}

function rowMap(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function compareRows(labels, currentRows, baselineRows) {
  return labels
    .map((label) => compareRow(label, currentRows.get(label), baselineRows.get(label)))
    .filter((row) => row.currentImpressions > 0 || row.baselineImpressions > 0);
}

function compareRow(label, current, baseline) {
  return {
    label,
    currentClicks: current?.clicks ?? 0,
    baselineClicks: baseline?.clicks ?? 0,
    clickDelta: (current?.clicks ?? 0) - (baseline?.clicks ?? 0),
    currentImpressions: current?.impressions ?? 0,
    baselineImpressions: baseline?.impressions ?? 0,
    impressionDelta: (current?.impressions ?? 0) - (baseline?.impressions ?? 0),
    currentCtr: current ? round(current.ctr * 100, 2) : 0,
    baselineCtr: baseline ? round(baseline.ctr * 100, 2) : 0,
    ctrDeltaPoints: round(((current?.ctr ?? 0) - (baseline?.ctr ?? 0)) * 100, 2),
    currentPosition: current?.position ?? null,
    baselinePosition: baseline?.position ?? null,
    positionDelta:
      current?.position === undefined || baseline?.position === undefined
        ? null
        : round(current.position - baseline.position, 2)
  };
}

function compareSummary(current, baseline) {
  return {
    currentClicks: current.clicks,
    baselineClicks: baseline.clicks,
    clickDelta: current.clicks - baseline.clicks,
    currentImpressions: current.impressions,
    baselineImpressions: baseline.impressions,
    impressionDelta: current.impressions - baseline.impressions,
    currentCtr: round(current.ctr * 100, 2),
    baselineCtr: round(baseline.ctr * 100, 2),
    ctrDeltaPoints: round((current.ctr - baseline.ctr) * 100, 2),
    currentPosition: current.position,
    baselinePosition: baseline.position,
    positionDelta: round(current.position - baseline.position, 2)
  };
}

function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...body] = rows.filter((item) => item.some((value) => value.trim().length));
  return body.map((item) =>
    Object.fromEntries(headers.map((header, index) => [header, item[index] ?? ""]))
  );
}

function summarize(rows) {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const weightedPosition = rows.reduce((sum, row) => sum + row.position * row.impressions, 0);

  return {
    clicks,
    impressions,
    ctr: impressions ? round(clicks / impressions, 4) : 0,
    position: impressions ? round(weightedPosition / impressions, 2) : 0
  };
}

function opportunityRows(rows) {
  return rows
    .filter((row) => row.impressions >= 20)
    .filter((row) => row.position >= 4 && row.position <= 10)
    .map((row) => ({
      ...row,
      clickUpsideTo25Ctr: Math.max(0, Math.round(row.impressions * targetCtr - row.clicks))
    }))
    .filter((row) => row.clickUpsideTo25Ctr > 0)
    .sort((a, b) => b.clickUpsideTo25Ctr - a.clickUpsideTo25Ctr || b.impressions - a.impressions);
}

function compactMetricRow(row) {
  return {
    label: row.label,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: round(row.ctr * 100, 2),
    position: row.position,
    ...(row.clickUpsideTo25Ctr === undefined ? {} : { clickUpsideTo25Ctr: row.clickUpsideTo25Ctr })
  };
}

function pageNote(row, siteCtr) {
  if (["/privacy", "/terms"].includes(row.path) || row.path.startsWith("/legal/")) {
    return "Non-growth support page; no CTR action";
  }
  if (row.path === "/photo-with-idol") {
    return "High-impression intent page with below-site CTR";
  }
  if (row.path === "/photo-booth" || row.path === "/template") {
    return "Legacy URL should redirect to canonical destination";
  }
  if (row.ctr === 0 && row.position <= 5) {
    return "High-position zero-click page";
  }
  if (row.ctr < siteCtr * 0.6) {
    return "Below-site CTR";
  }
  return "Monitor";
}

function pathFromUrl(value) {
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

function numberFrom(value) {
  return Number(String(value).replaceAll(",", ""));
}

function percentFrom(value) {
  return numberFrom(String(value).replace("%", "")) / 100;
}

function round(value, digits) {
  return Number(value.toFixed(digits));
}

function printMarkdown(data) {
  console.log(`# GSC Export Analysis`);
  console.log("");
  console.log(`Source: \`${path.relative(workspaceRoot, data.exportDir)}\``);
  console.log(`Date range: ${data.dateRange.start} to ${data.dateRange.end}`);
  console.log("");
  console.log(
    `Totals: ${formatInteger(data.totals.clicks)} clicks, ${formatInteger(
      data.totals.impressions
    )} impressions, ${formatPercent(data.totals.ctr)} CTR, position ${data.totals.position}.`
  );
  console.log(
    `Last 14 days: ${formatInteger(data.recentTrend.last14.clicks)} clicks / ${formatInteger(
      data.recentTrend.last14.impressions
    )} impressions at position ${data.recentTrend.last14.position}; prior 14 days: ${formatInteger(
      data.recentTrend.prior14.clicks
    )} clicks / ${formatInteger(data.recentTrend.prior14.impressions)} impressions at position ${
      data.recentTrend.prior14.position
    }.`
  );
  console.log("");
  printTable("Top query opportunities", data.queryOpportunities, [
    "label",
    "clicks",
    "impressions",
    "ctr",
    "position",
    "clickUpsideTo25Ctr"
  ]);
  printTable("Page opportunities", data.pageOpportunities, [
    "path",
    "clicks",
    "impressions",
    "ctr",
    "position",
    "note"
  ]);
  printTable("Country CTR opportunities", data.countryOpportunities, [
    "label",
    "clicks",
    "impressions",
    "ctr",
    "position"
  ]);
  printTable("Devices", data.devices, ["label", "clicks", "impressions", "ctr", "position"]);
  if (data.baselineComparison) {
    printComparison(data.baselineComparison);
  }
}

function printComparison(comparison) {
  console.log("## Baseline comparison");
  console.log("");
  console.log(`Baseline: \`${path.relative(workspaceRoot, comparison.baselineExportDir)}\``);
  console.log(`Current: \`${path.relative(workspaceRoot, comparison.currentExportDir)}\``);
  console.log("");
  printTable(
    "Total movement",
    [comparison.totals],
    [
      "clickDelta",
      "impressionDelta",
      "ctrDeltaPoints",
      "positionDelta",
      "currentCtr",
      "currentPosition"
    ]
  );
  printTable(
    "Last-14-day movement",
    [comparison.last14],
    [
      "clickDelta",
      "impressionDelta",
      "ctrDeltaPoints",
      "positionDelta",
      "currentCtr",
      "currentPosition"
    ]
  );
  printTable("Tracked page movement", comparison.trackedPages, [
    "label",
    "clickDelta",
    "impressionDelta",
    "ctrDeltaPoints",
    "positionDelta",
    "currentCtr",
    "currentPosition"
  ]);
  printTable("Tracked query movement", comparison.trackedQueries, [
    "label",
    "clickDelta",
    "impressionDelta",
    "ctrDeltaPoints",
    "positionDelta",
    "currentCtr",
    "currentPosition"
  ]);
  printTable("Tracked country movement", comparison.trackedCountries, [
    "label",
    "clickDelta",
    "impressionDelta",
    "ctrDeltaPoints",
    "positionDelta",
    "currentCtr",
    "currentPosition"
  ]);
  printTable("Tracked device movement", comparison.trackedDevices, [
    "label",
    "clickDelta",
    "impressionDelta",
    "ctrDeltaPoints",
    "positionDelta",
    "currentCtr",
    "currentPosition"
  ]);
}

function printTable(title, rows, columns) {
  console.log(`## ${title}`);
  console.log("");
  console.log(`| ${columns.join(" | ")} |`);
  console.log(`| ${columns.map(() => "---").join(" | ")} |`);
  for (const row of rows) {
    console.log(`| ${columns.map((column) => formatCell(row[column])).join(" | ")} |`);
  }
  console.log("");
}

function formatCell(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? formatInteger(value) : String(value);
  }
  return String(value ?? "");
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value) {
  return `${round(value * 100, 2)}%`;
}
