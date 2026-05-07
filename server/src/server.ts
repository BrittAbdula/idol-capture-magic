import {
  createServer,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type OutgoingHttpHeaders
} from "node:http";
import { Readable } from "node:stream";

import type { Hono } from "hono";

function requestBody(req: IncomingMessage): RequestInit["body"] | undefined {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  return Readable.toWeb(req) as RequestInit["body"];
}

function toHeaders(headers: IncomingHttpHeaders): Headers {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(key, item);
      }
    } else if (value !== undefined) {
      result.set(key, value);
    }
  }
  return result;
}

function responseHeaders(headers: Headers): OutgoingHttpHeaders {
  const result: OutgoingHttpHeaders = {};

  headers.forEach((value, key) => {
    if (key !== "set-cookie") {
      result[key] = value;
    }
  });

  const setCookieHeaders = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
  if (setCookieHeaders?.length) {
    result["set-cookie"] = setCookieHeaders;
  } else {
    const setCookie = headers.get("set-cookie");
    if (setCookie) {
      result["set-cookie"] = setCookie;
    }
  }

  return result;
}

export function startServer(app: Hono, port: number) {
  const server = createServer(async (req, res) => {
    try {
      const host = req.headers.host ?? `localhost:${port}`;
      const request = new Request(`http://${host}${req.url ?? "/"}`, {
        method: req.method,
        headers: toHeaders(req.headers),
        body: requestBody(req),
        duplex: "half"
      } as RequestInit);
      const response = await app.fetch(request);

      res.writeHead(response.status, responseHeaders(response.headers));
      if (response.body) {
        Readable.fromWeb(response.body).pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "internal_error" }));
    }
  });

  server.listen(port, () => {
    console.log(`IdolBooth server listening on http://localhost:${port}`);
  });

  return server;
}
