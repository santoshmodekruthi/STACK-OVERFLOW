import React, { useState, useEffect } from 'react';
import { Gift, Send, Search, TrendingUp } from 'lucide-react';
import axiosInstance from '../../lib/axiosinstance';

interface User {
  _id: string;
  name: string;
  email: string;
  points: number;
  avatar?: string;
}

interface Reward {
  _id: string;
  actionType: string;
  description: string;
  pointsAdded: number;
  pointsDeducted: number;
  totalPointsAfterAction: number;
  createdAt: string;
}

interface Transfer {
  _id: string;
  fromUser: User;
  toUser: User;
  pointsTransferred: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

interface RewardsPageProps {
  currentUserId: string;
}

const RewardsPage = ({ currentUserId }: RewardsPageProps) => {
  const [userPoints, setUserPoints] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointsToTransfer, setPointsToTransfer] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [activeTab, setActiveTab] = useState('history'); // history, transfer, leaderboard

  useEffect(() => {
    fetchUserRewards();
    fetchTransferHistory();
  }, [currentUserId]);

  const fetchUserRewards = async () => {
    try {
      const response = await axiosInstance.get(`/reward/history/${currentUserId}`);
      setUserPoints(response.data.user.points);
      setRewards(response.data.rewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  const fetchTransferHistory = async () => {
    try {
      const response = await axiosInstance.get('/reward/transfers/history');
      setTransfers(response.data.transfers);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  };

  const handleSearchUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axiosInstance.get('/reward/search-user', {
        params: { searchQuery },
      });
      setSearchResults(response.data.users);
    } catch (error) {
      setError('Error searching users');
    }
  };

  const handleTransferPoints = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    const points = parseInt(pointsToTransfer);
    if (!points || points < 1) {
      setError('Please enter a valid amount');
      return;
    }

    if (userPoints < 10) {
      setError('You need at least 10 points to transfer');
      return;
    }

    if (points > userPoints) {
      setError(`Insufficient points. You have ${userPoints} points`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/reward/transfer', {
        toUserId: selectedUser!._id,
        pointsToTransfer: points,
      });

      setMessage(`Successfully transferred ${points} points to ${selectedUser!.name}`);
      setUserPoints(response.data.fromUserPoints);
      setPointsToTransfer('');
      setSelectedUser(null);
      setSearchResults([]);
      setSearchQuery('');
      fetchTransferHistory();

      setTimeout(() => setMessage(''), 3000);
    } catch (error: unknown) {
      const axiosError = error as any;
      setError(axiosError.response?.data?.message || 'Error transferring points');
    } finally {
      setLoading(false);
    }
  };

  const getRewardIcon = (actionType: string) => {
    switch (actionType) {
      case 'answer_submitted':
        return '📝';
      case 'answer_upvoted':
        return '👍';
      case 'post_created':
        return '📸';
      case 'post_liked':
        return '❤️';
      case 'answer_deleted':
        return '❌';
      case 'answer_downvoted':
        return '👎';
      case 'points_transferred':
        return '↗️';
      default:
        return '⭐';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Points */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg opacity-90">Total Points</p>
              <h1 className="text-5xl font-bold">{userPoints}</h1>
            </div>
            <div className="text-6xl">
              <Gift />
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Reward History
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'transfer'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Transfer Points
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'transfers'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Transfer History
          </button>
        </div>

        {/* Reward History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reward History</h2>
            {rewards.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No rewards yet. Start contributing to earn points!</p>
              </div>
            ) : (
              rewards.map((reward, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-6 shadow hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-3xl">{getRewardIcon(reward.actionType)}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{reward.description}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(reward.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {reward.pointsAdded > 0 && (
                        <p className="text-lg font-bold text-green-600">
                          +{reward.pointsAdded} pts
                        </p>
                      )}
                      {reward.pointsDeducted > 0 && (
                        <p className="text-lg font-bold text-red-600">
                          -{reward.pointsDeducted} pts
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Total: {reward.totalPointsAfterAction}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Transfer Points Tab */}
        {activeTab === 'transfer' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transfer Points</h2>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <form onSubmit={handleSearchUser} className="mb-8">
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Select a user:</h3>
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          selectedUser?._id === user._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">{user.points} pts</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transfer Form */}
              {selectedUser && (
                <form onSubmit={handleTransferPoints} className="space-y-6 border-t pt-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      To: {selectedUser.name}
                    </label>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-gray-600">
                        They have <span className="font-bold">{selectedUser.points}</span> points
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Points to Transfer
                    </label>
                    <input
                      type="number"
                      value={pointsToTransfer}
                      onChange={(e) => setPointsToTransfer(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      max={userPoints}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Available: {userPoints} points | Minimum to transfer: 10 points
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || userPoints < 10}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    {loading ? 'Transferring...' : 'Transfer Points'}
                  </button>
                </form>
              )}

              {userPoints < 10 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    You need at least 10 points to transfer. Current: {userPoints} points
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transfer History Tab */}
        {activeTab === 'transfers' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transfer History</h2>
            {transfers.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500">No transfers yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transfers.map((transfer) => (
                  <div key={transfer._id} className="bg-white rounded-lg p-6 shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-semibold">
                            {transfer.fromUser._id === currentUserId
                              ? `Sent to ${transfer.toUser.name}`
                              : `Received from ${transfer.fromUser.name}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(transfer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p
                          className={`text-lg font-bold ${
                            transfer.fromUser._id === currentUserId
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {transfer.fromUser._id === currentUserId ? '-' : '+'}
                          {transfer.pointsTransferred} pts
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            transfer.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {transfer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;
