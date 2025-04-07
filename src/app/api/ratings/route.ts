// src/app/api/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRatingRepository, getMovieRepository, getUserRepository } from '@/lib/db';
import { invalidateCache } from '@/lib/redis/apiCache';
import { invalidateMovieCache } from '@/lib/redis/movieCache';
import { addRating } from '@/lib/redis/stats';
import { Rating } from '@/lib/db/entities/Rating';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.movieId || !body.value) {
      return NextResponse.json(
        { error: 'Movie ID and rating value are required' },
        { status: 400 },
      );
    }

    // Validate rating value
    const ratingValue = parseFloat(body.value);
    if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) {
      return NextResponse.json({ error: 'Rating value must be between 0 and 10' }, { status: 400 });
    }

    const ratingRepo = getRatingRepository();
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

    // Check if user already rated this movie
    let rating = await ratingRepo.findOne({
      where: {
        user: { id: user.id },
        movie: { id: movie.id },
      },
    });

    if (rating) {
      // Update existing rating
      rating.value = ratingValue;
    } else {
      // Create new rating
      rating = new Rating();
      rating.value = ratingValue;
      rating.movie = movie;
      rating.user = user;
    }

    await ratingRepo.save(rating);

    // Update Redis rating stats
    await addRating(movie.id, ratingValue);

    // Invalidate caches
    await invalidateMovieCache(movie.id);
    await invalidateCache(`api:*/movies/${movie.id}*`);

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    return NextResponse.json({ error: 'Failed to create/update rating' }, { status: 500 });
  }
}
