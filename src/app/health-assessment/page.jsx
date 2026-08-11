import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/auth.js';
import { getHealthAssessmentSummary, listHealthAssessmentsByUser } from '@/db.js';
import { HealthAssessmentExperience } from '@/components/health-assessment-experience.jsx';

export default async function HealthAssessmentPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [summary, recentAssessments] = await Promise.all([
    getHealthAssessmentSummary(user.id),
    listHealthAssessmentsByUser(user.id, 4)
  ]);

  return <HealthAssessmentExperience recentAssessments={recentAssessments} summary={summary} user={user} />;
}
