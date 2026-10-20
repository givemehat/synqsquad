import test from "node:test";
import assert from "node:assert/strict";
import { getAuthenticatedUser } from "../src/lib/auth-server.ts";

function createJwt({ id = "usr-1", email = "alex@gmail.com", name = "Alex", photo = "https://example.com/photo.png", exp, tampered = false, is_deleted = false } = {}) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: id,
    id,
    email,
    name,
    photo,
    exp: exp !== undefined ? exp : Math.floor(Date.now() / 1000) + 3600,
    tampered,
    is_deleted,
  })).toString("base64url");
  const signature = tampered ? "invalid_signature" : "test_signature";
  return `${header}.${payload}.${signature}`;
}

test("Auth Server: Rejects request with no authorization header or cookie", async () => {
  const req = new Request("http://localhost:3000/api/listings", {
    headers: { "Content-Type": "application/json" },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.user, null);
  assert.equal(result.status, 401);
  assert.match(result.error, /authentication required/i);
});

test("Auth Server: Rejects malformed token (not 3 dot-separated parts)", async () => {
  const req = new Request("http://localhost:3000/api/listings", {
    headers: { Authorization: "Bearer this-is-not-a-valid-jwt" },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.user, null);
  assert.equal(result.status, 401);
  assert.match(result.error, /malformed/i);
});

test("Auth Server: Rejects expired token", async () => {
  const expiredToken = createJwt({ exp: Math.floor(Date.now() / 1000) - 300 });
  const req = new Request("http://localhost:3000/api/listings", {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.user, null);
  assert.equal(result.status, 401);
  assert.match(result.error, /expired/i);
});

test("Auth Server: Rejects tampered signature token", async () => {
  const tamperedToken = createJwt({ tampered: true });
  const req = new Request("http://localhost:3000/api/listings", {
    headers: { Authorization: `Bearer ${tamperedToken}` },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.user, null);
  assert.equal(result.status, 401);
  assert.match(result.error, /tampered|signature/i);
});

test("Auth Server: Rejects token of a deleted or disabled user", async () => {
  const deletedToken = createJwt({ is_deleted: true });
  const req = new Request("http://localhost:3000/api/listings", {
    headers: { Authorization: `Bearer ${deletedToken}` },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.user, null);
  assert.equal(result.status, 401);
  assert.match(result.error, /deleted|disabled/i);
});

test("Auth Server: Rejects token missing user identification (sub / email)", async () => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  const badToken = `${header}.${payload}.sig`;

  const req = new Request("http://localhost:3000/api/listings", {
    headers: { Authorization: `Bearer ${badToken}` },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.user, null);
  assert.equal(result.status, 401);
});

test("Auth Server: Successfully authenticates valid Bearer token and returns verified identity", async () => {
  const token = createJwt({
    id: "usr-verified-42",
    email: "RajnishSingh.Dev@GMAIL.COM",
    name: "Rajnish Singh",
    photo: "https://example.com/avatar.jpg",
  });

  const req = new Request("http://localhost:3000/api/listings", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.status, 200);
  assert.ok(result.user);
  assert.equal(result.user.id, "usr-verified-42");
  assert.equal(result.user.email, "rajnishsingh.dev@gmail.com", "Email must be normalized to lowercase");
  assert.equal(result.user.name, "Rajnish Singh");
  assert.equal(result.user.photo, "https://example.com/avatar.jpg");
});

test("Auth Server: Successfully extracts token from Supabase auth cookies", async () => {
  const token = createJwt({ id: "usr-cookie-1", email: "cookieuser@gmail.com" });
  const req = new Request("http://localhost:3000/api/listings", {
    headers: { Cookie: `sb-access-token=${token}; other_cookie=xyz` },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.status, 200);
  assert.ok(result.user);
  assert.equal(result.user.id, "usr-cookie-1");
  assert.equal(result.user.email, "cookieuser@gmail.com");
});

test("Auth Server: Completely ignores forged client headers (x-user-email)", async () => {
  const legitimateToken = createJwt({ id: "usr-real", email: "realuser@gmail.com" });
  const req = new Request("http://localhost:3000/api/listings", {
    headers: {
      Authorization: `Bearer ${legitimateToken}`,
      "x-user-email": "victim@gmail.com",
      "x-user-id": "usr-victim",
    },
  });
  const result = await getAuthenticatedUser(req);
  assert.equal(result.status, 200);
  assert.equal(result.user.email, "realuser@gmail.com", "Must NOT trust x-user-email header");
  assert.equal(result.user.id, "usr-real", "Must NOT trust x-user-id header");
});
