import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  assertReadOnlyAnalysisQuery,
  cleanAnalysisSql,
  funnelAnalysisQueries
} from "../../scripts/analyze-funnel.js";
import { createTestD1DatabaseClient, type TestDatabaseClient } from "./test-d1.js";

describe("funnel analysis queries", () => {
  let client: TestDatabaseClient;

  beforeEach(async () => {
    client = await createTestD1DatabaseClient();
  });

  afterEach(async () => {
    await client.dispose();
  });

  test("are read-only and executable after migrations", async () => {
    expect(funnelAnalysisQueries.length).toBeGreaterThan(0);

    for (const query of funnelAnalysisQueries) {
      expect(() => assertReadOnlyAnalysisQuery(query)).not.toThrow();
      await expect(client.d1.getAll(cleanAnalysisSql(query.sql), [])).resolves.toEqual(
        expect.any(Array)
      );
    }
  });
});
