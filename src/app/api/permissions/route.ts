// src/app/api/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPermissionRepository } from '@/lib/db';
import { verifyAuth, hasRole } from '@/lib/auth';
import { cacheApiResponse } from '@/lib/redis/apiCache';

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
    const permissionRepo = getPermissionRepository();
    const permissions = await permissionRepo.find({
      order: { name: 'ASC' },
    });

    return NextResponse.json(permissions);
  });
}
