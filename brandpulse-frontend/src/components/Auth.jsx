import React, { useState } from 'react';
import { account, ID } from '../appwrite';

function Auth({ onLogin }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLoginView) {
        // Login
        await account.createEmailPasswordSession({email, password});
        const user = await account.get();
        onLogin(user);
      } else {
        // Sign Up
        await account.create({userId: ID.unique(), email, password, name});
        // After signup, log them in automatically
        await account.createEmailPasswordSession({email, password});
        const user = await account.get();
        onLogin(user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>BrandPulse AI</h1>
        <h2>{isLoginView ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="primary-button">
            {isLoginView ? 'Login' : 'Sign Up'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <p className="toggle-view">
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => setIsLoginView(!isLoginView)}>
            {isLoginView ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;