// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserRepository, getRoleRepository } from '@/lib/db';
import { verifyAuth, hasRole, hashPassword } from '@/lib/auth';
import { invalidateCache } from '@/lib/redis/apiCache';
import { invalidateUserSession } from '@/lib/redis/sessionCache';
import { In } from 'typeorm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check if user is admin or requesting their own profile
  if (!hasRole(authResult.user, 'admin') && authResult.user.id !== params.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const userRepo = getUserRepository();
    const user = await userRepo.findOne({
      where: { id: params.id },
      relations: ['roles'],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((role) => role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check if user is admin or updating their own profile
  const isAdmin = hasRole(authResult.user, 'admin');
  if (!isAdmin && authResult.user.id !== params.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const userRepo = getUserRepository();

    const user = await userRepo.findOne({
      where: { id: params.id },
      relations: ['roles'],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update basic fields
    if (body.name) {
      user.name = body.name;
    }

    // Only admin can update email and roles
    if (isAdmin) {
      if (body.email) {
        user.email = body.email;
      }

      // Update roles if provided
      if (body.roles && Array.isArray(body.roles) && body.roles.length > 0) {
        const roleRepo = getRoleRepository();
        user.roles = await roleRepo.find({
          where: { name: In(body.roles) },
        });
      }
    }

    // Update password if provided
    if (body.password) {
      user.passwordHash = await hashPassword(body.password);
    }

    await userRepo.save(user);

    // Invalidate user session if roles or password changed
    if (body.roles || body.password) {
      await invalidateUserSession(user.id);
    }

    // Invalidate cache
    await invalidateCache(`api:*/users/${user.id}*`);
    await invalidateCache('api:*/users*');

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((role) => role.name),
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Only admin can delete users
  if (!hasRole(authResult.user, 'admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const userRepo = getUserRepository();
    const user = await userRepo.findOneBy({ id: params.id });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await userRepo.remove(user);

    // Invalidate user session
    await invalidateUserSession(user.id);

    // Invalidate cache
    await invalidateCache('api:*/users*');

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
