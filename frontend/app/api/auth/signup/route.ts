import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom API Route for Enhanced Signup
 * 
 * This is an example of how you could use the Better Auth server-side API
 * for more advanced signup handling, based on the Better Auth API documentation.
 * 
 * Currently, your client-side approach with signUp.email() is working well.
 * This would be useful if you need server-side validation or custom business logic.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, proxy to your existing Better Auth endpoint
    // In the future, you could use the server-side auth.api methods here
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    
    const response = await fetch(`${backendUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'user-agent': request.headers.get('user-agent') || '',
        'x-real-ip': request.headers.get('x-real-ip') || '',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        name: body.name,
        firstName: body.firstName,
        lastName: body.lastName,
        image: body.image,
        role: body.role || 'cashier',
        employeeId: body.employeeId || '',
        isActive: body.isActive ?? true,
        maxDiscountAllowed: body.maxDiscountAllowed || 0,
        canSellBelowMin: body.canSellBelowMin || false,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message || 'Registration failed'
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true, 
      user: result.user 
    });

  } catch (error) {
    console.error('Signup API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Registration failed. Please try again.' 
      },
      { status: 500 }
    );
  }
}
