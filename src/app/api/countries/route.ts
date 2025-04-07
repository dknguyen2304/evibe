// src/app/api/countries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCountryRepository } from '@/lib/db';
import { cacheApiResponse, invalidateCache } from '@/lib/redis/apiCache';
import { Country } from '@/lib/db/entities/Country';

export async function GET(req: NextRequest) {
  return cacheApiResponse(req, async () => {
    const countryRepo = getCountryRepository();
    const countries = await countryRepo.find({
      order: { name: 'ASC' },
    });

    return NextResponse.json(countries);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const countryRepo = getCountryRepository();
    const country = new Country();
    country.name = body.name;
    country.slug = body.slug;

    await countryRepo.save(country);

    // Invalidate cache
    await invalidateCache('api:*/countries*');

    return NextResponse.json(country, { status: 201 });
  } catch (error) {
    console.error('Error creating country:', error);
    return NextResponse.json({ error: 'Failed to create country' }, { status: 500 });
  }
}
