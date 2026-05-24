import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[60vh] px-4 py-12">
      <Suspense fallback={<Skeleton className="h-[400px] w-full max-w-md" />}>
        <AuthForm mode="forgot" />
      </Suspense>
    </div>
  );
}
