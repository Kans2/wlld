import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { getRedisClient } from './config/redis';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Optionally connect to Redis
    const redis = getRedisClient();
    if (redis) {
      await redis.connect().catch(() => {
        console.warn('⚠️ Redis connection failed — running without cache');
      });
    }

    // Start Express server
    const port = parseInt(env.PORT, 10);
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
      console.log(`📡 API: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
