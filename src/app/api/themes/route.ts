// src/app/api/themes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getThemeRepository } from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { Theme } from '@/lib/db/entities/Theme';

export async function GET(req: NextRequest) {
  return cacheApiResponse(req, async () => {
    const themeRepo = getThemeRepository();
    const themes = await themeRepo.find({
      order: { name: 'ASC' },
    });

    return NextResponse.json(themes);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const themeRepo = getThemeRepository();
    const theme = new Theme();
    theme.name = body.name;
    theme.slug = body.slug;
    theme.description = body.description;

    await themeRepo.save(theme);

    // Invalidate cache
    await invalidateCache('api:*/themes*');

    return NextResponse.json(theme, { status: 201 });
  } catch (error) {
    console.error('Error creating theme:', error);
    return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
  }
}
