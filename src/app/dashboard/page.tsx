import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getDashboardData } from '@/app/actions/dashboard';
import DashboardContainer from './DashboardContainer';

export default async function DashboardPage() {
  const session = await getSession();
  console.log("DASHBOARD GUARD - Session resolved:", session);

  // Guard: Ensure session exists and represents a vendor
  if (!session || session.role !== 'vendor') {
    console.log("DASHBOARD GUARD - Redirecting to /login due to invalid or missing session.");
    redirect('/login');
  }

  // Fetch initial dashboard dataset
  const res = await getDashboardData();
  console.log("DASHBOARD GUARD - getDashboardData result:", res);

  if (!res.success || !res.shop) {
    console.log("DASHBOARD GUARD - Redirecting to /login due to failed getDashboardData query.");
    // If shop does not exist or database failed, clear session and force login
    redirect('/login');
  }

  return (
    <DashboardContainer
      initialShop={res.shop}
      initialTimelineEvents={res.timelineEvents || []}
      initialConversations={res.conversations || []}
      initialStats={res.stats || {
        totalConversations: 0,
        closedSales: 0,
        conversionRate: 0,
        bestSeller: 'No data',
        mostRequestedOOS: 'No data',
        busiestHour: 'No data'
      }}
      initialJudgeMetrics={res.judgeMetrics}
      initialBusinesses={res.businesses || []}
      initialPayments={res.payments || []}
      initialExpenses={res.expenses || []}
    />
  );
}
