import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="copilot-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Render links as target="_blank"
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: "var(--copilot-primary)", textDecoration: "underline" }} />
          ),
          // Custom code block wrapper
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
