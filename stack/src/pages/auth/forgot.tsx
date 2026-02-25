import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

const ForgotPasswordPage = () => {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.error(
        mode === "email" ? "Email is required" : "Phone number is required"
      );
      return;
    }
    setLoading(true);
    setGeneratedPassword("");
    try {
      const payload =
        mode === "email" ? { email: value.trim() } : { phone: value.trim() };
      const res = await axiosInstance.post("/user/forgot-password", payload);
      const msg =
        res.data?.message || "Password reset request processed successfully";
      toast.success(msg);
      if (res.data.generatedPassword) {
        setGeneratedPassword(res.data.generatedPassword);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Failed to process forgot password request";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <Link href="/" className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
              <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                <span className="text-xs lg:text-sm font-bold text-orange-500">
                  Q
                </span>
              </div>
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gray-800">
              Code-Quest
            </span>
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Reset using your registered email or phone number. Allowed once per
            day.
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg lg:text-xl">
              Reset password
            </CardTitle>
            <CardDescription>
              Choose how you want to receive your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setMode("email")}
                  className={`px-3 py-1.5 rounded border ${
                    mode === "email"
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setMode("phone")}
                  className={`px-3 py-1.5 rounded border ${
                    mode === "phone"
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  Phone number
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  {mode === "email" ? "Email address" : "Phone number"}
                </Label>
                <Input
                  id="value"
                  type={mode === "email" ? "email" : "tel"}
                  placeholder={
                    mode === "email" ? "you@example.com" : "Your phone number"
                  }
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={loading}
              >
                {loading ? "Processing..." : "Generate new password"}
              </Button>
            </form>

            {generatedPassword && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-xs text-gray-800">
                <p className="font-semibold mb-1">New password (demo only):</p>
                <p className="font-mono break-all">{generatedPassword}</p>
              </div>
            )}

            <div className="mt-4 text-sm text-center text-gray-600">
              <span>Remembered your password? </span>
              <Link
                href="/auth"
                className="text-orange-600 hover:underline font-medium"
              >
                Go back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

