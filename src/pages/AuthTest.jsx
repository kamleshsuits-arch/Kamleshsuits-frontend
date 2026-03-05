import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthTest() {
  const { user, login, signup, logout } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Password123!');

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, time: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    setTesting(true);

    // Test 1: AWS Config Check
    addResult('VITE_AWS_REGION', import.meta.env.VITE_AWS_REGION ? 'PASS' : 'FAIL', import.meta.env.VITE_AWS_REGION || 'Missing');
    addResult('VITE_COGNITO_USER_POOL_ID', import.meta.env.VITE_COGNITO_USER_POOL_ID ? 'PASS' : 'FAIL', import.meta.env.VITE_COGNITO_USER_POOL_ID || 'Missing');
    addResult('VITE_COGNITO_CLIENT_ID', import.meta.env.VITE_COGNITO_CLIENT_ID ? 'PASS' : 'FAIL', import.meta.env.VITE_COGNITO_CLIENT_ID || 'Missing');

    // Test 2: User State
    addResult('User State', user ? 'LOGGED IN' : 'LOGGED OUT', user ? `Email: ${user.email}, Groups: ${user.groups.join(', ')}` : 'No session');

    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-stone-100">
        <h1 className="text-3xl font-black text-primary mb-2">AWS Auth Diagnostic</h1>
        <p className="text-secondary mb-8">Test Cognito configuration and state</p>

        <div className="space-y-4 mb-8">
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-xl"
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-xl"
          />
          <div className="flex gap-2">
             <button onClick={() => login(email, password)} className="flex-1 py-2 bg-primary text-white rounded-xl font-bold">Try Login</button>
             <button onClick={() => logout()} className="flex-1 py-2 bg-red-100 text-red-600 rounded-xl font-bold">Logout</button>
          </div>
        </div>

        <button
          onClick={runTests}
          disabled={testing}
          className="w-full py-4 bg-stone-100 text-primary rounded-xl font-black uppercase tracking-widest hover:bg-stone-200 transition mb-8"
        >
          {testing ? 'Verifying...' : 'Run AWS Config Check'}
        </button>

        <div className="space-y-2">
          {testResults.map((r, i) => (
            <div key={i} className={`p-4 rounded-xl border-l-4 ${r.status === 'PASS' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
              <div className="flex justify-between font-bold text-xs uppercase mb-1">
                <span>{r.test}</span>
                <span className={r.status === 'PASS' ? 'text-green-600' : 'text-red-600'}>{r.status}</span>
              </div>
              <p className="text-sm text-stone-600">{r.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
