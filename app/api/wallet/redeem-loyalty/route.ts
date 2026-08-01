import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Deduct 1000 store loyalty points for ₹100 store discount coupon.
  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // In a real application, verify user has 1000 points for the specific store and deduct them.
    
    return NextResponse.json({
      success: true,
      message: 'Loyalty points redeemed successfully for ₹100 discount coupon!',
      couponCode: `DISCOUNT100-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      pointsDeducted: 1000,
      storeId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
