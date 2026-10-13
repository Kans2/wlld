import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { ApiError } from '../utils/apiError';

interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: 'brand' | 'creator';
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

/**
 * Generate a JWT token for a user.
 */
const generateToken = (user: IUser): string => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
};

/**
 * Register a new user (brand or creator).
 */
export const signup = async (input: SignupInput): Promise<AuthResponse> => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  const user = await User.create(input);
  const token = generateToken(user);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Authenticate an existing user.
 */
export const login = async (input: LoginInput): Promise<AuthResponse> => {
  // Explicitly select password since it's excluded by default
  const user = await User.findOne({ email: input.email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(input.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Get user profile by ID.
 */
export const getProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};
