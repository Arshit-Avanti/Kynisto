import { NextResponse } from 'next/server';

export async function GET() {
  // Mock data for wallet
  const walletData = {
    kynistoPoints: {
      total: 3450,
      progress: 450, // Progress towards next 1000
      history: [
        { id: '1', date: '2026-07-28', description: 'Purchase at Store A', points: 50, type: 'earned' },
        { id: '2', date: '2026-07-25', description: 'Redeemed for Reward', points: -1000, type: 'redeemed' },
        { id: '3', date: '2026-07-20', description: 'Welcome Bonus', points: 500, type: 'earned' },
      ],
    },
    loyaltyPoints: [
      {
        storeId: 'store-1',
        storeName: 'Nike',
        logoUrl: 'https://via.placeholder.com/50?text=Nike',
        points: 2500,
        progress: 500, // towards 1000
        lastVisit: '2026-07-15',
        canRedeemDiscount: true,
      },
      {
        storeId: 'store-2',
        storeName: 'Starbucks',
        logoUrl: 'https://via.placeholder.com/50?text=S',
        points: 800,
        progress: 800, // towards 1000
        lastVisit: '2026-07-29',
        canRedeemDiscount: false,
      },
    ],
    memberships: {
      active: [
        { id: 'm-1', storeName: 'Gym Plus', type: 'Annual', validUntil: '2027-01-15', isKynistoPremium: true, invoiceUrl: '#' },
      ],
      expired: [
        { id: 'm-2', storeName: 'Spa Day', type: 'Monthly', validUntil: '2026-06-01', isKynistoPremium: false, invoiceUrl: '#' },
      ],
    },
  };

  return NextResponse.json(walletData);
}
