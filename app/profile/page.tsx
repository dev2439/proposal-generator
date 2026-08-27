"use client";

import { FormEvent, useState } from "react";

export default function ProfilePage() {
  const [stack, setStack] = useState("");
  const [country, setCountry] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [docxUrl, setDocxUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    if (docxUrl) {
      URL.revokeObjectURL(docxUrl);
      setDocxUrl("");
    }

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack, country, hourlyRate }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const isDocx =
        contentType.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ) || contentType.includes("application/octet-stream");

      if (!response.ok || !isDocx) {
        let message =
          response.status === 404
            ? "Profile API was not found. Refresh after the latest deploy."
            : `Request failed (${response.status})`;
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
      setDocxUrl(url);
      setStatus("DOCX ready");

      const link = document.createElement("a");
      link.href = url;
      link.download = "upwork-profile.docx";
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
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto md:flex-row md:overflow-hidden">
        <section className="flex min-h-[min(28rem,70vh)] min-w-0 flex-1 flex-col rounded-xl border border-[#d7dde5] bg-white p-4 shadow-sm md:min-h-0">
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
              <label htmlFor="hourly-rate" className="shrink-0 text-sm font-medium text-[#6a7380]">
                Hourly rate
              </label>
              <input
                id="hourly-rate"
                type="text"
                value={hourlyRate}
                onChange={(event) => setHourlyRate(event.target.value)}
                placeholder="45"
                disabled={isSubmitting}
                className="h-10 min-w-0 flex-1 rounded-lg border border-[#d7dde5] bg-[#f8fafc] px-3 text-sm text-[#1c2430] outline-none placeholder:text-[#6a7380] focus:border-[#2563eb] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSubmitting || !stack.trim() || !country.trim() || !hourlyRate.trim()}
                className="h-10 min-w-28 rounded-lg bg-[#2563eb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Generating..." : "Submit"}
              </button>
            </div>
            <p className="min-h-5 shrink-0 text-sm text-[#6a7380]">
              {isSubmitting
                ? "Waiting for n8n..."
                : docxUrl
                  ? "Word file downloaded. Click below if you need it again."
                  : status}
            </p>
            {docxUrl ? (
              <a
                href={docxUrl}
                download="upwork-profile.docx"
                className="shrink-0 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                Download DOCX
              </a>
            ) : null}
          </form>
        </section>

        <section className="flex min-h-[min(28rem,70vh)] min-w-0 flex-1 flex-col rounded-xl border border-[#d7dde5] bg-white p-4 shadow-sm md:min-h-0">
          <h2
            id="system-prompt-heading"
            className="mb-3 shrink-0 text-sm font-medium uppercase tracking-wide text-[#6a7380]"
          >
            System prompt
          </h2>
          <label htmlFor="system-prompt" className="sr-only">
            System prompt
          </label>
          <textarea
            id="system-prompt"
            aria-labelledby="system-prompt-heading"
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            placeholder="Paste or edit a system prompt..."
            className="min-h-0 flex-1 resize-none rounded-lg border border-[#d7dde5] bg-[#f8fafc] px-3 py-2 text-sm leading-6 text-[#1c2430] outline-none placeholder:text-[#6a7380] focus:border-[#2563eb]"
          />
        </section>
      </div>
    </main>
  );
}
