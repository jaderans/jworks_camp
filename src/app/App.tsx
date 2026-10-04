import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { AppProvider, useApp, type Permission } from './AppContext';
import { Shell } from './Shell';
import { SetupWizard } from '../features/setup/SetupWizard';
import { isSetupDone } from '../services/setup';
import { EmptyState, Loading } from '../components/ui';
import { usePwaUpdates } from './usePwa';
import { clearLanding, peekLanding } from './landing';
import { startSync } from '../sync/engine';
import { expireTrends, fetchFeed } from '../services/growth';

const JoinPage = lazy(() => import('../features/join/JoinPage').then((m) => ({ default: m.JoinPage })));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const CalendarPage = lazy(() => import('../features/calendar/CalendarPage'));
const BoardPage = lazy(() => import('../features/board/BoardPage'));
const IdeasPage = lazy(() => import('../features/ideas/IdeasPage'));
const CampaignsPage = lazy(() => import('../features/campaigns/CampaignsPage'));
const TrendsPage = lazy(() => import('../features/trends/TrendsPage'));
const ResultsPage = lazy(() => import('../features/results/ResultsPage'));
const AssistantPage = lazy(() => import('../features/assistant/AssistantPage'));
const ClientsPage = lazy(() => import('../features/clients/ClientsPage'));
const PackagesPage = lazy(() => import('../features/packages/PackagesPage'));
const ContractsPage = lazy(() => import('../features/contracts/ContractsPage'));
const TeamPage = lazy(() => import('../features/team/TeamPage'));
const MyTasksPage = lazy(() => import('../features/me/MyTasksPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const ActivityPage = lazy(() => import('../features/activity/ActivityPage'));

export function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Gate />
      </AppProvider>
    </HashRouter>
  );
}

function Gate() {
  const [done, setDone] = useState<boolean | null>(null);
  const location = useLocation();
  usePwaUpdates();
  useEffect(() => {
    isSetupDone().then(setDone);
  }, []);
  useEffect(() => {
    if (!done) return;
    void startSync();
    // The weekly trend report ships with the app; pick up a new one and retire stale trends.
    void fetchFeed();
    void expireTrends();
  }, [done]);
  if (done === null) return <Loading />;
  if (location.pathname === '/join')
    return (
      <Lazy>
        <JoinPage
          onJoined={() => {
            setDone(true);
            window.location.hash = '#/';
          }}
        />
      </Lazy>
    );
  if (!done) return <SetupWizard onDone={() => setDone(true)} />;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="calendar" element={<Guard perm="content"><Lazy><CalendarPage /></Lazy></Guard>} />
        <Route path="board" element={<Guard perm="content"><Lazy><BoardPage /></Lazy></Guard>} />
        <Route path="ideas/*" element={<Guard perm="content"><Lazy><IdeasPage /></Lazy></Guard>} />
        <Route path="campaigns/*" element={<Guard perm="content"><Lazy><CampaignsPage /></Lazy></Guard>} />
        <Route path="trends/*" element={<Guard perm="content"><Lazy><TrendsPage /></Lazy></Guard>} />
        <Route path="results" element={<Guard perm="content"><Lazy><ResultsPage /></Lazy></Guard>} />
        <Route path="assistant" element={<Guard perm="assistant"><Lazy><AssistantPage /></Lazy></Guard>} />
        <Route path="clients/*" element={<Guard perm="clients"><Lazy><ClientsPage /></Lazy></Guard>} />
        <Route path="packages/*" element={<Guard perm="money"><Lazy><PackagesPage /></Lazy></Guard>} />
        <Route path="contracts/*" element={<Guard perm="money"><Lazy><ContractsPage /></Lazy></Guard>} />
        <Route path="team" element={<Guard perm="team"><Lazy><TeamPage /></Lazy></Guard>} />
        <Route path="me" element={<Lazy><MyTasksPage /></Lazy>} />
        <Route path="activity" element={<Guard perm="activity"><Lazy><ActivityPage /></Lazy></Guard>} />
        <Route path="settings" element={<Lazy><SettingsPage /></Lazy>} />
        <Route path="*" element={<div className="page"><EmptyState title="Page not found">That link doesn&rsquo;t go anywhere in the app.</EmptyState></div>} />
      </Route>
    </Routes>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

function Home() {
  const app = useApp();
  // Decide once: later re-renders (sync status, live queries) must not change where we go.
  const [landing] = useState(() => peekLanding());
  useEffect(() => clearLanding(), []);
  if (landing && landing !== '/') return <Navigate to={landing} replace />;
  if (app.can('dashboard'))
    return (
      <Lazy>
        <DashboardPage />
      </Lazy>
    );
  return <Navigate to="/me" replace />;
}

function Guard({ perm, children }: { perm: Permission; children: ReactNode }) {
  const app = useApp();
  if (!app.can(perm)) {
    return (
      <div className="page narrow">
        <EmptyState title="Not available for your role">Ask the owner if you need this. Switch who&rsquo;s using this device from the top right.</EmptyState>
      </div>
    );
  }
  return <>{children}</>;
}
