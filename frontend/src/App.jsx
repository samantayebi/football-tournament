import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';
import BracketPage      from './pages/public/BracketPage';
import StandingsPage    from './pages/public/StandingsPage';
import ReportPage       from './pages/public/ReportPage';
import LoginPage        from './pages/admin/LoginPage';
import EnrollmentPage   from './pages/admin/EnrollmentPage';
import BracketAdminPage from './pages/admin/BracketAdminPage';
import ResultEntryPage  from './pages/admin/ResultEntryPage';

function Navbar() {
  const { token, logout } = useAuth();
  return (
    <nav>
      <div className="nav-left">
        <NavLink to="/">Bracket</NavLink>
        <NavLink to="/standings">Standings</NavLink>
      </div>
      <div className="nav-right">
        {token ? (
          <>
            <NavLink to="/admin/enrollment">Enrollment</NavLink>
            <NavLink to="/admin/bracket">Bracket Admin</NavLink>
            <NavLink to="/admin/results">Results</NavLink>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login">Admin Login</NavLink>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/"                 element={<BracketPage />} />
            <Route path="/standings"        element={<StandingsPage />} />
            <Route path="/report/:matchId"  element={<ReportPage />} />
            <Route path="/login"            element={<LoginPage />} />
            <Route path="/admin/enrollment" element={<ProtectedRoute><EnrollmentPage /></ProtectedRoute>} />
            <Route path="/admin/bracket"    element={<ProtectedRoute><BracketAdminPage /></ProtectedRoute>} />
            <Route path="/admin/results"    element={<ProtectedRoute><ResultEntryPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
