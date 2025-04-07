// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { registerUser, generateToken } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { email, password, name } = body;

    // Register user
    try {
      const user = await registerUser(email, password, name);

      // Generate token
      const token = await generateToken(user);

      return NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles.map((role) => role.name),
          },
          token,
        },
        { status: 201 },
      );
    } catch (error: any) {
      if (error.message === 'User already exists') {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
