// src/app/api/views/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getViewRepository,
  getMovieRepository,
  getEpisodeRepository,
  getUserRepository,
} from '@/lib/db';
import { incrementViewCount } from '@/lib/redis/stats';
import { View } from '@/lib/db/entities/View';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication (optional)
    const authResult = await verifyAuth(req);
    const userId = authResult.isAuthenticated ? authResult.user.id : null;

    const body = await req.json();

    if (!body.movieId && !body.episodeId) {
      return NextResponse.json(
        { error: 'Either Movie ID or Episode ID is required' },
        { status: 400 },
      );
    }

    const viewRepo = getViewRepository();
    const movieRepo = getMovieRepository();
    const episodeRepo = getEpisodeRepository();
    const userRepo = getUserRepository();

    const view = new View();

    // Set user if authenticated
    if (userId) {
      const user = await userRepo.findOneBy({ id: userId });
      if (user) {
        view.user = user;
      }
    }

    // Set IP address and user agent
    view.ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    view.userAgent = req.headers.get('user-agent') || 'unknown';

    // Set movie or episode
    if (body.movieId) {
      const movie = await movieRepo.findOneBy({ id: body.movieId });
      if (!movie) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }
      view.movie = movie;

      // Increment movie view count in database
      movie.viewCount += 1;
      await movieRepo.save(movie);

      // Increment view count in Redis
      await incrementViewCount(movie.id);
    } else if (body.episodeId) {
      const episode = await episodeRepo.findOneBy({ id: body.episodeId });
      if (!episode) {
        return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
      }
      view.episode = episode;

      // Increment episode view count in database
      episode.viewCount += 1;
      await episodeRepo.save(episode);
    }

    await viewRepo.save(view);

    return NextResponse.json({ message: 'View recorded successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}
