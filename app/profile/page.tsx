"use client";

import { FormEvent, useState } from "react";

export default function ProfilePage() {
  const [stack, setStack] = useState("");
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack, country }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok || !contentType.includes("application/pdf")) {
        let message = "Request failed";
        try {
          const data = (await response.json()) as { error?: string };
          message = data.error ?? message;
        } catch {
          // keep default message
        }
        setStatus(message);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStatus("PDF ready");

      const link = document.createElement("a");
      link.href = url;
      link.download = "upwork-profile.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex h-full flex-col overflow-hidden p-4">
      <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#d7dde5] bg-white p-4 shadow-sm">
        <h2 className="mb-3 shrink-0 text-sm font-medium uppercase tracking-wide text-[#6a7380]">
          Profile Generator
        </h2>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
          <label htmlFor="technical-stack" className="shrink-0 text-sm font-medium text-[#6a7380]">
            Technical stack
          </label>
          <textarea
            id="technical-stack"
            value={stack}
            onChange={(event) => setStack(event.target.value)}
            placeholder="AI Full-Stack CMS integration Expert & MVP | Next.js, Supabase, Claude"
            disabled={isSubmitting}
            className="min-h-0 flex-1 resize-none rounded-lg border border-[#d7dde5] bg-[#f8fafc] px-3 py-2 text-sm leading-6 text-[#1c2430] outline-none placeholder:text-[#6a7380] focus:border-[#2563eb] disabled:opacity-60"
          />
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="education-country" className="shrink-0 text-sm font-medium text-[#6a7380]">
              Education country
            </label>
            <input
              id="education-country"
              type="text"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Poland"
              disabled={isSubmitting}
              className="h-10 min-w-0 flex-1 rounded-lg border border-[#d7dde5] bg-[#f8fafc] px-3 text-sm text-[#1c2430] outline-none placeholder:text-[#6a7380] focus:border-[#2563eb] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSubmitting || !stack.trim() || !country.trim()}
              className="h-10 min-w-28 rounded-lg bg-[#2563eb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Generating..." : "Submit"}
            </button>
          </div>
          <p className="min-h-5 shrink-0 text-sm text-[#6a7380]">
            {isSubmitting
              ? "Waiting for n8n..."
              : pdfUrl
                ? "PDF downloaded. Click below if you need it again."
                : status}
          </p>
          {pdfUrl ? (
            <a
              href={pdfUrl}
              download="upwork-profile.pdf"
              className="shrink-0 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            >
              Download PDF
            </a>
          ) : null}
        </form>
      </section>
    </main>
  );
}
