
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ node, ...props }) => <pre className="bg-gray-900/70 p-0 rounded-md" {...props} />,
          code: ({ node, className, children, ...props }) => {
            // The hljs class adds a background, we handle it on the <pre> tag
            const newClassName = (className || '').replace('hljs', '');
            return (
              <code className={newClassName} {...props}>
                {children}
              </code>
            );
          },
          p: ({node, ...props}) => <p className="my-3" {...props} />,
          ul: ({node, ...props}) => <ul className="my-3 list-disc list-inside" {...props} />,
          ol: ({node, ...props}) => <ol className="my-3 list-decimal list-inside" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
