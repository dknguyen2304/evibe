// src/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { getUserRepository, getRoleRepository, getDbConnection } from './db';
import { User } from './db/entities/User';
import {
  cacheUserSession,
  getCachedUserSession,
  invalidateUserSession,
} from './redis/sessionCache';
import * as bcrypt from 'bcryptjs';

// Secret key for JWT
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
};

// JWT expiration time
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export async function generateToken(user: User): Promise<string> {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles.map((role) => role.name),
  };

  // Cache user session data
  await cacheUserSession(user.id, payload);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(await getJwtSecret());
}

// Verify JWT token
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, await getJwtSecret());
    return {
      isValid: true,
      payload,
    };
  } catch (error) {
    return {
      isValid: false,
      error,
    };
  }
}

// Authentication middleware
export async function verifyAuth(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false, error: 'No token provided' };
    }

    const token = authHeader.split(' ')[1];
    const { isValid, payload, error } = await verifyToken(token);

    if (!isValid || !payload) {
      return { isAuthenticated: false, error };
    }

    // Try to get user data from cache first
    const cachedUser = await getCachedUserSession(payload.id as string);
    if (cachedUser) {
      return {
        isAuthenticated: true,
        user: cachedUser,
      };
    }

    // If not in cache, get from database
    const userRepo = await getUserRepository();
    const user = await userRepo.findOne({
      where: { id: payload.id as string },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      return { isAuthenticated: false, error: 'User not found' };
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((role) => role.name),
      permissions: user.roles.flatMap((role) =>
        role.permissions.map((permission) => permission.name),
      ),
    };

    // Cache user session data
    await cacheUserSession(user.id, userData);

    return {
      isAuthenticated: true,
      user: userData,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { isAuthenticated: false, error };
  }
}

// Check if user has required role
export function hasRole(user: any, requiredRole: string): boolean {
  return user.roles.includes(requiredRole);
}

// Check if user has required permission
export function hasPermission(user: any, requiredPermission: string): boolean {
  return user.permissions.includes(requiredPermission);
}

// Register new user
export async function registerUser(email: string, password: string, name: string): Promise<User> {
  const userRepo = await getUserRepository();
  const roleRepo = await getRoleRepository();

  // Check if user already exists
  const existingUser = await userRepo.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Get default user role
  const userRole = await roleRepo.findOne({
    where: { name: 'user' },
    relations: ['permissions'],
  });

  if (!userRole) {
    throw new Error('Default user role not found');
  }

  // Create new user
  const user = new User();
  user.email = email;
  user.name = name;
  user.passwordHash = await hashPassword(password);
  user.roles = [userRole];

  await userRepo.save(user);
  return user;
}

// Login user
export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  const userRepo = await getUserRepository();

  // Find user with password (need to explicitly select password)
  const user = await userRepo
    .createQueryBuilder('user')
    .addSelect('user.passwordHash')
    .leftJoinAndSelect('user.roles', 'roles')
    .leftJoinAndSelect('roles.permissions', 'permissions')
    .where('user.email = :email', { email })
    .getOne();

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = await generateToken(user);

  return { user, token };
}

// Logout user
export async function logoutUser(userId: string): Promise<void> {
  // Invalidate user session in cache
  await invalidateUserSession(userId);
}
