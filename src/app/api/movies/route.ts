// src/app/api/movies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getMovieRepository,
  getCategoryRepository,
  getCountryRepository,
  getThemeRepository,
} from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { cacheMovieList } from '@/lib/redis/movieCache';
import { Movie } from '@/lib/db/entities/Movie';
import { In, Like } from 'typeorm';

export async function GET(req: NextRequest) {
  return cacheApiResponse(req, async () => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const theme = searchParams.get('theme');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    const skip = (page - 1) * limit;

    const movieRepo = getMovieRepository();
    let query = movieRepo
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.categories', 'category')
      .leftJoinAndSelect('movie.country', 'country')
      .leftJoinAndSelect('movie.themes', 'theme');

    // Apply filters
    if (category) {
      query = query.andWhere('category.slug = :category', { category });
    }

    if (country) {
      query = query.andWhere('country.slug = :country', { country });
    }

    if (theme) {
      query = query.andWhere('theme.slug = :theme', { theme });
    }

    if (search) {
      query = query.andWhere('movie.title ILIKE :search', { search: `%${search}%` });
    }

    if (featured === 'true') {
      query = query.andWhere('movie.isFeatured = :featured', { featured: true });
    }

    // Get total count for pagination
    const total = await query.getCount();

    // Get paginated results
    const movies = await query.orderBy('movie.createdAt', 'DESC').skip(skip).take(limit).getMany();

    // Cache the results
    const cacheKey = `movies:${category || ''}:${country || ''}:${theme || ''}:${search || ''}:${featured || ''}:${page}:${limit}`;
    await cacheMovieList(cacheKey, movies);

    return NextResponse.json({
      data: movies,
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

    const movieRepo = getMovieRepository();
    const categoryRepo = getCategoryRepository();
    const countryRepo = getCountryRepository();
    const themeRepo = getThemeRepository();

    const movie = new Movie();
    movie.title = body.title;
    movie.slug = body.slug;
    movie.description = body.description;
    movie.releaseYear = body.releaseYear;
    movie.duration = body.duration;
    movie.imdbRating = body.imdbRating;
    movie.posterUrl = body.posterUrl;
    movie.bannerUrl = body.bannerUrl;
    movie.trailerUrl = body.trailerUrl;
    movie.videoUrl = body.videoUrl;
    movie.isFeatured = body.isFeatured || false;
    movie.type = body.type || 'movie';
    movie.totalEpisodes = body.totalEpisodes;

    // Set categories
    if (body.categories && body.categories.length > 0) {
      movie.categories = await categoryRepo.find({
        where: { id: In(body.categories) },
      });
    }

    // Set country
    if (body.country) {
      const country = await countryRepo.findOneBy({ id: body.country });
      if (country) {
        movie.country = country;
      }
    }

    // Set themes
    if (body.themes && body.themes.length > 0) {
      movie.themes = await themeRepo.find({
        where: { id: In(body.themes) },
      });
    }

    await movieRepo.save(movie);

    // Invalidate cache
    await invalidateCache('api:*/movies*');

    return NextResponse.json(movie, { status: 201 });
  } catch (error) {
    console.error('Error creating movie:', error);
    return NextResponse.json({ error: 'Failed to create movie' }, { status: 500 });
  }
}
