import "dotenv/config.js"
import z from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.url(),
  DATABASE_URL_POOLED: z.url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be at least 32 characters.'),

  // Lifetime in SECONDS. .env values are always string, so coerce to a number.
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(60 * 60 * 24 * 7)
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:\n' + z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;