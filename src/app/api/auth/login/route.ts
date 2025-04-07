// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    debugger;
    const body = await req.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = body;

    try {
      // Login user
      const { user, token } = await loginUser(email, password);

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles.map((role) => role.name),
        },
        token,
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
