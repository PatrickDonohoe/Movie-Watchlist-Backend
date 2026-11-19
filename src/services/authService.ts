import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import type { AppDeps } from '../app.js';
import { AppError } from '../utils/AppError.js';
import type {
  LoginInput,
  RegistrationInput,
} from '../validators/authValidators.js';

export const createAuthService = ({ prisma }: AppDeps) => {
  const addUser = async ({ name, email, password }: RegistrationInput) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      return await prisma.user.create({
        data: { name, email, password: hashedPassword },
        omit: { password: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new AppError('User already exists with that email', 'CONFLICT');
      }
      throw err;
    }
  };

  const loginUser = async ({ email, password }: LoginInput) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Invalid email or password', 'UNAUTHORIZED');
    }

    const { password: _pw, createdAt: _c, ...safeUser } = user;
    return safeUser; // strip password and createdAt
  };

  const deleteUser = async (userId: string) => {
    return await prisma.user.deleteMany({ where: { id: userId } });
  };

  return { addUser, loginUser, deleteUser };
};

export type AuthService = ReturnType<typeof createAuthService>;
