import { prisma } from "../config/db.js";

const addToWatchlist = async (req, res) => {
  const { movieId, status, rating, notes } = req.body;

  // Verify movie exists
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  // Check if already added
  const existingInWatchlist = await prisma.watchListItem.findUnique({
    where: {
      userId_movieId: {
        userId: req.user.id,
        movieId,
      },
    },
  });

  if (existingInWatchlist) {
    return res.status(400).json({ error: "Movie already in the watchlist" });
  }

  const watchListItem = await prisma.watchListItem.create({
    data: {
      userId: req.user.id,
      movieId,
      status: status || "PLANNED",
      rating,
      notes,
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      watchListItem,
    },
  });
};

const updateWatchlist = async (req, res) => {
  const { status, rating, notes } = req.body;

  const watchListItem = await prisma.findUnique({
    where: { id: req.params.id },
  });

  if (!watchListItem) {
    return res.status(404).json({
      error: "Item not found",
    });
  }

  if (watchListItem.userId !== req.user.id) {
    return res.status(403).json({ error: "User not authorized." });
  }

  let updateData = req.data;
  if (status !== undefined) updateData.status = status.toUpperCase();
  if (rating !== undefined) updateData.rating = rating;
  if (notes !== undefined) updateData.notes = notes;

  const updatedItem = await prisma.watchListItem.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.status(200).json({
    status: "success",
    data: { watchListItem: updatedItem },
  });
};

const removeFromWatchlist = async (req, res) => {
  // Find watchlist item and verify ownership
  const watchListItem = await prisma.movie.findUnique({
    where: { id: req.params.id },
  });

  if (!watchListItem) {
    return res.status(404).json({ error: "Watchlist item not found" });
  }

  // Ensure only owner can delete
  if (watchListItem.userId !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Not allowed to update this watchlist item" });
  }

  await prisma.watchListItem.delete({
    where: { id: req.params.id },
  });

  res.status(200).json({
    status: "success",
    message: "Movie removed from the watchlist",
  });
};

export { addToWatchlist, removeFromWatchlist, updateWatchlist };
