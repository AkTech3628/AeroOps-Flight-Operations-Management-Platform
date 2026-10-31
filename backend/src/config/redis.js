const Redis = require("ioredis");

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 2000, 10000),
  }
);

redisClient.on("connect", () => {
  console.log(" Redis Connected");
});

redisClient.on("error", (err) => {
  console.log("Redis Error:", err);
});

module.exports = redisClient;