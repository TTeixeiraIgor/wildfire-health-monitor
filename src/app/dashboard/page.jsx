import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/auth.js';
import { getFireOverview, listGeocodedLocations } from '@/db.js';
import { DashboardView } from '@/components/dashboard-view.jsx';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [overview, recentLocations] = await Promise.all([getFireOverview(), listGeocodedLocations(6)]);

  return <DashboardView overview={overview} recentLocations={recentLocations} user={user} />;
}
