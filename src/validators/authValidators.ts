import z from 'zod';

// Schemas:
const UserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  password: z.string(),
});

const RegistrationSchema = UserSchema.omit({ id: true });

const LoginSchema = UserSchema.pick({ email: true, password: true });

// Types:
type UserType = z.infer<typeof UserSchema>;

type RegistrationInput = z.infer<typeof RegistrationSchema>;

type LoginInput = z.infer<typeof LoginSchema>;

type LoginReturn = {
  user: Omit<UserType, 'password'>;
  token: string;
};

type LogoutReturn = { message: string }

export {
  UserSchema,
  RegistrationSchema,
  LoginSchema,
  type UserType,
  type RegistrationInput,
  type LoginReturn,
  type LoginInput,
  type LogoutReturn
};
