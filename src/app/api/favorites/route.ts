// src/app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFavoriteRepository, getMovieRepository, getUserRepository } from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { Favorite } from '@/lib/db/entities/Favorite';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuth(req);
  if (!authResult.isAuthenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  return cacheApiResponse(req, async () => {
    const favoriteRepo = getFavoriteRepository();
    const favorites = await favoriteRepo.find({
      where: { user: { id: authResult.user.id } },
      relations: ['movie', 'movie.categories', 'movie.country'],
      order: { createdAt: 'DESC' },
    });

    return NextResponse.json(favorites);
  });
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    const favoriteRepo = getFavoriteRepository();
    const movieRepo = getMovieRepository();
    const userRepo = getUserRepository();

    const movie = await movieRepo.findOneBy({ id: body.movieId });
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    const user = await userRepo.findOneBy({ id: authResult.user.id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already in favorites
    const existingFavorite = await favoriteRepo.findOne({
      where: {
        user: { id: user.id },
        movie: { id: movie.id },
      },
    });

    if (existingFavorite) {
      return NextResponse.json({ error: 'Movie already in favorites' }, { status: 400 });
    }

    const favorite = new Favorite();
    favorite.movie = movie;
    favorite.user = user;

    await favoriteRepo.save(favorite);

    // Invalidate cache
    await invalidateCache(`api:*/favorites*`);

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json({ error: 'Failed to add to favorites' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    const favoriteRepo = getFavoriteRepository();

    const favorite = await favoriteRepo.findOne({
      where: {
        user: { id: authResult.user.id },
        movie: { id: movieId },
      },
    });

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    await favoriteRepo.remove(favorite);

    // Invalidate cache
    await invalidateCache(`api:*/favorites*`);

    return NextResponse.json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json({ error: 'Failed to remove from favorites' }, { status: 500 });
  }
}
