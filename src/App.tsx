import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './common/contexts/AppContext.tsx';
import AppLayout from './common/components/AppLayout.tsx';
import DashboardPage from './features/dashboard/DashboardPage.tsx';
import IncomePage from './features/income/IncomePage.tsx';
import ExpensesPage from './features/expenses/ExpensesPage.tsx';
import AccountsPage from './features/accounts/AccountsPage.tsx';
import PayoffPlanPage from './features/payoff/PayoffPlanPage.tsx';
import PaymentSchedulePage from './features/schedule/PaymentSchedulePage.tsx';
import StrategyPage from './features/strategy/StrategyPage.tsx';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/schedule" element={<PaymentSchedulePage />} />
            <Route path="/payoff" element={<PayoffPlanPage />} />
            <Route path="/strategy" element={<StrategyPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
