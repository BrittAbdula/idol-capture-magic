#!/usr/bin/env bash
set -euo pipefail

node <<'NODE'
const checks = [
  ["backend health", "http://localhost:8787/health", (body) => body.ok === true],
  ["groups api", "http://localhost:8787/api/groups", (body) => body.some((item) => item.slug === "newjeans")],
  ["member api", "http://localhost:8787/api/members/newjeans/haerin", (body) => body.member.slug === "haerin"],
  ["concepts api", "http://localhost:8787/api/concepts", (body) => body.length >= 24]
];

for (const [name, url, validate] of checks) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${name} returned ${response.status}`);
  }
  const body = await response.json();
  if (!validate(body)) {
    throw new Error(`${name} returned unexpected payload`);
  }
}

const frontendPaths = [
  "/",
  "/g/newjeans",
  "/g/newjeans/haerin",
  "/selca",
  "/pricing",
  "/c/newjeans-supernatural"
];

for (const pathname of frontendPaths) {
  const response = await fetch(`http://localhost:8080${pathname}`);
  if (response.status !== 200) {
    throw new Error(`${pathname} returned ${response.status}`);
  }
}

console.log("smoke test passed");
NODE
