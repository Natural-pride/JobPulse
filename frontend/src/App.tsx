import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OpportunityList from './pages/OpportunityList';
import OpportunityForm from './pages/OpportunityForm';
import OpportunityDetail from './pages/OpportunityDetail';
import OpportunityImport from './pages/OpportunityImport';
import Calendar from './pages/Calendar';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="opportunities" element={<OpportunityList />} />
          <Route path="opportunities/import" element={<OpportunityImport />} />
          <Route path="opportunities/new" element={<OpportunityForm />} />
          <Route path="opportunities/:id" element={<OpportunityDetail />} />
          <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
