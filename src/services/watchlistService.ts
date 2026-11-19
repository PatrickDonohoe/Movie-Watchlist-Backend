import { Prisma } from '@prisma/client';

import type { AppDeps } from '../app.js';
import { AppError } from '../utils/AppError.js';
import type {
  AddToWatchlistInput,
  UpdateWatchlistInput,
} from '../validators/watchlistValidators.js';

export const createWatchlistService = ({ prisma }: AppDeps) => {
  const findOwnedItem = async (itemId: string, userId: string) => {
    const item = await prisma.watchListItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new AppError('Watchlist item not found', 'NOT_FOUND');
    if (item.userId !== userId)
      throw new AppError('Not allowed to modify this item', 'FORBIDDEN');
    return item;
  };

  const listForUser = (userId: string) =>
    prisma.watchListItem.findMany({
      where: { userId },
    });

  const addItem = async (userId: string, input: AddToWatchlistInput) => {
    try {
      return await prisma.watchListItem.create({ data: { ...input, userId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002')
          throw new AppError('Movie already in the watchlist', 'CONFLICT');
        if (err.code === 'P2003')
          throw new AppError('Movie not found', 'NOT_FOUND');
      }
      throw err;
    }
  };

  const updateItem = async (
    userId: string,
    itemId: string,
    input: UpdateWatchlistInput
  ) => {
    await findOwnedItem(itemId, userId);
    return await prisma.watchListItem.update({
      where: { id: itemId },
      data: input,
    });
  };

  const removeItem = async (userId: string, itemId: string) => {
    await findOwnedItem(itemId, userId);
    return prisma.watchListItem.delete({ where: { id: itemId } });
  };

  return { findOwnedItem, listForUser, addItem, updateItem, removeItem };
};

export type WatchListService = ReturnType<typeof createWatchlistService>;
