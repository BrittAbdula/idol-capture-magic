import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { Auth } from "../auth/lucia.js";
import type { DatabaseClient } from "../db/client.js";
import { binderItems, generations, users, type User } from "../db/schema.js";
import { jsonError } from "../lib/http.js";

const CreateBinderItemSchema = z.object({
  generationId: z.string().min(1),
  customCaption: z.string().max(160).optional()
});

const BinderItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  generationId: z.string(),
  customCaption: z.string().nullable(),
  position: z.number(),
  addedAt: z.number(),
  outputUrl: z.string().nullable().optional()
});

interface BinderRouteDeps {
  auth?: Auth;
  client: DatabaseClient;
}

function storageUrl(ref: string | null): string | null {
  if (!ref) {
    return null;
  }
  return ref.startsWith("/") ? ref : `/storage/${ref}`;
}

async function currentUser(deps: BinderRouteDeps, cookieHeader: string | undefined): Promise<User | null> {
  if (!deps.auth || !cookieHeader) {
    return null;
  }

  const sessionId = deps.auth.readSessionCookie(cookieHeader);
  if (!sessionId) {
    return null;
  }

  const { user } = await deps.auth.validateSession(sessionId);
  if (!user) {
    return null;
  }

  return deps.client.db.select().from(users).where(eq(users.id, user.id)).get() ?? null;
}

function binderRows(deps: BinderRouteDeps, userId: string) {
  return deps.client.db
    .select({
      id: binderItems.id,
      userId: binderItems.userId,
      generationId: binderItems.generationId,
      customCaption: binderItems.customCaption,
      position: binderItems.position,
      addedAt: binderItems.addedAt,
      outputImageRef: generations.outputImageRef
    })
    .from(binderItems)
    .leftJoin(generations, eq(binderItems.generationId, generations.id))
    .where(eq(binderItems.userId, userId))
    .all()
    .map((row) => ({
      ...row,
      outputUrl: storageUrl(row.outputImageRef)
    }));
}

export function createBinderRoutes(deps: BinderRouteDeps): Hono {
  const app = new Hono();

  app.get("/items", async (c) => {
    const user = await currentUser(deps, c.req.header("Cookie"));
    if (!user) {
      return jsonError(c, 401, "auth_required");
    }

    return c.json({ items: z.array(BinderItemSchema).parse(binderRows(deps, user.id)) });
  });

  app.post("/items", async (c) => {
    const user = await currentUser(deps, c.req.header("Cookie"));
    if (!user) {
      return jsonError(c, 401, "auth_required");
    }

    const parsed = CreateBinderItemSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(c, 400, "invalid_binder_item");
    }

    const generation = deps.client.db
      .select()
      .from(generations)
      .where(eq(generations.id, parsed.data.generationId))
      .get();
    if (!generation) {
      return jsonError(c, 404, "generation_not_found");
    }

    const item = {
      id: randomUUID(),
      userId: user.id,
      generationId: parsed.data.generationId,
      customCaption: parsed.data.customCaption ?? null,
      position: deps.client.db.select().from(binderItems).where(eq(binderItems.userId, user.id)).all().length,
      addedAt: Math.floor(Date.now() / 1000)
    };
    deps.client.db.insert(binderItems).values(item).run();

    return c.json({ item: BinderItemSchema.parse({ ...item, outputUrl: storageUrl(generation.outputImageRef) }) });
  });

  app.delete("/items/:id", async (c) => {
    const user = await currentUser(deps, c.req.header("Cookie"));
    if (!user) {
      return jsonError(c, 401, "auth_required");
    }

    deps.client.db
      .delete(binderItems)
      .where(and(eq(binderItems.id, c.req.param("id")), eq(binderItems.userId, user.id)))
      .run();

    return c.json({ ok: true });
  });

  app.delete("/items", async (c) => {
    const user = await currentUser(deps, c.req.header("Cookie"));
    if (!user) {
      return jsonError(c, 401, "auth_required");
    }

    const id = c.req.query("id");
    if (!id) {
      return jsonError(c, 400, "missing_binder_item_id");
    }

    deps.client.db
      .delete(binderItems)
      .where(and(eq(binderItems.id, id), eq(binderItems.userId, user.id)))
      .run();

    return c.json({ ok: true });
  });

  app.get("/public/:handle", (c) => {
    const user = deps.client.db
      .select()
      .from(users)
      .where(eq(users.handle, c.req.param("handle")))
      .get();
    if (!user) {
      return jsonError(c, 404, "binder_not_found");
    }

    return c.json({
      handle: user.handle,
      items: z.array(BinderItemSchema).parse(binderRows(deps, user.id))
    });
  });

  return app;
}
