import { createApp } from './app.js';
import { connectDB, disconnectDB, prisma } from './config/db.js';

import { env } from './config/env.js';

await connectDB();
const app = createApp({ prisma });

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port: ${env.PORT}`);
});

// Handle unhandled promise rejections (e.g., database connection errors)
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exception
process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

// AUTH - signin, signup
// MOVIE - getting all movies
// USER = - profiles
// WATCHLIST -

// Currently need to use these commands when migrating to account for version (7 vs 8) differences in prisma.
// pnpm prisma migrate dev --name [table name]
// pnpm prisma generate
