import z from "zod";

export const AddToWatchlistSchema = z.object({
  movieId: z.uuid(),
  status: z
    .enum(["PLANNED", "WATCHING", "COMPLETED", "DROPPED"], {
      error: () => ({
        message:
          "Status must be one of: PLANNED, WATCHING, COMPLETED, or DROPPED",
      }),
    })
    .optional(),
  rating: z.coerce
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 10")
    .max(10, "Rating must be between 1 and 10")
    .optional(),
  notes: z.string().optional(),
});

export const UpdateWatchlistSchema = AddToWatchlistSchema.omit({ movieId: true });

export type AddToWatchlistInput = z.infer<typeof AddToWatchlistSchema>;

export type UpdateWatchlistInput = z.infer<typeof UpdateWatchlistSchema>;