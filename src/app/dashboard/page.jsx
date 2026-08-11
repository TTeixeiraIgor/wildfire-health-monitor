import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/auth.js';
import { getFireOverview, getHealthAssessmentSummary, listGeocodedLocations } from '@/db.js';
import { DashboardView } from '@/components/dashboard-view.jsx';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [overview, recentLocations, healthSummary] = await Promise.all([
    getFireOverview(),
    listGeocodedLocations(6),
    getHealthAssessmentSummary(user.id)
  ]);

  return <DashboardView healthSummary={healthSummary} overview={overview} recentLocations={recentLocations} user={user} />;
}
