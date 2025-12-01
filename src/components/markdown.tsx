"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
// import "prismjs/themes/prism-tomorrow.css";


type MarkdownMessageProps = {
  content: string;
};

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypePrism]}
      components={{
        code({ node, className, children, ...props }) {
          const isCodeBlock = className?.startsWith("language-");

          if (isCodeBlock) {
            return (
              <CopyableCodeBlock className={className}>
                {children}
              </CopyableCodeBlock>
            );
          }

          return (
            <code
              className={`${className ?? ""} px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs`}
              {...props}
            >
              {children}
            </code>
          );
        },

        // img({ src, alt }) {
        //   return (
        //     <div className="my-3 flex justify-center">
        //       {/* Use your custom image handler: */}
        //       <ImageDisplay imageUrl={src ?? ""} prompt={alt ?? ""} />

        //       {/* Or normal image tag (uncomment if needed) */}
        //       {/* <img src={src ?? ""} alt={alt} className="rounded-lg max-w-full" /> */}
        //     </div>
        //   );
        // },

        p({ children }) {
          return (
            <p className="mb-3 leading-relaxed text-slate-800 dark:text-slate-200">
              {children}
            </p>
          );
        },

        ul({ children }) {
          return (
            <ul className="mb-3 pl-6 list-disc space-y-1 text-slate-800 dark:text-slate-200">
              {children}
            </ul>
          );
        },

        ol({ children }) {
          return (
            <ol className="mb-3 pl-6 list-decimal space-y-1 text-slate-800 dark:text-slate-200">
              {children}
            </ol>
          );
        },

        li({ children }) {
          return <li className="text-slate-800 dark:text-slate-200">{children}</li>;
        },

        h1({ children }) {
          return (
            <h1 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
              {children}
            </h1>
          );
        },

        h2({ children }) {
          return (
            <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
              {children}
            </h2>
          );
        },

        h3({ children }) {
          return (
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
              {children}
            </h3>
          );
        },

        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-slate-100/70 dark:bg-slate-800/50 italic rounded">
              {children}
            </blockquote>
          );
        },

        table({ children }) {
          return (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-slate-300 dark:border-slate-700 rounded-lg">
                {children}
              </table>
            </div>
          );
        },

        th({ children }) {
          return (
            <th className="px-3 py-2 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-left text-slate-900 dark:text-white">
              {children}
            </th>
          );
        },

        td({ children }) {
          return (
            <td className="px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200">
              {children}
            </td>
          );
        },

        a({ href, children }) {
          return (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },

 
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>;
        },

        em({ children }) {
          return <em className="italic">{children}</em>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}


type CopyableProps = {
  children: React.ReactNode;
  className?: string;
};

function CopyableCodeBlock({ children, className }: CopyableProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement | null>(null);

  const copyToClipboard = async () => {
    if (!codeRef.current) return;
    await navigator.clipboard.writeText(codeRef.current.innerText);

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden">

      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 text-xs bg-slate-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      <pre className="p-4 rounded-xl bg-slate-900 text-white overflow-x-auto text-sm">
        <code ref={codeRef} className={className}>
          {children}
        </code>
      </pre>
    </div>
  );
}
