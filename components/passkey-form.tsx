"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

function nextPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value === "/unlock" ||
    value.startsWith("/unlock?")
  ) {
    return "/";
  }
  return value;
}

export default function PasskeyForm() {
  const searchParams = useSearchParams();
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Incorrect passkey.");
        return;
      }

      window.location.assign(nextPath(searchParams.get("next")));
    } catch {
      setError("Unlock failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex h-full items-center justify-center p-4">
      <section className="w-full max-w-sm rounded-xl border border-[#d7dde5] bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-base font-medium text-[#1c2430]">Enter passkey</h1>
        <p className="mb-5 text-sm text-[#6a7380]">
          Unlock to continue to the page you opened.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="passkey" className="sr-only">
            Passkey
          </label>
          <input
            id="passkey"
            type="password"
            name="passkey"
            autoComplete="current-password"
            autoFocus
            value={passkey}
            onChange={(event) => setPasskey(event.target.value)}
            placeholder="Passkey"
            disabled={isSubmitting}
            className="h-10 rounded-lg border border-[#d7dde5] bg-[#f8fafc] px-3 text-sm text-[#1c2430] outline-none placeholder:text-[#6a7380] focus:border-[#2563eb] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting || !passkey}
            className="h-10 rounded-lg bg-[#2563eb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Unlocking..." : "Continue"}
          </button>
          {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
