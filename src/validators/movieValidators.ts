import z from 'zod';

export const MovieSchema = z.object({
  title: z
    .string()
    .min(1, 'Title must be between 1 and 50 characters.')
    .max(50, 'Title must be between 1 and 50 characters.'),
  overview: z
    .string()
    .max(500, 'Overview must be less than 500 characters.')
    .optional(),
  releaseYear: z.int(),
  genres: z.array(z.string()),
  runtime: z.int().optional(),
  posterUrl: z.url().optional(),
});

export type MovieSubmit = z.infer<typeof MovieSchema>;
