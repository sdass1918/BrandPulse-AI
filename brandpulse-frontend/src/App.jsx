import React, { useState, useEffect } from 'react';
import { account } from './appwrite';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for an active session when the app loads
    const checkSession = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
      } catch (error) {
        // Not logged in
        setUser(null);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await account.deleteSession('current');
    setUser(null);
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return <Auth onLogin={handleLogin} />;
}

export default App;