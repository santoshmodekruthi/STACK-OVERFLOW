import React, { useState, useEffect } from 'react';
import { LogOut, MapPin, Globe, Smartphone, Monitor } from 'lucide-react';
import axiosInstance from '../../lib/axiosinstance.js';

interface Session {
  _id: string;
  device: {
    type: string;
    browser: string;
    os: string;
  };
  location: {
    ip: string;
    city?: string;
    country?: string;
  };
  sessionId: string;
  lastActive: string;
  isCurrentSession: boolean;
  loginTime?: string;
  loginDate?: string;
}

interface LoginHistoryEntry {
  _id: string;
  device: {
    type: string;
    browser: string;
    os: string;
  };
  location: {
    ip: string;
    city?: string;
    country?: string;
  };
  createdAt: string;
  otpVerified: boolean;
  loginTime?: string;
  loginDate?: string;
  isActive?: boolean;
  authMethod?: string;
}

interface LoginHistoryPageProps {
  currentUserId: string;
}

const LoginHistoryPage = ({ currentUserId }: LoginHistoryPageProps) => {
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active or history
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLoginHistory();
    fetchActiveSessions();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      const response = await axiosInstance.get('/login-history/history');
      setLoginHistory(response.data.logins);
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await axiosInstance.get('/login-history/active-sessions');
      setActiveSessions(response.data.sessions);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to logout from this device?')) return;

    setLoading(true);
    try {
      await axiosInstance.post('/login-history/logout', { sessionId });
      setMessage('Session revoked successfully');
      fetchActiveSessions();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error revoking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!window.confirm('Logout from all other devices? You will remain logged in here.')) return;

    setLoading(true);
    try {
      const currentSession = activeSessions[0] as Session | undefined;
      await axiosInstance.post('/login-history/revoke-all-sessions', {
        keepCurrentSessionId: currentSession?.sessionId,
      });
      setMessage('All other sessions have been revoked');
      fetchActiveSessions();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error revoking sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Security</h1>
          <p className="text-gray-600">Manage your login sessions and security</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Active Sessions ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Login History
          </button>
        </div>

        {/* Active Sessions */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeSessions.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No active sessions</p>
              </div>
            ) : (
              <>
                {activeSessions.length > 1 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-semibold mb-3">
                      You're logged in from {activeSessions.length} devices
                    </p>
                    <button
                      onClick={handleRevokeAllOthers}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                    >
                      Logout from all other devices
                    </button>
                  </div>
                )}

                {activeSessions.map((session, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="text-blue-600 mt-1">
                          {getDeviceIcon(session.device.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {session.device.browser} on {session.device.os}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {session.device.type.charAt(0).toUpperCase() + session.device.type.slice(1)}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {session.location.city && (
                              <span>
                                {session.location.city}, {session.location.country}
                              </span>
                            )}
                            {session.location.ip && !session.location.city && (
                              <span>{session.location.ip}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(session.loginTime || session.lastActive).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.sessionId)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Login History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loginHistory.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No login history</p>
              </div>
            ) : (
              loginHistory.map((login, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-blue-600 mt-1">
                      {getDeviceIcon(login.device.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {login.device.browser}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {login.device.os} • Device: {login.device.type}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {login.location.city && (
                              <span>
                                {login.location.city}, {login.location.country}
                              </span>
                            )}
                            {login.location.ip && !login.location.city && (
                              <span>{login.location.ip}</span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            login.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {login.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(login.loginDate || login.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Auth: {login.authMethod || 'password'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Security Tips */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔒 Security Tips</h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✓ Review your login history regularly for suspicious activities</li>
            <li>✓ Logout from devices you don't recognize</li>
            <li>✓ Use strong, unique passwords for your account</li>
            <li>✓ Enable two-factor authentication if available</li>
            <li>✓ Never share your password with anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginHistoryPage;
