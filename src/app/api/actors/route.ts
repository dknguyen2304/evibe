// src/app/api/actors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getActorRepository } from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { Actor } from '@/lib/db/entities/Actor';

export async function GET(req: NextRequest) {
  return cacheApiResponse(req, async () => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const actorRepo = getActorRepository();
    let query = actorRepo.createQueryBuilder('actor');

    // Apply search filter
    if (search) {
      query = query.where('actor.name ILIKE :search', { search: `%${search}%` });
    }

    // Get total count for pagination
    const total = await query.getCount();

    // Get paginated results
    const actors = await query.orderBy('actor.name', 'ASC').skip(skip).take(limit).getMany();

    return NextResponse.json({
      data: actors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const actorRepo = getActorRepository();
    const actor = new Actor();
    actor.name = body.name;
    actor.slug = body.slug;
    actor.photoUrl = body.photoUrl;
    actor.bio = body.bio;

    await actorRepo.save(actor);

    // Invalidate cache
    await invalidateCache('api:*/actors*');

    return NextResponse.json(actor, { status: 201 });
  } catch (error) {
    console.error('Error creating actor:', error);
    return NextResponse.json({ error: 'Failed to create actor' }, { status: 500 });
  }
}
