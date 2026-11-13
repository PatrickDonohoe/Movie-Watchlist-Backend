import type { Request, Response } from 'express';
import { type WatchListItem, Prisma } from '@prisma/client';
import { requireUser } from '../utils/requireUser.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/respond.js';
import type { ApiResponse } from '../types/api.js';
import type {
  AddToWatchlistInput,
  UpdateWatchlistInput,
} from '../validators/watchlistValidators.js';
import type { AppDeps } from '../app.js';

type ItemParams = { id: string };
type ItemData = { watchListItem: WatchListItem };
type WatchList = { watchlist: WatchListItem[] };

export const createWatchlistController = ({ prisma }: AppDeps) => {
  // Extracted because it is shared by update and remove
  const findOwnedItem = async (itemId: string, userId: string) => {
    const item = await prisma.watchListItem.findUnique({
      where: { id: itemId },
    });
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

    try {
      const watchListItem = await prisma.watchListItem.create({
        data: {
          ...req.body,
          userId: user.id,
        },
      });
      return sendSuccess(res, { watchListItem }, 201);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002')
          throw new AppError('Movie already in the watchlist', 409);
        if (err.code === 'P2003') throw new AppError('Movie not found', 404);
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

    const watchListItem = await prisma.watchListItem.update({
      where: { id: req.params.id },
      data: req.body,
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

  return {
    getWatchlist,
    getWatchlistItem,
    addToWatchlist,
    updateWatchlist,
    removeFromWatchlist,
  };
};
