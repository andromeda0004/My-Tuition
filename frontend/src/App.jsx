import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import Layout from './components/layouts/Layout';

// Pages
import Dashboard from './pages/Dashboard';

// Placeholder components (will be implemented in future phases)
const Students = () => <div className="p-4"><h1 className="text-2xl font-bold mb-4">Students</h1><p>Student management will be implemented in the next phase.</p></div>;
const Attendance = () => <div className="p-4"><h1 className="text-2xl font-bold mb-4">Attendance</h1><p>Attendance tracking will be implemented in the next phase.</p></div>;
const Fees = () => <div className="p-4"><h1 className="text-2xl font-bold mb-4">Fees</h1><p>Fee management will be implemented in the next phase.</p></div>;
const Reports = () => <div className="p-4"><h1 className="text-2xl font-bold mb-4">Reports</h1><p>Reporting features will be implemented in the next phase.</p></div>;
const WhatsApp = () => <div className="p-4"><h1 className="text-2xl font-bold mb-4">WhatsApp Reminders</h1><p>WhatsApp integration will be implemented in the next phase.</p></div>;
const NotFound = () => <div className="p-4 text-center"><h1 className="text-3xl font-bold mb-4">404</h1><p>Page not found</p></div>;

function App() {
  return (
    <>
      <Routes>
        {/* Main layout with sidebar and navbar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="fees" element={<Fees />} />
          <Route path="reports" element={<Reports />} />
          <Route path="whatsapp" element={<WhatsApp />} />
          
          {/* Catch all other routes */}
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate replace to="/404" />} />
        </Route>
      </Routes>
      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;
