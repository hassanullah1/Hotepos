// app/(site)/signup/set-password/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SetPasswordForm from "./set-password-form";

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-[#C9A15A]" />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
