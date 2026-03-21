import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownPreviewProps = {
  content: string;
  compact?: boolean;
};

export function MarkdownPreview({ content, compact = false }: MarkdownPreviewProps) {
  return (
    <div className="h-full overflow-auto px-6 py-5">
      <div className={compact ? "max-w-none" : "mx-auto max-w-3xl"}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="mb-5 mt-2 text-3xl font-semibold text-white">{children}</h1>,
            h2: ({ children }) => (
              <h2 className="mb-4 mt-8 border-b border-[var(--border)] pb-2 text-2xl font-semibold text-[#ffb58c]">
                {children}
              </h2>
            ),
            h3: ({ children }) => <h3 className="mb-3 mt-6 text-xl font-semibold text-[#dfe7f1]">{children}</h3>,
            p: ({ children }) => <p className="my-4 text-[15px] leading-7 text-[#d6e0ea]">{children}</p>,
            ul: ({ children }) => <ul className="my-4 space-y-2 pl-5 text-[15px] leading-7 text-[#d6e0ea]">{children}</ul>,
            ol: ({ children }) => <ol className="my-4 space-y-2 pl-5 text-[15px] leading-7 text-[#d6e0ea]">{children}</ol>,
            li: ({ children }) => <li className="list-disc marker:text-[var(--accent)]">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="my-5 border-l-2 border-[var(--accent)] pl-4 text-[15px] leading-7 text-[#c9d5df]">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a
                className="text-[#7cd6d0] underline decoration-[rgba(124,214,208,0.35)] underline-offset-4"
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {children}
              </a>
            ),
            pre: ({ children }) => (
              <pre className="my-5 overflow-auto rounded-[14px] border border-[var(--border)] bg-black/25 px-4 py-4 font-mono text-sm leading-7 text-[#d9e5ef]">
                {children}
              </pre>
            ),
            code: ({ className, children }) => (
              <code
                className={`${className ?? ""} rounded bg-[rgba(217,98,59,0.14)] px-1.5 py-0.5 font-mono text-[0.88em] text-[#ffb58c]`}
              >
                {children}
              </code>
            ),
            hr: () => <hr className="my-6 border-0 border-t border-[var(--border)]" />,
            table: ({ children }) => (
              <div className="my-5 overflow-auto rounded-[14px] border border-[var(--border)]">
                <table className="min-w-full border-collapse text-left text-sm text-[#d6e0ea]">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
            th: ({ children }) => <th className="border-b border-[var(--border)] px-4 py-3 font-medium text-white">{children}</th>,
            td: ({ children }) => <td className="border-b border-[var(--border)] px-4 py-3 align-top">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
