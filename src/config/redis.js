const { createClient } = require('redis');
require('dotenv').config(); 
console.log("Connecting to Redis URL:", process.env.REDIS_URL); 
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

redisClient.connect();

module.exports = redisClient;

