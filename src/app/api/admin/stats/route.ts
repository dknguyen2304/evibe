// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMovieRepository, getUserRepository, getViewRepository } from '@/lib/db';
import { verifyAuth, hasRole } from '@/lib/auth';
import { cacheApiResponse } from '@/lib/redis/apiCache';
import { getPopularMovies } from '@/lib/redis/leaderboard';
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

  return cacheApiResponse(
    req,
    async () => {
      const movieRepo = await getMovieRepository();
      const userRepo = await getUserRepository();
      const viewRepo = await getViewRepository();

      // Get total counts
      const totalMovies = await movieRepo.count();
      const totalUsers = await userRepo.count();
      const totalViews = await viewRepo.count();

      // Get recent movies
      const recentMovies = await movieRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
      });

      // Get popular movies from Redis leaderboard
      const popularMovieIds = await getPopularMovies(5);
      let popularMovies = [];

      if (popularMovieIds.length > 0) {
        popularMovies = await movieRepo.find({
          where: { id: In(popularMovieIds) },
        });

        // Sort by the order in popularMovieIds
        popularMovies.sort((a, b) => {
          return popularMovieIds.indexOf(a.id) - popularMovieIds.indexOf(b.id);
        });
      } else {
        // Fallback to database if Redis leaderboard is empty
        popularMovies = await movieRepo.find({
          order: { viewCount: 'DESC' },
          take: 5,
        });
      }

      return NextResponse.json({
        totalMovies,
        totalUsers,
        totalViews,
        recentMovies,
        popularMovies,
      });
    },
    60,
  ); // Cache for 1 minute
}
