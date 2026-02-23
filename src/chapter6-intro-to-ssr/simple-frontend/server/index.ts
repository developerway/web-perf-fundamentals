import * as fs from "node:fs";
import path from "path";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { compress } from "hono/compress";

import { preRenderApp } from "./pre-render";

const app = new Hono();
// app.use(compress());
const dist = path.join(process.cwd(), "./dist");

app.get("/assets/*", async (c) => {
  const resourcePath = path.join(dist, c.req.path);
  const resourceContent = fs.readFileSync(resourcePath).toString();

  // Set cache headers
  c.header("Cache-Control", "max-age=9000000");

  // Set MIME type
  if (resourcePath.endsWith(".css")) {
    c.header("Content-Type", "text/css");
  } else if (resourcePath.endsWith(".js")) {
    c.header("Content-Type", "application/javascript");
  }

  return c.body(resourceContent, 200);
});

app.get("/*", async (c) => {
  const html = fs.readFileSync(path.join(dist, "index.html")).toString();

  return c.html(await preRenderApp(html, c.req.path));

  return c.html(html);
});

const cliPort = process.argv
  .find((arg) => arg.startsWith("port="))
  ?.replace("port=", "");

const port = Number(cliPort) || 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
