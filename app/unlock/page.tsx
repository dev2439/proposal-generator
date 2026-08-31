import { Suspense } from "react";
import type { Metadata } from "next";
import PasskeyForm from "@/components/passkey-form";

export const metadata: Metadata = {
  title: "Unlock",
};

export default function UnlockPage() {
  return (
    <Suspense>
      <PasskeyForm />
    </Suspense>
  );
}
