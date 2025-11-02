#!/usr/bin/env node

import * as http from "node:http";
import { parse as parseUrl } from "node:url";

const PORT = process.env.PORT || 3000;


function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim().split("="))
      .filter(([k, v]) => k && v)
  );
}

function sendJSON(res: http.ServerResponse, status: number, data: any) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const r = req as http.IncomingMessage & { url: string; method: string };

  if (r.url === undefined) {
    return sendJSON(res, 400, { error: "Bad request" });
  }
  
  const { pathname, query } = parseUrl(r.url, true);
  const cookies = parseCookies(r.headers.cookie);

  switch (pathname) {
    case "/redirect":{
       const token = query.token;
    if (!token) {
      return sendJSON(res, 400, { error: "Missing token" });
    }

    // Set an HTTP-only cookie
    res.writeHead(200, {
      "Set-Cookie": `auth_token=${token}; HttpOnly; Path=/; SameSite=Lax`,
      "Content-Type": "text/plain",
    });
    return res.end("Token set! You can now access /random");
    }
    case "/random":{
      const token = cookies["auth_token"];
    if (!token) {
      return sendJSON(res, 401, { error: "Unauthenticated" });
    }

    const random = Math.floor(Math.random() * 100);
    return sendJSON(res, 200, { token, random });
}
  }


  sendJSON(res, 404, { error: "Not found" });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});