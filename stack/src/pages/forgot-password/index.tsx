import React, { useState } from 'react';
import { Mail, Phone, Lock, CheckCircle } from 'lucide-react';
// @ts-ignore
import axiosInstance from '../../lib/axiosinstance';

interface ForgotPasswordState {
  step: number;
  method: string;
  email: string;
  phone: string;
  otp: string;
  loading: boolean;
  message: string;
  error: string;
  userId: string;
}

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<number>(1); // 1: Method selection, 2: OTP, 3: Success
  const [method, setMethod] = useState<string>('email'); // email or phone
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const handleRequestPasswordReset = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axiosInstance.post('/forgot-password/request', {
        email: method === 'email' ? email : undefined,
        phone: method === 'phone' ? phone : undefined,
      });

      setUserId(response.data.userId);
      setStep(2);
      setMessage('OTP sent successfully! Check your ' + method);
    } catch (error) {
      const errorMsg = (error as any).response?.data?.message || 'Error requesting password reset';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/forgot-password/verify-otp', {
        userId,
        otp,
        method,
      });

      setStep(3);
      setMessage(response.data.message);
    } catch (error) {
      const errorMsg = (error as any).response?.data?.message || 'Invalid OTP';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setEmail('');
    setPhone('');
    setOtp('');
    setMessage('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
        </div>

        {/* Step 1: Method Selection */}
        {step === 1 && (
          <form onSubmit={handleRequestPasswordReset} className="space-y-6">
            <div className="space-y-4">
              <label className="block">
                <input
                  type="radio"
                  value="email"
                  checked={method === 'email'}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-700">Reset via Email</span>
              </label>
              {method === 'email' && (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <input
                  type="radio"
                  value="phone"
                  checked={method === 'phone'}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-700">Reset via Phone</span>
              </label>
              {method === 'phone' && (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <p className="text-gray-600 text-center">
              Enter the OTP sent to your {method}
            </p>

            <input
              type="text"
              value={otp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
              required
            />

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Back
            </button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
              <p className="text-gray-600">
                A new password has been generated and sent to your {method}.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-gray-700">
                Your new password has been generated with a random combination of uppercase and lowercase letters.
                Please check your {method} for the new password.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
