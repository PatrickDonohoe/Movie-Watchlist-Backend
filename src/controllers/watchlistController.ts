import type { Request, Response } from 'express';
import { type WatchListItem, Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { requireUser } from '../utils/requireUser.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/respond.js';
import type { ApiResponse } from '../types/api.js';
import type {
  AddToWatchlistInput,
  UpdateWatchlistInput,
} from '../validators/watchlistValidators.js';

type ItemParams = { id: string };
type ItemData = { watchListItem: WatchListItem };
type WatchList = { watchlist: WatchListItem[] };

// Extracted because it is shared by update and remove
const findOwnedItem = async (itemId: string, userId: string) => {
  const item = await prisma.watchListItem.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError('Watchlist item not found', 404);
  if (item.userId !== userId)
    throw new AppError('Not allowed to modify this item', 403);
  return item;
};

const getWatchlist = async (
  req: Request<{}, ApiResponse<WatchList>>,
  res: Response<ApiResponse<WatchList>>
) => {
  const user = requireUser(req);

  const watchlist = await prisma.watchListItem.findMany({
    where: { userId: user.id },
  });

  sendSuccess(res, { watchlist });
};

const getWatchlistItem = async (
  req: Request<ItemParams, ApiResponse<ItemData>>,
  res: Response<ApiResponse<ItemData>>
) => {
  const user = requireUser(req);
  const watchListItem = await findOwnedItem(req.params.id, user.id);

  sendSuccess(res, { watchListItem });
};

const addToWatchlist = async (
  req: Request<{}, ApiResponse<ItemData>, AddToWatchlistInput>,
  res: Response<ApiResponse<ItemData>>
) => {
  const user = requireUser(req);
  const { movieId, status, rating, notes } = req.body;

  try {
    const watchListItem = await prisma.watchListItem.create({
      data: {
        userId: user.id,
        movieId,
        status,
        rating,
        notes,
      },
    });
    return sendSuccess(res, { watchListItem }, 201)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('Movie already in the watchlist', 409);
    }
    throw err;
  }
};

const updateWatchlist = async (
  req: Request<ItemParams, ApiResponse<ItemData>, UpdateWatchlistInput>,
  res: Response<ApiResponse<ItemData>>
) => {
  const user = requireUser(req);
  await findOwnedItem(req.params.id, user.id);

  const { status, rating, notes } = req.body;

  const watchListItem = await prisma.watchListItem.update({
    where: { id: req.params.id },
    data: { status, rating, notes },
  });

  return sendSuccess(res, { watchListItem });
};

const removeFromWatchlist = async (
  req: Request<ItemParams>,
  res: Response<ApiResponse<{ message: string }>>
) => {
  const user = requireUser(req);
  // Find watchlist item and verify ownership
  await findOwnedItem(req.params.id, user.id);

  await prisma.watchListItem.delete({
    where: { id: req.params.id },
  });

  return sendSuccess(res, { message: 'Movie removed from the watchlist' });
};

export {
  getWatchlist,
  getWatchlistItem,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlist,
};
