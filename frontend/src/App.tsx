import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OpportunityList from './pages/OpportunityList';
import OpportunityForm from './pages/OpportunityForm';
import OpportunityDetail from './pages/OpportunityDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="opportunities" element={<OpportunityList />} />
          <Route path="opportunities/new" element={<OpportunityForm />} />
          <Route path="opportunities/:id" element={<OpportunityDetail />} />
          <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
