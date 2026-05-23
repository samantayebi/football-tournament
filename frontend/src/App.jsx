import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth, useTheme } from './context/AuthContext';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import ProtectedRoute    from './components/ProtectedRoute';
import LandingPage       from './pages/public/LandingPage';
import BracketPage       from './pages/public/BracketPage';
import StandingsPage     from './pages/public/StandingsPage';
import ReportPage        from './pages/public/ReportPage';
import LoginPage         from './pages/admin/LoginPage';
import EnrollmentPage    from './pages/admin/EnrollmentPage';
import BracketAdminPage  from './pages/admin/BracketAdminPage';
import ResultEntryPage   from './pages/admin/ResultEntryPage';
import TournamentsPage   from './pages/admin/TournamentsPage';

function Navbar() {
  const { token, logout }          = useAuth();
  const { theme, toggleTheme }     = useTheme();
  const { tournaments, selectedId, setSelectedId } = useTournament();

  return (
    <nav>
      <div className="nav-left">
        <NavLink to="/">Home</NavLink>
        {tournaments.length > 0 && (
          <select
            className="tournament-select"
            value={selectedId || ''}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <NavLink to="/bracket">Bracket</NavLink>
        <NavLink to="/standings">Standings</NavLink>
      </div>
      <div className="nav-right">
        {token ? (
          <>
            <NavLink to="/admin/tournaments">Tournaments</NavLink>
            <NavLink to="/admin/enrollment">Enrollment</NavLink>
            <NavLink to="/admin/bracket">Bracket Admin</NavLink>
            <NavLink to="/admin/results">Results</NavLink>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login">Admin Login</NavLink>
        )}
        <button
          onClick={toggleTheme}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#ccd6f6' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <BrowserRouter>
          <Navbar />
          <main>
            <Routes>
              <Route path="/"                    element={<LandingPage />} />
              <Route path="/bracket"             element={<BracketPage />} />
              <Route path="/standings"           element={<StandingsPage />} />
              <Route path="/report/:matchId"     element={<ReportPage />} />
              <Route path="/login"               element={<LoginPage />} />
              <Route path="/admin/tournaments"   element={<ProtectedRoute><TournamentsPage /></ProtectedRoute>} />
              <Route path="/admin/enrollment"    element={<ProtectedRoute><EnrollmentPage /></ProtectedRoute>} />
              <Route path="/admin/bracket"       element={<ProtectedRoute><BracketAdminPage /></ProtectedRoute>} />
              <Route path="/admin/results"       element={<ProtectedRoute><ResultEntryPage /></ProtectedRoute>} />
            </Routes>
          </main>
        </BrowserRouter>
      </TournamentProvider>
    </AuthProvider>
  );
}
