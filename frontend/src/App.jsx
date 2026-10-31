import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  LockKeyhole,
  LogOut,
  Pencil,
  Plane,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  createFlight,
  deleteFlight as removeFlight,
  getFlight,
  getFlights,
  signIn,
  signUp,
  syncFlights,
  updateFlight,
} from './api';

const formatDate = (value, options = {}) => {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return '--:--';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '--:--'
    : new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const getRoleFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role;
  } catch {
    return null;
  }
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('flight_token'));
  const navigate = useNavigate();
  const isAdmin = token ? getRoleFromToken(token) === 'admin' : false;

  const handleLogin = (newToken) => {
    localStorage.setItem('flight_token', newToken);
    setToken(newToken);
    navigate('/flights');
  };

  const handleLogout = () => {
    localStorage.removeItem('flight_token');
    setToken(null);
    navigate('/login');
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/flights" replace /> : <AuthPage mode="login" onLogin={handleLogin} />}
      />
      <Route
        path="/signup"
        element={token ? <Navigate to="/flights" replace /> : <AuthPage mode="signup" onLogin={handleLogin} />}
      />
      <Route
        path="/flights"
        element={token ? <FlightsPage token={token} isAdmin={isAdmin} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/manage"
        element={token && isAdmin ? <FlightsPage token={token} isAdmin onLogout={handleLogout} /> : <Navigate to="/flights" replace />}
      />
      <Route
        path="/flights/:id"
        element={token ? <FlightDetails token={token} isAdmin={isAdmin} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={token ? '/flights' : '/login'} replace />} />
    </Routes>
  );
}

function AuthPage({ mode, onLogin }) {
  const isSignup = mode === 'signup';
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (isSignup) {
        await signUp(email, password);
        setMessage('Account created. Sign in to explore flights.');
        navigate('/login', { replace: true, state: { message: 'Account created. Sign in to explore flights.' } });
      } else {
        const result = await signIn(email, password);
        const newToken = typeof result === 'string' ? result : result.token;
        if (!newToken) throw new Error('The server did not return an authentication token.');
        onLogin(newToken);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="brand brand-light" to="/login">
          <span className="brand-mark"><Plane size={19} fill="currentColor" /></span>
          <span>altitude<span className="brand-period">.</span></span>
        </Link>
        <div className="story-copy">
          <span className="eyebrow"><Sparkles size={14} /> YOUR NEXT JOURNEY STARTS HERE</span>
          <h1>Make room<br />for <em>somewhere</em><br />new.</h1>
          <p>Find your next flight, explore new routes, and make the journey part of the story.</p>
        </div>
        <div className="story-footer">
          <span><ShieldCheck size={16} /> Secure access</span>
          <span>Built for better journeys</span>
        </div>
        <div className="story-orbit orbit-one" />
        <div className="story-orbit orbit-two" />
      </section>

      <section className="auth-panel">
        <div className="auth-panel-top"><span>FLIGHT MANAGEMENT</span><span>01 — 02</span></div>
        <div className="auth-form-wrap">
          <div className="auth-icon"><Compass size={21} /></div>
          <p className="eyebrow auth-eyebrow">{isSignup ? 'START YOUR JOURNEY' : 'WELCOME ABOARD'}</p>
          <h2>{isSignup ? 'Create your account' : 'Good to have you back.'}</h2>
          <p className="auth-subtitle">
            {isSignup ? 'A new perspective is just a few details away.' : 'Sign in to pick up where your next trip begins.'}
          </p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <span><LockKeyhole size={12} /> Encrypted</span>
            </div>
            <input id="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {message && <p className="form-message success-message" role="status">{message}</p>}
            <button className="button button-dark auth-submit" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'New to Altitude?'}
            {' '}<Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link>
          </p>
        </div>
        <p className="auth-legal">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
      </section>
    </main>
  );
}

function AppShell({ children, isAdmin, onLogout }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/flights">
          <span className="brand-mark"><Plane size={18} fill="currentColor" /></span>
          <span>altitude<span className="brand-period">.</span></span>
        </Link>
        <nav className="top-nav">
          <NavLink to="/flights">Flight schedule</NavLink>
          {isAdmin && <NavLink to="/manage">Flight management</NavLink>}
        </nav>
        <button className="profile-button" onClick={onLogout} aria-label="Sign out">
          <span className="avatar">{isAdmin ? 'O' : 'T'}</span><span className="profile-name">{isAdmin ? 'Operations' : 'Traveler'}</span><LogOut size={15} />
        </button>
      </header>
      {children}
      <footer className="site-footer">
        <span>© 2026 Altitude</span><span>Made for the journey <Plane size={13} /></span>
      </footer>
    </div>
  );
}

function FlightsPage({ token, isAdmin, onLogout }) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogFlight, setDialogFlight] = useState(undefined);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const loadFlights = async () => {
    setError('');
    try {
      const result = await getFlights(token);
      setFlights(result.data || []);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getFlights(token)
      .then((result) => {
        if (active) setFlights(result.data || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const filteredFlights = useMemo(() => {
    const query = search.trim().toLowerCase();
    return flights.filter((flight) => {
      const matchesQuery = !query || [
        flight.flightNumber,
        flight.airline,
        flight.departureAirport,
        flight.arrivalAirport,
      ].some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || flight.status?.toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [flights, search, statusFilter]);

  const handleSaveFlight = async (flightData) => {
    setActionError('');
    setActionMessage('');
    try {
      if (dialogFlight?._id) {
        const updated = await updateFlight(token, dialogFlight._id, flightData);
        setFlights((current) => current.map((flight) => flight._id === updated._id ? updated : flight));
        setActionMessage('Flight updated.');
      } else {
        const created = await createFlight(token, flightData);
        setFlights((current) => [...current, created].sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime)));
        setActionMessage('Flight added to the schedule.');
      }
      setDialogFlight(undefined);
    } catch (requestError) {
      setActionError(requestError.message);
      throw requestError;
    }
  };

  const handleDeleteFlight = async (flight) => {
    if (!window.confirm(`Delete flight ${flight.flightNumber}? This cannot be undone.`)) return;
    setDeletingId(flight._id);
    setActionError('');
    setActionMessage('');
    try {
      await removeFlight(token, flight._id);
      setFlights((current) => current.filter((item) => item._id !== flight._id));
      setActionMessage(`${flight.flightNumber} was deleted.`);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setDeletingId('');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setActionError('');
    setActionMessage('');
    try {
      const result = await syncFlights(token);
      await loadFlights();
      setActionMessage(`Flight data synced. ${result.count} flight${result.count === 1 ? '' : 's'} updated.`);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSyncing(false);
    }
  };

  const scheduledCount = flights.filter((flight) => flight.status?.toLowerCase() === 'scheduled').length;
  const activeCount = flights.filter((flight) => ['active', 'en-route'].includes(flight.status?.toLowerCase())).length;

  return (
    <AppShell isAdmin={isAdmin} onLogout={onLogout}>
      <main className="content">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="live-dot" /> FLIGHT OPERATIONS · LIVE SCHEDULE</span>
            <h1>{isAdmin ? <>Manage the<br /><em>schedule.</em></> : <>Every flight.<br /><em>In view.</em></>}</h1>
            <p>{isAdmin ? 'Keep routes, timings and flight status up to date from one operations dashboard.' : 'Explore the current flight schedule, check routes and keep up with flight status.'}</p>
            <a href="#flight-results" className="button button-light">{isAdmin ? 'View operations' : 'View schedule'} <ArrowRight size={16} /></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="globe globe-back" /><div className="globe globe-front" />
            <div className="flight-path" />
            <span className="art-coordinate coordinate-one">FLIGHT OPERATIONS</span>
            <span className="art-coordinate coordinate-two">SCHEDULE · STATUS · ROUTES</span>
            <div className="hero-plane"><Plane size={27} fill="currentColor" /></div>
            <div className="destination-tag"><span className="destination-dot" /><span><b>FLIGHT CONTROL</b><small>All routes, one view</small></span><ArrowUpRight size={15} /></div>
          </div>
          <div className="hero-index">{String(flights.length).padStart(2, '0')} <span /> FLIGHTS</div>
        </section>

        <section id="flight-results" className="results-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{isAdmin ? 'OPERATIONS OVERVIEW' : 'FLIGHT DEPARTURE BOARD'}</span>
              <h2>{isAdmin ? 'Manage flights' : 'Flight schedule'}<span className="brand-period">.</span></h2>
            </div>
            {isAdmin ? (
              <div className="operations-actions">
                <button className="button button-outline" onClick={handleSync} disabled={syncing}>
                  <RefreshCw size={15} className={syncing ? 'spinning-icon' : ''} /> {syncing ? 'Syncing...' : 'Sync live data'}
                </button>
                <button className="button button-primary" onClick={() => { setActionError(''); setActionMessage(''); setDialogFlight(null); }}>
                  <Plus size={16} /> Add flight
                </button>
              </div>
            ) : (
              <p>{flights.length} {flights.length === 1 ? 'flight' : 'flights'} in the schedule <span className="live-dot" /></p>
            )}
          </div>

          {isAdmin && <div className="ops-metrics">
            <article><span className="metric-icon"><Plane size={17} /></span><span><small>TOTAL FLIGHTS</small><b>{flights.length}</b></span></article>
            <article><span className="metric-icon metric-green"><Clock3 size={17} /></span><span><small>SCHEDULED</small><b>{scheduledCount}</b></span></article>
            <article><span className="metric-icon metric-orange"><Users size={17} /></span><span><small>ACTIVE NOW</small><b>{activeCount}</b></span></article>
          </div>}

          <div className="flight-toolbar">
            <label className="search-box">
              <Search size={18} />
              <input aria-label="Search flights" placeholder="Search airline, route or flight number" value={search} onChange={(event) => setSearch(event.target.value)} />
              <kbd>⌘ K</kbd>
            </label>
            <label className="filter-box">
              <span>Status</span>
              <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All flights</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="landed">Landed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>

          {actionMessage && <div className="notice success-message" role="status">{actionMessage}</div>}
          {actionError && <div className="notice error-message" role="alert">{actionError}</div>}
          {error && <div className="notice error-message" role="alert">{error}</div>}
          {loading ? (
            <div className="loading-state"><span className="spinner" /> Loading flights...</div>
          ) : !error && filteredFlights.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Plane size={23} /></div>
              <h3>{flights.length ? 'No flights match your search' : 'No flights just yet'}</h3>
              <p>{flights.length
                ? 'Try another airline, route, or status.'
                : 'No flights are stored yet. Ask an admin to add a flight or sync the schedule.'}</p>
              {search && <button className="text-button" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear filters <ArrowRight size={14} /></button>}
            </div>
          ) : (
            <div className="flight-list">
              {filteredFlights.map((flight, index) => (
                <FlightCard
                  key={flight._id}
                  flight={flight}
                  index={index}
                  isAdmin={isAdmin}
                  deleting={deletingId === flight._id}
                  onEdit={() => { setActionError(''); setActionMessage(''); setDialogFlight(flight); }}
                  onDelete={() => handleDeleteFlight(flight)}
                />
              ))}
            </div>
          )}
          <p className="results-footnote"><ShieldCheck size={14} /> {isAdmin ? 'Flight changes are saved to the operations database.' : 'Flight information is provided for planning purposes.'}</p>
        </section>
      </main>
      {isAdmin && dialogFlight !== undefined && (
        <FlightFormModal
          flight={dialogFlight}
          onClose={() => setDialogFlight(undefined)}
          onSave={handleSaveFlight}
        />
      )}
    </AppShell>
  );
}

function FlightCard({ flight, index, isAdmin, deleting, onEdit, onDelete }) {
  const status = (flight.status || 'scheduled').toLowerCase();
  return (
    <article className={`flight-card${isAdmin ? ' flight-card-admin' : ''}`} style={{ '--card-index': index }}>
      <Link className="flight-card-main" to={`/flights/${flight._id}`}>
        <div className="airline-cell">
          <span className="airline-icon"><Plane size={17} /></span>
          <span><b>{flight.airline || 'Airline'}</b><small>{flight.flightNumber}</small></span>
        </div>
        <div className="route-cell">
          <span className="airport"><b>{formatTime(flight.departureTime)}</b><small>{flight.departureAirport || '—'}</small></span>
          <span className="route-line"><span /> <Plane size={13} /><span /></span>
          <span className="airport airport-arrival"><b>{formatTime(flight.arrivalTime)}</b><small>{flight.arrivalAirport || '—'}</small></span>
        </div>
        <div className="date-cell"><CalendarDays size={15} /><span>{formatDate(flight.departureTime)}</span></div>
        <div className="status-cell"><span className={`status-pill status-${status}`}>{status}</span></div>
        <span className="card-arrow"><ArrowRight size={17} /></span>
      </Link>
      {isAdmin && (
        <div className="flight-actions">
          <button type="button" className="icon-button" onClick={onEdit} aria-label={`Edit ${flight.flightNumber}`} title="Edit flight"><Pencil size={15} /></button>
          <button type="button" className="icon-button icon-danger" onClick={onDelete} disabled={deleting} aria-label={`Delete ${flight.flightNumber}`} title="Delete flight">{deleting ? <span className="spinner" /> : <Trash2 size={15} />}</button>
        </div>
      )}
    </article>
  );
}

function FlightFormModal({ flight, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({
    flightNumber: flight?.flightNumber || '',
    airline: flight?.airline || '',
    departureAirport: flight?.departureAirport || '',
    arrivalAirport: flight?.arrivalAirport || '',
    departureTime: toLocalDateTime(flight?.departureTime),
    arrivalTime: toLocalDateTime(flight?.arrivalTime),
    status: flight?.status || 'Scheduled',
    totalSeats: flight?.totalSeats ?? 180,
  }));
  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        flightNumber: form.flightNumber.trim().toUpperCase(),
        airline: form.airline.trim(),
        departureAirport: form.departureAirport.trim(),
        arrivalAirport: form.arrivalAirport.trim(),
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: new Date(form.arrivalTime).toISOString(),
        totalSeats: Number(form.totalSeats),
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="flight-modal" role="dialog" aria-modal="true" aria-labelledby="flight-form-title">
        <div className="modal-heading">
          <span className="modal-icon"><Plane size={18} /></span>
          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
          <span className="eyebrow">FLIGHT OPERATIONS</span>
          <h2 id="flight-form-title">{flight ? 'Edit flight' : 'Add a flight'}</h2>
          <p>{flight ? 'Update schedule and operational details.' : 'Enter details to add a flight to the schedule.'}</p>
        </div>
        <form className="flight-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>Flight number<input value={form.flightNumber} onChange={setField('flightNumber')} placeholder="e.g. AI101" maxLength={12} required /></label>
            <label>Airline<input value={form.airline} onChange={setField('airline')} placeholder="e.g. Air India" required /></label>
            <label>Departure airport<input value={form.departureAirport} onChange={setField('departureAirport')} placeholder="e.g. DEL" required /></label>
            <label>Arrival airport<input value={form.arrivalAirport} onChange={setField('arrivalAirport')} placeholder="e.g. BOM" required /></label>
            <label>Departure time<input type="datetime-local" value={form.departureTime} onChange={setField('departureTime')} required /></label>
            <label>Arrival time<input type="datetime-local" value={form.arrivalTime} onChange={setField('arrivalTime')} required /></label>
            <label>Flight status<select value={form.status} onChange={setField('status')}><option>Scheduled</option><option>Active</option><option>Landed</option><option>Delayed</option><option>Cancelled</option><option>Diverted</option></select></label>
            <label>Available seats<input type="number" value={form.totalSeats} onChange={setField('totalSeats')} min="0" max="1000" required /></label>
          </div>
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="button button-outline" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving...' : flight ? 'Save changes' : 'Add flight'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function FlightDetails({ token, isAdmin, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getFlight(token, id)
      .then((result) => { if (active) setFlight(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, id]);

  return (
    <AppShell isAdmin={isAdmin} onLogout={onLogout}>
      <main className="content detail-content">
        <button className="back-link" onClick={() => navigate('/flights')}><ArrowLeft size={16} /> All flights</button>
        {loading ? <div className="loading-state"><span className="spinner" /> Loading flight details...</div> : error ? (
          <div className="notice error-message" role="alert">{error}</div>
        ) : flight && (
          <>
            <section className="detail-hero">
              <div className="detail-heading">
                <span className="eyebrow">FLIGHT DETAILS · {flight.flightNumber}</span>
                <h1>{flight.departureAirport}<span className="brand-period">.</span> <ArrowRight size={28} /> {flight.arrivalAirport}<span className="brand-period">.</span></h1>
                <p>{flight.airline || 'Airline'} <span className={`status-pill status-${(flight.status || 'scheduled').toLowerCase()}`}>{flight.status || 'Scheduled'}</span></p>
              </div>
              <div className="detail-plane"><Plane size={42} /></div>
            </section>
            <section className="detail-grid">
              <article className="detail-card"><span className="detail-icon"><CalendarDays size={18} /></span><span className="eyebrow">DEPARTURE</span><h2>{formatTime(flight.departureTime)}</h2><p>{formatDate(flight.departureTime, { year: 'numeric' })}</p></article>
              <article className="detail-card"><span className="detail-icon"><Clock3 size={18} /></span><span className="eyebrow">ARRIVAL</span><h2>{formatTime(flight.arrivalTime)}</h2><p>{formatDate(flight.arrivalTime, { year: 'numeric' })}</p></article>
              <article className="detail-card"><span className="detail-icon"><Check size={18} /></span><span className="eyebrow">FLIGHT NUMBER</span><h2>{flight.flightNumber}</h2><p>{flight.airline || 'Airline'}</p></article>
            </section>
            <div className="detail-note"><ShieldCheck size={18} /><span><b>Travel information</b><small>This project currently displays flight information only. Booking and seat selection are not available yet.</small></span></div>
          </>
        )}
      </main>
    </AppShell>
  );
}

export default App;
