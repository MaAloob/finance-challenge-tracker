import React, { useState, useEffect } from 'react';
import { Target, Lock, LogOut, Download, Calendar, Trophy, Users, ChevronRight, X, File, RefreshCw } from 'lucide-react';

const SUPABASE_URL = 'https://utvddvfqsmieiyrutsxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dmRkdmZxc21pZWl5cnV0c3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDE3MzgsImV4cCI6MjA5OTg3NzczOH0.xEczZ6H7J4mem2pkDrJSr7CiT6XyLxsof51ASKX-2oU';

const AdminDashboard = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  const [cohort, setCohort] = useState('cohort_2');
  const [submissions, setSubmissions] = useState([]);
  const [cohortSettings, setCohortSettings] = useState({});
  const [newStartDate, setNewStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [savingDate, setSavingDate] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [accessToken, cohort]);

  const login = async () => {
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setSessionExpiredNotice(false);
        sessionStorage.setItem('admin_token', data.access_token);
        sessionStorage.setItem('admin_refresh_token', data.refresh_token);
      } else {
        setLoginError(data.error_description || data.msg || 'Invalid login credentials');
      }
    } catch (err) {
      setLoginError('Could not reach the server. Check your connection.');
    }
    setLoggingIn(false);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    const savedRefresh = sessionStorage.getItem('admin_refresh_token');
    if (saved) setAccessToken(saved);
    if (savedRefresh) setRefreshToken(savedRefresh);
  }, []);

  // Proactively refresh the token every 45 minutes so the session never silently expires
  useEffect(() => {
    if (!refreshToken) return;
    const interval = setInterval(() => {
      refreshSession();
    }, 45 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [refreshToken]);

  const refreshSession = async () => {
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        sessionStorage.setItem('admin_token', data.access_token);
        sessionStorage.setItem('admin_refresh_token', data.refresh_token);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_refresh_token');
    setAccessToken(null);
    setRefreshToken(null);
    setSubmissions([]);
  };

  const authHeaders = () => ({
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let subsRes = await fetch(`${SUPABASE_URL}/rest/v1/submissions?cohort=eq.${cohort}&select=*&order=created_at.desc`, { headers: authHeaders() });
      let settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/cohort_settings?select=*`, { headers: authHeaders() });

      // Token expired mid-session — try a silent refresh once, then retry
      if (subsRes.status === 401 || settingsRes.status === 401) {
        const refreshed = await refreshSession();
        if (refreshed) {
          subsRes = await fetch(`${SUPABASE_URL}/rest/v1/submissions?cohort=eq.${cohort}&select=*&order=created_at.desc`, { headers: authHeaders() });
          settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/cohort_settings?select=*`, { headers: authHeaders() });
        }
        if (subsRes.status === 401 || settingsRes.status === 401) {
          setSessionExpiredNotice(true);
          logout();
          return;
        }
      }

      const subs = await subsRes.json();
      const settings = await settingsRes.json();

      setSubmissions(Array.isArray(subs) ? subs : []);

      const settingsMap = {};
      (Array.isArray(settings) ? settings : []).forEach(s => { settingsMap[s.cohort] = s; });
      setCohortSettings(settingsMap);
      setNewStartDate(settingsMap[cohort]?.start_date || '');
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const saveStartDate = async () => {
    if (!newStartDate) {
      alert('Please choose a date');
      return;
    }
    setSavingDate(true);
    try {
      const existing = cohortSettings[cohort];
      if (existing) {
        await fetch(`${SUPABASE_URL}/rest/v1/cohort_settings?id=eq.${existing.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ start_date: newStartDate })
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/cohort_settings`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Prefer': 'return=minimal' },
          body: JSON.stringify({ cohort, start_date: newStartDate })
        });
      }
      await fetchData();
      alert(`✅ ${cohort} start date set to ${newStartDate}`);
    } catch (err) {
      alert('Error saving start date');
    }
    setSavingDate(false);
  };

  // Build leaderboard: group by email
  const leaderboard = React.useMemo(() => {
    const map = {};
    submissions.forEach(row => {
      if (row.day === 0) return; // skip registration rows
      const key = row.email;
      if (!map[key]) {
        map[key] = {
          email: row.email,
          name: row.user_name,
          daysCompleted: new Set(),
          furthestDay: 0,
          earnings: 0,
          lastActive: row.created_at
        };
      }
      if (row.completed) map[key].daysCompleted.add(row.day);
      map[key].furthestDay = Math.max(map[key].furthestDay, row.day);
      map[key].earnings = Math.max(map[key].earnings, row.earnings || 0);
      if (new Date(row.created_at) > new Date(map[key].lastActive)) {
        map[key].lastActive = row.created_at;
      }
    });
    return Object.values(map)
      .map(s => ({ ...s, daysCompleted: s.daysCompleted.size }))
      .sort((a, b) => b.daysCompleted - a.daysCompleted || b.furthestDay - a.furthestDay);
  }, [submissions]);

  const studentSubmissions = (email) => {
    return submissions
      .filter(s => s.email === email && s.day > 0)
      .sort((a, b) => a.day - b.day);
  };

  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Name,Email,Day,Title,Completed,Submissions,Files,Timestamp\n";
    submissions.forEach(row => {
      const subsText = row.submissions ? Object.entries(row.submissions).map(([k, v]) => `A${parseInt(k)+1}: ${v}`).join(' | ') : '';
      const filesText = row.files ? Object.values(row.files).map(f => f.name).join(', ') : '';
      csv += [
        `"${row.user_name || ''}"`,
        `"${row.email || ''}"`,
        row.day,
        `"${row.day_title || ''}"`,
        row.completed ? 'Yes' : 'No',
        `"${subsText.replace(/"/g, '""')}"`,
        `"${filesText}"`,
        `"${row.created_at}"`
      ].join(',') + '\n';
    });
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `${cohort}_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // LOGIN SCREEN
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-pink-200">
          <Lock className="w-14 h-14 text-pink-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 text-center mb-6">32-Day Money Challenge</p>

          {sessionExpiredNotice && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4 text-center">
              Your session expired. Please log in again.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                className="w-full p-3 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                className="w-full p-3 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:outline-none"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{loginError}</p>
            )}
            <button
              onClick={login}
              disabled={loggingIn}
              className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white font-bold py-3 rounded-xl hover:from-pink-700 hover:to-pink-600 disabled:opacity-50"
            >
              {loggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-pink-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Target className="w-10 h-10 text-pink-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 text-sm">32-Day Money Challenge</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchData} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200" title="Refresh">
                <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 text-sm font-medium border border-pink-300">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Cohort:</label>
            <select
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              className="p-2 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:outline-none"
            >
              <option value="cohort_1">Cohort 1</option>
              <option value="cohort_2">Cohort 2</option>
              <option value="cohort_3">Cohort 3</option>
            </select>
          </div>
        </div>

        {/* Cohort Start Date Control */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-gray-900">Cohort Start Date</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Current start date for <strong>{cohort}</strong>: {cohortSettings[cohort]?.start_date
              ? new Date(cohortSettings[cohort].start_date).toLocaleDateString()
              : <span className="text-pink-600">Not set — students will see a waiting screen</span>}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="p-3 border-2 border-pink-200 rounded-lg focus:border-pink-500 focus:outline-none"
            />
            <button
              onClick={saveStartDate}
              disabled={savingDate}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-500 text-white font-bold rounded-lg hover:from-pink-700 hover:to-pink-600 disabled:opacity-50"
            >
              {savingDate ? 'Saving...' : 'Set Day 1 Date'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-pink-200">
            <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5 text-pink-600" /><span className="text-sm text-gray-700">Students</span></div>
            <p className="text-2xl font-bold text-pink-600">{leaderboard.length}</p>
          </div>
          <div className="bg-gray-900 text-white rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><Trophy className="w-5 h-5" /><span className="text-sm">Total Submissions</span></div>
            <p className="text-2xl font-bold">{submissions.filter(s => s.day > 0).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-pink-200">
            <div className="flex items-center gap-2 mb-1"><Target className="w-5 h-5 text-pink-600" /><span className="text-sm text-gray-700">Avg Days Done</span></div>
            <p className="text-2xl font-bold text-pink-600">
              {leaderboard.length ? Math.round(leaderboard.reduce((a, s) => a + s.daysCompleted, 0) / leaderboard.length) : 0}
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-gray-900">Leaderboard</h2>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No submissions yet for {cohort}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-pink-100 text-left text-gray-600">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Days Done</th>
                    <th className="py-2 pr-4">Furthest Day</th>
                    <th className="py-2 pr-4">Earnings</th>
                    <th className="py-2 pr-4">Last Active</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((s, idx) => (
                    <tr key={s.email} className="border-b border-gray-100 hover:bg-pink-50 cursor-pointer" onClick={() => setSelectedStudent(s.email)}>
                      <td className="py-3 pr-4 font-bold text-pink-600">{idx + 1}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{s.name}</td>
                      <td className="py-3 pr-4 text-gray-600">{s.email}</td>
                      <td className="py-3 pr-4">
                        <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">{s.daysCompleted}/32</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">Day {s.furthestDay}</td>
                      <td className="py-3 pr-4 text-gray-700">₦{s.earnings.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{new Date(s.lastActive).toLocaleDateString()}</td>
                      <td className="py-3"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Student Drill-down Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 my-8 border-2 border-pink-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {leaderboard.find(s => s.email === selectedStudent)?.name}
                </h3>
                <p className="text-sm text-gray-500">{selectedStudent}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {studentSubmissions(selectedStudent).map((sub) => (
                <div key={sub.id} className="border-2 border-pink-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">Day {sub.day}: {sub.day_title}</span>
                    <span className="text-xs text-gray-400">{new Date(sub.created_at).toLocaleString()}</span>
                  </div>
                  {sub.submissions && Object.keys(sub.submissions).length > 0 && (
                    <ul className="text-sm text-gray-700 space-y-1 mb-2">
                      {Object.entries(sub.submissions).map(([k, v]) => (
                        <li key={k}><span className="font-medium">Answer {parseInt(k) + 1}:</span> {v || <em className="text-gray-400">empty</em>}</li>
                      ))}
                    </ul>
                  )}
                  {sub.files && Object.keys(sub.files).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.values(sub.files).map((f, i) => (
                        <a key={i} href={f.data} download={f.name} className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg">
                          <File className="w-3 h-3" /> {f.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {studentSubmissions(selectedStudent).length === 0 && (
                <p className="text-center text-gray-500 py-4">No day submissions yet — only registered.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
