import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle, AlertCircle, Send } from 'lucide-react';
// @ts-ignore
import axiosInstance from '../../lib/axiosinstance';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface LanguageSettingsPageState {
  languages: Language[];
  currentLanguage: string;
  selectedLanguage: string;
  otp: string;
  loading: boolean;
  message: string;
  error: string;
  step: number;
  verificationType: string;
}

const LanguageSettingsPage = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<string>('english');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<number>(1); // 1: Select, 2: OTP
  const [verificationType, setVerificationType] = useState<string>(''); // email or phone

  useEffect(() => {
    fetchLanguages();
    fetchCurrentLanguage();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await axiosInstance.get('/language/supported-languages');
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchCurrentLanguage = async () => {
    try {
      const response = await axiosInstance.get('/language/user-language');
      setCurrentLanguage(response.data.language);
    } catch (error) {
      console.error('Error fetching language:', error);
    }
  };

  const handleLanguageSelect = async (langCode: string): Promise<void> => {
    if (langCode === currentLanguage) {
      setError('You are already using this language');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSelectedLanguage(langCode);
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axiosInstance.post('/language/change-request', {
        newLanguage: langCode,
      });

      setVerificationType(response.data.verificationType);
      setStep(2);

      if (response.data.verificationType === 'email') {
        setMessage(`OTP has been sent to your email. Check your inbox.`);
      } else {
        setMessage(`OTP has been sent to your phone. Please check your SMS.`);
      }
    } catch (error) {
      const errorMsg = (error as any).response?.data?.message || 'Error requesting language change';
      setError(errorMsg);
      setSelectedLanguage('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/language/verify-change', {
        otp,
        newLanguage: selectedLanguage,
      });

      setMessage(response.data.message);
      setCurrentLanguage(selectedLanguage);
      setStep(1);
      setOtp('');
      setSelectedLanguage('');

      // Optionally redirect or reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      const errorMsg = (error as any).response?.data?.message || 'Invalid OTP';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageFlag = (langCode: string): string => {
    const flags: { [key: string]: string } = {
      english: '🇬🇧',
      spanish: '🇪🇸',
      hindi: '🇮🇳',
      portuguese: '🇵🇹',
      chinese: '🇨🇳',
      french: '🇫🇷',
    };
    return flags[langCode] || '🌍';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Language Settings</h1>
          </div>
          <p className="text-gray-600">Choose your preferred language for the website</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Step 1: Language Selection */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                disabled={loading}
                className={`p-6 rounded-lg border-2 transition text-left ${
                  currentLanguage === language.code
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-400 bg-white hover:bg-blue-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">{getLanguageFlag(language.code)}</span>
                  {currentLanguage === language.code && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {language.name}
                </h3>
                <p className="text-sm text-gray-600">{language.nativeName}</p>

                {currentLanguage === language.code && (
                  <p className="text-xs text-green-600 font-semibold mt-3">
                    ✓ Currently Selected
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <span className="text-5xl">
                  {getLanguageFlag(selectedLanguage)}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mt-4">
                  Verify Your {verificationType === 'email' ? 'Email' : 'Phone'}
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  {verificationType === 'email'
                    ? 'For security, French language requires email verification'
                    : 'For security, language change requires phone verification'}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Check your {verificationType} for the 6-digit OTP
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  {loading ? 'Verifying...' : 'Verify & Change Language'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setSelectedLanguage('');
                    setError('');
                    setMessage('');
                  }}
                  className="w-full px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Back
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📢 Important Information</h2>
          <ul className="space-y-3 text-gray-700 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>French language</strong> requires email verification for security
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Other languages</strong> require phone number verification for security
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                All website content will be translated to your selected language
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                You can change your language anytime from the settings
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Language preference is saved to your account profile
              </span>
            </li>
          </ul>
        </div>

        {/* Supported Languages Box */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🌐 Supported Languages</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {languages.map((language) => (
              <div key={language.code} className="flex items-center gap-2">
                <span className="text-2xl">{getLanguageFlag(language.code)}</span>
                <div>
                  <p className="font-semibold text-gray-900">{language.name}</p>
                  <p className="text-xs text-gray-500">{language.nativeName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettingsPage;
