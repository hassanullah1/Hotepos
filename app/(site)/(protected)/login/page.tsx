// app/login/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import LoginForm from "./login-form";

export default function BuyerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#15121C]">
          <Loader2 className="h-7 w-7 animate-spin text-[#C9A227]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
