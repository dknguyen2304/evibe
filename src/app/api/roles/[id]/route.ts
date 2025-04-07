// src/app/api/roles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRoleRepository, getPermissionRepository } from '@/lib/db';
import { verifyAuth, hasRole } from '@/lib/auth';
import { invalidateCache } from '@/lib/redis/apiCache';
import { In } from 'typeorm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    const roleRepo = getRoleRepository();
    const role = await roleRepo.findOne({
      where: { id: params.id },
      relations: ['permissions'],
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    const roleRepo = getRoleRepository();
    const permissionRepo = getPermissionRepository();

    const role = await roleRepo.findOne({
      where: { id: params.id },
      relations: ['permissions'],
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Prevent modification of built-in roles
    if (['admin', 'user'].includes(role.name) && body.name && body.name !== role.name) {
      return NextResponse.json({ error: 'Cannot modify name of built-in roles' }, { status: 403 });
    }

    // Update fields
    if (body.name) {
      role.name = body.name;
    }

    if (body.description !== undefined) {
      role.description = body.description;
    }

    // Update permissions if provided
    if (body.permissions && Array.isArray(body.permissions)) {
      role.permissions = await permissionRepo.find({
        where: { name: In(body.permissions) },
      });
    }

    await roleRepo.save(role);

    // Invalidate cache
    await invalidateCache(`api:*/roles/${role.id}*`);
    await invalidateCache('api:*/roles*');

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    const roleRepo = getRoleRepository();
    const role = await roleRepo.findOneBy({ id: params.id });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Prevent deletion of built-in roles
    if (['admin', 'user'].includes(role.name)) {
      return NextResponse.json({ error: 'Cannot delete built-in roles' }, { status: 403 });
    }

    await roleRepo.remove(role);

    // Invalidate cache
    await invalidateCache('api:*/roles*');

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
