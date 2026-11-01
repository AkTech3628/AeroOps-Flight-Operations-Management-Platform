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

// Never log the full error: connection errors can contain the connection string
// (including the password). ReplyError messages come from the Redis server itself
// and are safe, so they are logged to make auth/ACL problems diagnosable.
redisClient.on("error", (err) => {
  console.log(
    "Redis Error:",
    err.name === "ReplyError" ? err.message : err.code || err.name
  );
});

module.exports = redisClient;
