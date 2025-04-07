// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCategoryRepository } from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { Category } from '@/lib/db/entities/Category';

export async function GET(req: NextRequest) {
  return cacheApiResponse(req, async () => {
    const categoryRepo = getCategoryRepository();
    const categories = await categoryRepo.find({
      order: { name: 'ASC' },
    });

    return NextResponse.json(categories);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const categoryRepo = getCategoryRepository();
    const category = new Category();
    category.name = body.name;
    category.slug = body.slug;
    category.description = body.description;

    await categoryRepo.save(category);

    // Invalidate cache
    await invalidateCache('api:*/categories*');

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
