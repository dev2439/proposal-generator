"use client";

import { FormEvent, useState } from "react";

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopyOutput() {
    if (!output || isSubmitting) {
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setOutput("");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: input }),
      });

      const data = (await response.json()) as { output?: string; error?: string };
      setOutput(data.output ?? data.error ?? "Request failed");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden p-4">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
        <section className="flex min-h-0 flex-col rounded-xl border border-[#d7dde5] bg-white p-4 shadow-sm">
          <h2 className="mb-3 shrink-0 text-sm font-medium uppercase tracking-wide text-[#6a7380]">
            Input
          </h2>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste the Upwork job post..."
              disabled={isSubmitting}
              className="min-h-0 flex-1 resize-none rounded-lg border border-[#d7dde5] bg-[#f8fafc] px-3 py-2 text-sm leading-6 text-[#1c2430] outline-none placeholder:text-[#6a7380] focus:border-[#2563eb] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSubmitting || !input.trim()}
              className="h-10 shrink-0 rounded-lg bg-[#2563eb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-[#d7dde5] bg-white p-4 shadow-sm">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[#6a7380]">
              Output
            </h2>
            <span className="text-xs text-[#6a7380]">
              {copied ? "Copied" : output ? "Click to copy" : ""}
            </span>
          </div>
          <textarea
            value={isSubmitting ? "Waiting for n8n..." : output}
            readOnly
            onClick={handleCopyOutput}
            title={output && !isSubmitting ? "Click to copy" : undefined}
            placeholder="Proposal, screening answers, and warnings will appear here"
            className={`min-h-0 flex-1 resize-none rounded-lg border border-[#d7dde5] bg-[#f8fafc] px-3 py-2 text-sm leading-6 text-[#1c2430] outline-none placeholder:text-[#6a7380] ${
              output && !isSubmitting ? "cursor-pointer" : ""
            }`}
          />
        </section>
      </div>
    </main>
  );
}
