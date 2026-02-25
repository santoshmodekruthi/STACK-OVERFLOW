import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type PlanKey = "FREE" | "BRONZE" | "SILVER" | "GOLD";

const plans: {
  key: PlanKey;
  name: string;
  price: string;
  questionsPerDay: string;
  description: string;
}[] = [
  {
    key: "FREE",
    name: "Free",
    price: "₹0 / month",
    questionsPerDay: "1 question / day",
    description: "Good for getting started and asking occasional questions.",
  },
  {
    key: "BRONZE",
    name: "Bronze",
    price: "₹100 / month",
    questionsPerDay: "5 questions / day",
    description: "For regular learners who ask a few questions every day.",
  },
  {
    key: "SILVER",
    name: "Silver",
    price: "₹300 / month",
    questionsPerDay: "10 questions / day",
    description: "Perfect for active users who ask many questions.",
  },
  {
    key: "GOLD",
    name: "Gold",
    price: "₹1000 / month",
    questionsPerDay: "Unlimited questions",
    description:
      "For power users and teams who need unlimited question posting.",
  },
];

const SubscriptionsPage = () => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("FREE");
  const [dailyLimit, setDailyLimit] = useState<string>("1");
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [subscribing, setSubscribing] = useState<PlanKey | null>(null);

  const fetchSubscription = async () => {
    if (!user) return;
    setLoadingPlan(true);
    try {
      const res = await axiosInstance.get("/user/subscription");
      const data = res.data.data;
      if (data) {
        setCurrentPlan(data.plan as PlanKey);
        setDailyLimit(
          data.dailyLimit === Infinity ? "Unlimited" : String(data.dailyLimit)
        );
        setValidUntil(
          data.validUntil ? new Date(data.validUntil).toDateString() : null
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const handleSubscribe = async (plan: PlanKey) => {
    if (!user) {
      toast.info("Please login to manage subscriptions");
      return;
    }
    setSubscribing(plan);
    try {
      const res = await axiosInstance.post("/user/subscribe", { plan });
      const msg =
        res.data?.message ||
        "Subscription processed. Check your email for invoice.";
      toast.success(msg);
      fetchSubscription();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Failed to process subscription payment";
      toast.error(msg);
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Question Posting Plans
          </h1>
          <p className="text-sm text-gray-600">
            Choose a subscription plan to control how many questions you can
            post each day. Payments are accepted only between 10 AM and 11 AM
            IST.
          </p>
        </div>

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Your current plan</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPlan ? (
                <p className="text-sm text-gray-600">Loading...</p>
              ) : (
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    Plan:{" "}
                    <span className="font-semibold">
                      {currentPlan.charAt(0) +
                        currentPlan.slice(1).toLowerCase()}
                    </span>
                  </p>
                  <p>
                    Daily question limit:{" "}
                    <span className="font-semibold">{dailyLimit}</span>
                  </p>
                  {validUntil && (
                    <p>
                      Valid until:{" "}
                      <span className="font-semibold">{validUntil}</span>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card key={plan.key} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-1 text-sm text-gray-700">
                  <p className="text-lg font-semibold text-gray-900">
                    {plan.price}
                  </p>
                  <p>{plan.questionsPerDay}</p>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={subscribing === plan.key}
                >
                  {subscribing === plan.key
                    ? "Processing..."
                    : currentPlan === plan.key
                    ? "Current plan"
                    : "Choose plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Mainlayout>
  );
};

export default SubscriptionsPage;

