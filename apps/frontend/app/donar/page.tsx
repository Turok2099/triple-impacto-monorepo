"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PaymentFormRest from "@/components/donar/PaymentFormRest";
import { Loader2 } from "lucide-react";

export default function DonarPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login?redirect=/donar");
      } else {
        setCheckingAuth(false);
      }
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#40a8ab]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4fafb] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <PaymentFormRest
          onSuccess={(data) => console.log('Éxito REST', data)}
        />
      </div>
    </div>
  );
}
