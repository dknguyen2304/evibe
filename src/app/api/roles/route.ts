// src/app/api/roles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoleRepository, getPermissionRepository } from '@/lib/db';
import { verifyAuth, hasRole } from '@/lib/auth';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { Role } from '@/lib/db/entities/Role';
import { In } from 'typeorm';

export async function GET(req: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check if user has admin role
  if (!hasRole(authResult.user, 'admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return cacheApiResponse(req, async () => {
    const roleRepo = getRoleRepository();
    const roles = await roleRepo.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });

    return NextResponse.json(roles);
  });
}

export async function POST(req: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check if user has admin role
  if (!hasRole(authResult.user, 'admin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const roleRepo = getRoleRepository();
    const permissionRepo = getPermissionRepository();

    // Check if role already exists
    const existingRole = await roleRepo.findOne({
      where: { name: body.name },
    });

    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 409 });
    }

    const role = new Role();
    role.name = body.name;
    role.description = body.description || '';

    // Add permissions if provided
    if (body.permissions && Array.isArray(body.permissions) && body.permissions.length > 0) {
      role.permissions = await permissionRepo.find({
        where: { name: In(body.permissions) },
      });
    }

    await roleRepo.save(role);

    // Invalidate cache
    await invalidateCache('api:*/roles*');

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
