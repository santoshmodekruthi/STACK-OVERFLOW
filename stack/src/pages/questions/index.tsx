import { useRouter } from "next/router";
import { useEffect } from "react";

export default function QuestionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since questions are displayed on the home page
    router.push("/");
  }, [router]);

  return null;
}
