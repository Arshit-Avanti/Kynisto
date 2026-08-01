import KynistoWalletView from '@/components/wallet/KynistoWalletView';

export const metadata = {
  title: 'My Wallet | Kynisto',
  description: 'Manage your Kynisto Points, Store Loyalty, and Memberships.',
};

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-fixed bg-opacity-20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 z-0"></div>
      
      <div className="relative z-10">
        <KynistoWalletView />
      </div>
    </div>
  );
}
