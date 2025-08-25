'use client';

import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function AuthTestPage() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [email, setEmail] = useState('admin@vevurn.com');
  const [password, setPassword] = useState('admin123');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const result = await login(email, password);
      if (result.success) {
        setMessage('Login successful!');
      } else {
        setMessage(`Login failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMessage('Logged out successfully');
    } catch (error) {
      setMessage(`Logout error: ${error}`);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading auth state...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Current Auth State:</h2>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User: {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      </div>

      {!isAuthenticated ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Login Test</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleLogin}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Login
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold">Logged In</h2>
          <button
            onClick={handleLogout}
            className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}

      {message && (
        <div className="mt-4 p-2 bg-gray-100 border rounded">
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
