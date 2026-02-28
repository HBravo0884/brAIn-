import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import Grants from './pages/Grants';
import Budget from './pages/Budget';
import PaymentRequests from './pages/PaymentRequests';
import TravelRequests from './pages/TravelRequests';
import GiftCardDistributions from './pages/GiftCardDistributions';
import Workflows from './pages/Workflows';
import Meetings from './pages/Meetings';
import Documents from './pages/Documents';
import QuickToDo from './pages/QuickToDo';
import KnowledgeBase from './pages/KnowledgeBase';
import CalendarView from './pages/CalendarView';
import Personnel from './pages/Personnel';
import Settings from './pages/Settings';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/grants" element={<Grants />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/payment-requests" element={<PaymentRequests />} />
            <Route path="/travel-requests" element={<TravelRequests />} />
            <Route path="/gift-cards" element={<GiftCardDistributions />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/quick-todo" element={<QuickToDo />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/personnel" element={<Personnel />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
