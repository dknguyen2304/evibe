// src/app/api/episodes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeRepository, getMovieRepository } from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { invalidateMovieCache } from '@/lib/redis/movieCache';
import { Episode } from '@/lib/db/entities/Episode';

export async function GET(req: NextRequest) {
  return cacheApiResponse(req, async () => {
    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    const episodeRepo = getEpisodeRepository();
    const episodes = await episodeRepo.find({
      where: { movie: { id: movieId } },
      order: {
        seasonNumber: 'ASC',
        episodeNumber: 'ASC',
      },
    });

    return NextResponse.json(episodes);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    const episodeRepo = getEpisodeRepository();
    const movieRepo = getMovieRepository();

    const movie = await movieRepo.findOneBy({ id: body.movieId });
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    const episode = new Episode();
    episode.title = body.title;
    episode.episodeNumber = body.episodeNumber;
    episode.seasonNumber = body.seasonNumber || 1;
    episode.duration = body.duration;
    episode.description = body.description;
    episode.thumbnailUrl = body.thumbnailUrl;
    episode.videoUrl = body.videoUrl;
    episode.movie = movie;

    await episodeRepo.save(episode);

    // Invalidate caches
    await invalidateMovieCache(movie.id);
    await invalidateCache(`api:*/episodes?movieId=${movie.id}*`);

    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    console.error('Error creating episode:', error);
    return NextResponse.json({ error: 'Failed to create episode' }, { status: 500 });
  }
}
