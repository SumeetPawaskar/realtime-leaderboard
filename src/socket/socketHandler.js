const redis = require('../config/redis');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle player score updates
    socket.on('playerScoreUpdate', async ({ playerId, region, mode, score }) => {
      try {
        const key = `leaderboard:${region}:${mode}`;

        // Increment player's score in Redis
        await redis.zIncrBy(key, score, playerId);

        // TTL Logic: Set key to expire at midnight only if it doesn't already have TTL
        const ttl = await redis.ttl(key);
        if (ttl === -1) {
          const now = new Date();
          const midnight = new Date(now);
          midnight.setHours(24, 0, 0, 0); // Next midnight
          const secondsTillMidnight = Math.floor((midnight - now) / 1000);
          await redis.expire(key, secondsTillMidnight);
        }

        // Emit updated score to all clients
        io.emit('leaderboardUpdate', { playerId, score });
      } catch (error) {
        console.error('Error updating score:', error);
      }
    });

    // Handle leaderboard fetch requests
    socket.on('getTopPlayers', async ({ region, mode, limit = 10 }, callback) => {
      try {
        const key = `leaderboard:${region}:${mode}`;
        const data = await redis.zRevRangeWithScores(key, 0, limit - 1);
        callback(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        callback([]);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
