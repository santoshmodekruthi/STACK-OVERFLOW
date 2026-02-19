import React, { useState, useEffect } from 'react';
import { Check, Zap } from 'lucide-react';
import axiosInstance from '../../lib/axiosinstance';

interface PlanDetail {
  id: string;
  name: string;
  price: string;
  priceMonthly: string;
  questions: number | string;
  features: string[];
  buttonText: string;
  color: string;
}

const SubscriptionPage = () => {
  const [plans, setPlans] = useState<PlanDetail[]>([]);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [paymentWindow, setPaymentWindow] = useState('');

  useEffect(() => {
    fetchCurrentSubscription();
    checkPaymentWindow();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await axiosInstance.get('/subscription/my-subscription');
      setCurrentPlan(response.data.plan);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const checkPaymentWindow = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 10 && hours < 11) {
      setPaymentWindow('Payment window is OPEN (10 AM - 11 AM IST)');
    } else {
      const nextWindow = hours < 10 ? 10 : 10 + 24;
      const hoursToWait = nextWindow - hours;
      setPaymentWindow(`Payment window closed. Next window: ${hoursToWait} hours from now`);
    }
  };

  const planDetails = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '₹0',
      priceMonthly: 'Free',
      questions: 1,
      features: [
        '1 question per day',
        'Community access',
        'Read all answers',
      ],
      buttonText: 'Current Plan',
      color: 'gray',
    },
    {
      id: 'bronze',
      name: 'Bronze Plan',
      price: '₹100',
      priceMonthly: '/month',
      questions: 5,
      features: [
        '5 questions per day',
        'Advanced search',
        'Priority support',
        'Ad-free experience',
      ],
      buttonText: 'Upgrade to Bronze',
      color: 'orange',
    },
    {
      id: 'silver',
      name: 'Silver Plan',
      price: '₹300',
      priceMonthly: '/month',
      questions: 10,
      features: [
        '10 questions per day',
        'Advanced analytics',
        'Custom profile badges',
        'Priority support',
        'Ad-free experience',
      ],
      buttonText: 'Upgrade to Silver',
      color: 'slate',
    },
    {
      id: 'gold',
      name: 'Gold Plan',
      price: '₹1000',
      priceMonthly: '/month',
      questions: 'Unlimited',
      features: [
        'Unlimited questions',
        'Advanced analytics',
        'Custom profile badges',
        'Priority 24/7 support',
        'Ad-free experience',
        'Exclusive content access',
      ],
      buttonText: 'Upgrade to Gold',
      color: 'yellow',
    },
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      setError('You are already on the free plan');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const now = new Date();
    const hours = now.getHours();
    if (hours < 10 || hours >= 11) {
      setError('Payments are only allowed between 10 AM - 11 AM IST');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axiosInstance.post('/subscription/initiate', {
        planType: planId,
        paymentGateway: 'razorpay', // or 'stripe'
      });

      // Handle Razorpay payment
      const planPrice = planDetails.find((p: PlanDetail) => p.id === planId)?.price.replace('₹', '') || '100';
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: parseInt(planPrice) * 100,
        currency: 'INR',
        name: 'Stackoverflow Clone',
        description: `Upgrade to ${planId} plan`,
        order_id: response.data.paymentData.orderId,
        handler: async (paymentResponse: any) => {
          try {
            const verifyResponse = await axiosInstance.post('/subscription/verify', {
              paymentId: response.data.paymentId,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });

            setMessage('Subscription upgraded successfully! Invoice sent to your email.');
            setCurrentPlan(planId);
            setTimeout(() => {
              setMessage('');
              window.location.href = '/questions';
            }, 3000);
          } catch (error: unknown) {
            const axiosError = error as any;
            setError('Payment verification failed: ' + axiosError.response?.data?.message);
          }
        },
        prefill: {
          email: 'user@example.com',
          contact: '9999999999',
        },
      };

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (error: unknown) {
      const axiosError = error as any;
      setError(axiosError.response?.data?.message || 'Error initiating payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 mb-4">
            Choose the plan that fits your needs
          </p>
          <div className="inline-block bg-yellow-100 border-2 border-yellow-500 rounded-lg p-3">
            <p className="text-sm font-semibold text-yellow-800">
              ⏰ {paymentWindow}
            </p>
          </div>
        </div>

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

        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {planDetails.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden transform transition hover:scale-105 ${
                currentPlan === plan.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {currentPlan === plan.id && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                  Current Plan
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.priceMonthly}</span>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-2xl font-bold text-blue-600">{plan.questions}</p>
                  <p className="text-gray-600">
                    {typeof plan.questions === 'number' ? 'questions per day' : 'questions'}
                  </p>
                </div>

                <ul className="space-y-4 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading || currentPlan === plan.id}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    currentPlan === plan.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Notes</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
              <span>Payments can only be made between 10 AM - 11 AM IST every day</span>
            </li>
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
              <span>Invoice will be sent to your registered email immediately after successful payment</span>
            </li>
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
              <span>Question limits reset every 24 hours at midnight IST</span>
            </li>
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-yellow-500 mr-3 mt-1 flex-shrink-0" />
              <span>Plans auto-renew monthly unless cancelled from your account settings</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
