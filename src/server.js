import express from "express";

import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import movieRouter from "./routes/movieRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";

config();
connectDB();

const app = express();

// Body parsing middlewares - app.use indicates use of middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for use of html forms, if used.

// API Routes
app.use("/movies", movieRouter);
app.use("/auth", authRoutes);
app.use("/watchlist", watchlistRoutes);

const PORT = 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});

// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exception
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
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
