import { memo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownMessageProps = {
  content: string;
};

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2 text-xl font-semibold tracking-tight text-white first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 text-lg font-semibold tracking-tight text-white first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1.5 text-base font-semibold text-gray-100 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-2 leading-7 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-blue-400">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5 marker:text-blue-400">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-6">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-blue-500 bg-blue-950/20 py-1 pl-4 text-gray-300">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-gray-700" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-blue-400 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-300"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.startsWith('language-');
    return isBlock ? (
      <code className={`${className} font-mono text-[13px] leading-6 text-gray-100`}>{children}</code>
    ) : (
      <code className="rounded-md border border-gray-700 bg-gray-950/70 px-1.5 py-0.5 font-mono text-[0.9em] text-blue-200">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-950/70 text-gray-100">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-700/70">{children}</tbody>,
  tr: ({ children }) => <tr className="transition-colors hover:bg-gray-700/30">{children}</tr>,
  th: ({ children }) => <th className="border-r border-gray-700 px-3 py-2.5 font-semibold last:border-r-0">{children}</th>,
  td: ({ children }) => <td className="border-r border-gray-700/70 px-3 py-2.5 align-top leading-6 last:border-r-0">{children}</td>,
};

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-gray-700 bg-[#0b0f19] shadow-inner">
      <div className="flex items-center gap-1.5 border-b border-gray-800 bg-gray-950/80 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">Code</span>
      </div>
      <pre className="overflow-x-auto p-4 text-left">{children}</pre>
    </div>
  );
}

function MarkdownMessageComponent({ content }: MarkdownMessageProps) {
  return (
    <div className="markdown-message min-w-0 break-words text-gray-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const MarkdownMessage = memo(MarkdownMessageComponent);
