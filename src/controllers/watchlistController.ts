import type { Request, Response } from 'express';
import { type WatchListItem } from '@prisma/client';
import { requireUser } from '../utils/requireUser.js';
import { sendSuccess } from '../utils/respond.js';
import type { ApiResponse } from '../types/api.js';
import type {
  AddToWatchlistInput,
  UpdateWatchlistInput,
} from '../validators/watchlistValidators.js';
import { type WatchListService } from '../services/watchlistService.js';

type ItemParams = { id: string };
type ItemData = { watchListItem: WatchListItem };
type WatchList = { watchlist: WatchListItem[] };

export const createWatchlistController = (watchlist: WatchListService) => {
  const getWatchlist = async (
    req: Request<{}, ApiResponse<WatchList>>,
    res: Response<ApiResponse<WatchList>>
  ) => {
    const user = requireUser(req);

    sendSuccess(res, { watchlist: await watchlist.listForUser(user.id) });
  };

  const getWatchlistItem = async (
    req: Request<ItemParams, ApiResponse<ItemData>>,
    res: Response<ApiResponse<ItemData>>
  ) => {
    const user = requireUser(req);

    sendSuccess(res, {
      watchListItem: await watchlist.findOwnedItem(req.params.id, user.id),
    });
  };

  const addToWatchlist = async (
    req: Request<{}, ApiResponse<ItemData>, AddToWatchlistInput>,
    res: Response<ApiResponse<ItemData>>
  ) => {
    const user = requireUser(req);
    const watchListItem = await watchlist.addItem(user.id, req.body);
    sendSuccess(res, { watchListItem }, 201);
  };

  const updateWatchlist = async (
    req: Request<ItemParams, ApiResponse<ItemData>, UpdateWatchlistInput>,
    res: Response<ApiResponse<ItemData>>
  ) => {
    const user = requireUser(req);
    
    const watchListItem = await watchlist.updateItem(
      user.id,
      req.params.id,
      req.body
    );

    sendSuccess(res, { watchListItem });
  };

  const removeFromWatchlist = async (
    req: Request<ItemParams>,
    res: Response<ApiResponse<{ message: string }>>
  ) => {
    const user = requireUser(req);

    await watchlist.removeItem(user.id, req.params.id)

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
