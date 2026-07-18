import React from 'react';
import StudentTracker from './StudentTracker.jsx';
import AdminDashboard from './AdminDashboard.jsx';

function App() {
  const path = window.location.pathname;

  if (path === '/admin') {
    return <AdminDashboard />;
  }

  return <StudentTracker />;
}

export default App;