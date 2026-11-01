const Redis = require("ioredis");

// Env vars are often pasted with wrapping quotes or spaces (e.g. "rediss://...").
// ioredis then mistakes the URL for a unix socket path, so clean it up first.
const redisUrl = (process.env.REDIS_URL || "redis://127.0.0.1:6379")
  .trim()
  .replace(/^['"]+|['"]+$/g, "");

const redisClient = new Redis(redisUrl, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 2000, 10000),
});

redisClient.on("connect", () => {
  console.log("Redis Connected");
});

// Log only the error code/name: the full error can contain the connection
// string (including the password), which must never end up in the logs.
redisClient.on("error", (err) => {
  console.log("Redis Error:", err.code || err.name);
});

module.exports = redisClient;
