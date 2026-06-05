import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface AnalysisQuery {
  name: string;
  description: string;
  sql: string;
}

const databaseName = "batchloom-db";

export const funnelAnalysisQueries: AnalysisQuery[] = [
  {
    name: "users_and_paid_state",
    description: "Registered users, recent registration, paid plan, and Stripe linkage.",
    sql: `
      WITH now(value) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER))
      SELECT
        COUNT(*) AS registered_total,
        SUM(CASE WHEN created_at >= (SELECT value FROM now) - 86400 THEN 1 ELSE 0 END) AS registered_last_24h,
        SUM(CASE WHEN created_at >= (SELECT value FROM now) - 7 * 86400 THEN 1 ELSE 0 END) AS registered_last_7d,
        SUM(CASE WHEN created_at >= (SELECT value FROM now) - 30 * 86400 THEN 1 ELSE 0 END) AS registered_last_30d,
        SUM(CASE WHEN plan IN ('plus', 'pro') THEN 1 ELSE 0 END) AS paid_users_total,
        SUM(CASE WHEN stripe_customer_id IS NOT NULL THEN 1 ELSE 0 END) AS users_with_stripe_customer_id,
        SUM(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 ELSE 0 END) AS users_with_subscription_id
      FROM users;
    `
  },
  {
    name: "generation_funnel_snapshot",
    description: "Generation volume, outcomes, cost, and active-user activation.",
    sql: `
      WITH now(value) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER))
      SELECT
        COUNT(*) AS total_generations,
        COUNT(DISTINCT user_id) AS users_with_generation,
        SUM(CASE WHEN created_at >= (SELECT value FROM now) - 7 * 86400 THEN 1 ELSE 0 END) AS generations_last_7d,
        SUM(CASE WHEN created_at >= (SELECT value FROM now) - 30 * 86400 THEN 1 ELSE 0 END) AS generations_last_30d,
        SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded_generations,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_generations,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running_generations,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued_generations,
        ROUND(SUM(COALESCE(cost, 0)), 4) AS total_generation_cost_usd,
        ROUND(
          SUM(COALESCE(cost, 0)) / NULLIF(SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END), 0),
          4
        ) AS cost_per_succeeded_generation
      FROM generations;
    `
  },
  {
    name: "generation_reliability_by_status",
    description: "Stale generation risk by status, including jobs older than 1h and 24h.",
    sql: `
      WITH now(value) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER))
      SELECT
        status,
        COUNT(*) AS generations,
        ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM generations), 0), 2) AS share_percent,
        DATE(MIN(created_at), 'unixepoch') AS oldest_date,
        DATE(MAX(created_at), 'unixepoch') AS newest_date,
        SUM(CASE WHEN created_at <= (SELECT value FROM now) - 3600 THEN 1 ELSE 0 END) AS older_than_1h,
        SUM(CASE WHEN created_at <= (SELECT value FROM now) - 24 * 3600 THEN 1 ELSE 0 END) AS older_than_24h
      FROM generations
      GROUP BY status
      ORDER BY generations DESC;
    `
  },
  {
    name: "usage_depth",
    description: "Registered-user depth buckets for activation and repeat usage.",
    sql: `
      WITH user_generation_counts AS (
        SELECT
          u.id,
          COUNT(g.id) AS generation_count
        FROM users u
        LEFT JOIN generations g ON g.user_id = u.id
        GROUP BY u.id
      ),
      buckets AS (
        SELECT
          CASE
            WHEN generation_count = 0 THEN '0'
            WHEN generation_count = 1 THEN '1'
            WHEN generation_count BETWEEN 2 AND 3 THEN '2-3'
            WHEN generation_count BETWEEN 4 AND 9 THEN '4-9'
            ELSE '10+'
          END AS generation_count_bucket,
          COUNT(*) AS users
        FROM user_generation_counts
        GROUP BY generation_count_bucket
      )
      SELECT
        generation_count_bucket,
        users,
        ROUND(100.0 * users / NULLIF((SELECT COUNT(*) FROM users), 0), 2) AS share_percent
      FROM buckets
      ORDER BY
        CASE generation_count_bucket
          WHEN '0' THEN 0
          WHEN '1' THEN 1
          WHEN '2-3' THEN 2
          WHEN '4-9' THEN 3
          ELSE 4
        END;
    `
  },
  {
    name: "format_demand",
    description: "Generation format demand for aligning SEO intent with product usage.",
    sql: `
      SELECT
        format,
        COUNT(*) AS generations,
        ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM generations), 0), 2) AS share_percent,
        SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN status IN ('queued', 'running') THEN 1 ELSE 0 END) AS pending
      FROM generations
      GROUP BY format
      ORDER BY generations DESC;
    `
  },
  {
    name: "billing_events_last_7d",
    description: "Checkout and webhook telemetry after billing_events deployment.",
    sql: `
      WITH now(value) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER))
      SELECT
        event_type,
        COUNT(*) AS events,
        SUM(CASE WHEN created_at >= (SELECT value FROM now) - 7 * 86400 THEN 1 ELSE 0 END) AS events_last_7d,
        SUM(CASE WHEN checkout_flow = 'resumed_after_sign_in' THEN 1 ELSE 0 END) AS resumed_after_sign_in_events,
        SUM(CASE WHEN source = 'upgrade_dialog' THEN 1 ELSE 0 END) AS upgrade_dialog_events,
        SUM(CASE WHEN source = 'pricing_page' THEN 1 ELSE 0 END) AS pricing_page_events
      FROM billing_events
      GROUP BY event_type
      ORDER BY events_last_7d DESC, events DESC;
    `
  },
  {
    name: "checkout_trigger_mix_last_7d",
    description:
      "Checkout intent mix by source, trigger surface, and direct vs sign-in-resumed flow.",
    sql: `
      WITH now(value) AS (SELECT CAST(strftime('%s', 'now') AS INTEGER))
      SELECT
        COALESCE(source, 'unknown') AS source,
        COALESCE(trigger_surface, 'unknown') AS trigger_surface,
        COALESCE(checkout_flow, 'unknown') AS checkout_flow,
        COUNT(*) AS checkout_events_last_7d
      FROM billing_events
      WHERE
        event_type IN ('checkout_created', 'checkout_retry_succeeded', 'checkout_failed')
        AND created_at >= (SELECT value FROM now) - 7 * 86400
      GROUP BY source, trigger_surface, checkout_flow
      ORDER BY checkout_events_last_7d DESC;
    `
  },
  {
    name: "binder_usage",
    description: "Binder save usage as a result-value signal.",
    sql: `
      SELECT
        COUNT(*) AS binder_items,
        COUNT(DISTINCT user_id) AS users_with_binder_item
      FROM binder_items;
    `
  }
];

export function runCli(args = process.argv.slice(2)): void {
  const runLocal = args.includes("--local");
  const runRemote = args.includes("--remote");
  const jsonOutput = args.includes("--json");

  for (const query of funnelAnalysisQueries) {
    assertReadOnlyAnalysisQuery(query);
  }

  if (runLocal && runRemote) {
    throw new Error("Choose only one execution target: --local or --remote.");
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ databaseName, queries: funnelAnalysisQueries }, null, 2));
  } else if (runLocal || runRemote) {
    runQueries(runRemote ? "remote" : "local");
  } else {
    printQueries();
  }
}

export function assertReadOnlyAnalysisQuery(query: AnalysisQuery): void {
  const normalized = query.sql.trim().toLowerCase();
  if (!normalized.startsWith("select") && !normalized.startsWith("with")) {
    throw new Error(`Refusing non-read-only query: ${query.name}`);
  }
}

function runQueries(target: "local" | "remote"): void {
  for (const query of funnelAnalysisQueries) {
    console.log(`\n## ${query.name}`);
    console.log(query.description);
    const result = spawnSync(
      "npx",
      [
        "wrangler",
        "d1",
        "execute",
        databaseName,
        target === "remote" ? "--remote" : "--local",
        "--command",
        cleanAnalysisSql(query.sql)
      ],
      { stdio: "inherit" }
    );

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

function printQueries(): void {
  console.log("# IdolBooth D1 Funnel Analysis");
  console.log("");
  console.log("Default mode prints read-only SQL only. To execute:");
  console.log("");
  console.log("```sh");
  console.log("npm run analyze:funnel -- --local");
  console.log("npm run analyze:funnel -- --remote");
  console.log("```");
  console.log("");

  for (const query of funnelAnalysisQueries) {
    console.log(`## ${query.name}`);
    console.log("");
    console.log(query.description);
    console.log("");
    console.log("```sql");
    console.log(cleanAnalysisSql(query.sql));
    console.log("```");
    console.log("");
  }
}

export function cleanAnalysisSql(sql: string): string {
  return sql
    .trim()
    .split("\n")
    .map((line) => line.replace(/^ {6}/, ""))
    .join("\n");
}

function isDirectRun(): boolean {
  return Boolean(
    process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

if (isDirectRun()) {
  runCli();
}
