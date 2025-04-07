// src/app/api/movies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getMovieRepository,
  getCategoryRepository,
  getCountryRepository,
  getThemeRepository,
} from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { cacheMovieData, getCachedMovie, invalidateMovieCache } from '@/lib/redis/movieCache';
import { In } from 'typeorm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return cacheApiResponse(req, async () => {
    const id = params.id;

    // Try to get from movie-specific cache
    const cachedMovie = await getCachedMovie(id);
    if (cachedMovie) {
      return NextResponse.json(cachedMovie);
    }

    const movieRepo = getMovieRepository();
    const movie = await movieRepo.findOne({
      where: { id },
      relations: [
        'categories',
        'country',
        'themes',
        'actors',
        'comments',
        'comments.user',
        'ratings',
      ],
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Cache the movie data
    await cacheMovieData(id, movie);

    return NextResponse.json(movie);
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();

    const movieRepo = getMovieRepository();
    const categoryRepo = getCategoryRepository();
    const countryRepo = getCountryRepository();
    const themeRepo = getThemeRepository();

    const movie = await movieRepo.findOne({
      where: { id },
      relations: ['categories', 'country', 'themes'],
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Update fields
    movie.title = body.title ?? movie.title;
    movie.slug = body.slug ?? movie.slug;
    movie.description = body.description ?? movie.description;
    movie.releaseYear = body.releaseYear ?? movie.releaseYear;
    movie.duration = body.duration ?? movie.duration;
    movie.imdbRating = body.imdbRating ?? movie.imdbRating;
    movie.posterUrl = body.posterUrl ?? movie.posterUrl;
    movie.bannerUrl = body.bannerUrl ?? movie.bannerUrl;
    movie.trailerUrl = body.trailerUrl ?? movie.trailerUrl;
    movie.videoUrl = body.videoUrl ?? movie.videoUrl;
    movie.isFeatured = body.isFeatured ?? movie.isFeatured;
    movie.type = body.type ?? movie.type;
    movie.totalEpisodes = body.totalEpisodes ?? movie.totalEpisodes;

    // Update categories
    if (body.categories && body.categories.length > 0) {
      movie.categories = await categoryRepo.find({
        where: { id: In(body.categories) },
      });
    }

    // Update country
    if (body.country) {
      const country = await countryRepo.findOneBy({ id: body.country });
      if (country) {
        movie.country = country;
      }
    }

    // Update themes
    if (body.themes && body.themes.length > 0) {
      movie.themes = await themeRepo.find({
        where: { id: In(body.themes) },
      });
    }

    await movieRepo.save(movie);

    // Invalidate caches
    await invalidateMovieCache(id);
    await invalidateCache('api:*/movies*');

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json({ error: 'Failed to update movie' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const movieRepo = getMovieRepository();
    const movie = await movieRepo.findOneBy({ id });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    await movieRepo.remove(movie);

    // Invalidate caches
    await invalidateMovieCache(id);
    await invalidateCache('api:*/movies*');

    return NextResponse.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    return NextResponse.json({ error: 'Failed to delete movie' }, { status: 500 });
  }
}
