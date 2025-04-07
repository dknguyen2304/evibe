// src/app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCommentRepository, getMovieRepository, getUserRepository } from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { Comment } from '@/lib/db/entities/Comment';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  return cacheApiResponse(req, async () => {
    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    const commentRepo = getCommentRepository();
    const comments = await commentRepo.find({
      where: { movie: { id: movieId } },
      relations: ['user', 'parent'],
      order: { createdAt: 'DESC' },
    });

    return NextResponse.json(comments);
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

    if (!body.movieId || !body.content) {
      return NextResponse.json({ error: 'Movie ID and content are required' }, { status: 400 });
    }

    const commentRepo = getCommentRepository();
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

    const comment = new Comment();
    comment.content = body.content;
    comment.movie = movie;
    comment.user = user;

    // Handle reply to another comment
    if (body.parentId) {
      const parentComment = await commentRepo.findOneBy({ id: body.parentId });
      if (parentComment) {
        comment.parent = parentComment;
      }
    }

    await commentRepo.save(comment);

    // Invalidate cache
    await invalidateCache(`api:*/comments?movieId=${body.movieId}*`);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
