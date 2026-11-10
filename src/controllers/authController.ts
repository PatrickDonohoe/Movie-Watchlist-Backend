import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken.js';
import type {
  LoginInput,
  LoginReturn,
  LogoutReturn,
  RegistrationInput,
} from '../validators/authValidators.js';
import { ApiResponse } from '../types/api.js';
import { sendSuccess } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

const register = async (
  req: Request<{}, ApiResponse<LoginReturn>, RegistrationInput>,
  res: Response
) => {
  // Destructuring the body to access the data sent in the request.
  const { name, email, password } = req.body;

  // Check if user already exists - many methods available through prisma
  const userExists = await prisma.user.findUnique({
    where: { email: email },
  });

  if (userExists) throw new AppError('User already exists with this email', 400);

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create User
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // Generate jwt token
  const token = generateToken(user.id, res);

  res.status(201).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: name, // name and email data come from body
        email: email,
      },
      token,
    },
  });
};

const login = async (
  req: Request<{}, ApiResponse<LoginReturn>, LoginInput>,
  res: Response<ApiResponse<LoginReturn>>
) => {
  const { email, password } = req.body;

  // Check if user email exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate jwt token
  const token = generateToken(user.id, res);

  return sendSuccess(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  });
};

const logout = async (
  _req: Request,
  res: Response<ApiResponse<LogoutReturn>>
) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({
    status: 'success',
    data: {
      message: 'Logged out successfully',
    },
  });
};

export { register, login, logout };
