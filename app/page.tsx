"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <section className="flex min-h-0 flex-col rounded-xl border border-[#2d3843] bg-[#1a2129] p-4">
          <h2 className="mb-3 shrink-0 text-sm font-medium uppercase tracking-wide text-[#8b9aab]">
            Input
          </h2>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type here..."
              disabled={isSubmitting}
              className="min-h-0 flex-1 resize-none rounded-lg border border-[#2d3843] bg-[#0f1419] px-3 py-2 text-sm leading-6 text-[#e8eef4] outline-none placeholder:text-[#8b9aab] focus:border-[#3d8bfd] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 shrink-0 rounded-lg bg-[#3d8bfd] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5c9dff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-[#2d3843] bg-[#1a2129] p-4">
          <h2 className="mb-3 shrink-0 text-sm font-medium uppercase tracking-wide text-[#8b9aab]">
            Output
          </h2>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#2d3843] bg-[#0f1419] px-4 py-3">
            {isSubmitting ? (
              <p className="text-sm text-[#8b9aab]">Waiting for n8n...</p>
            ) : output ? (
              <article className="proposal-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto">
                        <table>{children}</table>
                      </div>
                    ),
                  }}
                >
                  {output}
                </ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-[#8b9aab]">Submit response will appear here</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
