import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

const Dashboard           = lazy(() => import('./pages/Dashboard'));
const Templates           = lazy(() => import('./pages/Templates'));
const Grants              = lazy(() => import('./pages/Grants'));
const Budget              = lazy(() => import('./pages/Budget'));
const PaymentRequests     = lazy(() => import('./pages/PaymentRequests'));
const TravelRequests      = lazy(() => import('./pages/TravelRequests'));
const GiftCardDistributions = lazy(() => import('./pages/GiftCardDistributions'));
const Workflows           = lazy(() => import('./pages/Workflows'));
const Meetings            = lazy(() => import('./pages/Meetings'));
const Documents           = lazy(() => import('./pages/Documents'));
const QuickToDo           = lazy(() => import('./pages/QuickToDo'));
const KnowledgeBase       = lazy(() => import('./pages/KnowledgeBase'));
const CalendarView        = lazy(() => import('./pages/CalendarView'));
const Personnel           = lazy(() => import('./pages/Personnel'));
const Settings            = lazy(() => import('./pages/Settings'));
const TaskLauncher        = lazy(() => import('./pages/TaskLauncher'));
const ReplyQueue          = lazy(() => import('./pages/ReplyQueue'));
const Studio              = lazy(() => import('./pages/Studio'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <Layout>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"                element={<Dashboard />} />
                  <Route path="/grants"          element={<Grants />} />
                  <Route path="/budget"          element={<Budget />} />
                  <Route path="/payment-requests" element={<PaymentRequests />} />
                  <Route path="/travel-requests" element={<TravelRequests />} />
                  <Route path="/gift-cards"      element={<GiftCardDistributions />} />
                  <Route path="/workflows"       element={<Workflows />} />
                  <Route path="/meetings"        element={<Meetings />} />
                  <Route path="/templates"       element={<Templates />} />
                  <Route path="/documents"       element={<Documents />} />
                  <Route path="/quick-todo"      element={<QuickToDo />} />
                  <Route path="/knowledge"       element={<KnowledgeBase />} />
                  <Route path="/calendar"        element={<CalendarView />} />
                  <Route path="/personnel"       element={<Personnel />} />
                  <Route path="/tasks"           element={<TaskLauncher />} />
                  <Route path="/reply-queue"     element={<ReplyQueue />} />
                  <Route path="/studio"          element={<Studio />} />
                  <Route path="/settings"        element={<Settings />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Layout>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
