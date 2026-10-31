import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Safely parses and renders Markdown into native React elements.
 * Strictly avoids `dangerouslySetInnerHTML` and prevents raw HTML execution.
 */
export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by double newlines into blocks (paragraphs, lists, headers)
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-3 leading-relaxed text-[#2A2521] text-sm ${className}`}>
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Header check
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-serif font-medium text-[#2A2521] text-base mt-2 mb-1">
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-serif font-medium text-[#2A2521] text-lg mt-3 mb-1">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="font-serif font-medium text-[#2A2521] text-xl mt-3 mb-1">
              {renderInline(trimmed.slice(2))}
            </h2>
          );
        }

        // List check (bullet points or numbered)
        const lines = trimmed.split('\n');
        const isBulletList = lines.every((line) => /^\s*[-*•]\s+/.test(line));
        const isNumberedList = lines.every((line) => /^\s*\d+\.\s+/.test(line));

        if (isBulletList) {
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1.5 my-2 marker:text-[#94512F]">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^\s*[-*•]\s+/, '');
                return <li key={lIdx}>{renderInline(itemText)}</li>;
              })}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={idx} className="list-decimal pl-5 space-y-1.5 my-2 marker:text-[#94512F] marker:font-medium">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^\s*\d+\.\s+/, '');
                return <li key={lIdx}>{renderInline(itemText)}</li>;
              })}
            </ol>
          );
        }

        // Standard paragraph (handle single line breaks inside paragraph)
        return (
          <p key={idx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Safely renders inline markdown styles: **bold**, *italic*, `code`.
 */
function renderInline(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(remaining.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const boldText = matchedStr.slice(2, -2);
      tokens.push(
        <strong key={`b-${keyCounter++}`} className="font-semibold text-[#2A2521]">
          {boldText}
        </strong>
      );
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      const codeText = matchedStr.slice(1, -1);
      tokens.push(
        <code
          key={`c-${keyCounter++}`}
          className="bg-[#F1EDE8] text-[#2A2521] px-1.5 py-0.5 text-xs font-mono border border-[#E4DED6]"
        >
          {codeText}
        </code>
      );
    } else if (
      (matchedStr.startsWith('*') && matchedStr.endsWith('*')) ||
      (matchedStr.startsWith('_') && matchedStr.endsWith('_'))
    ) {
      const italicText = matchedStr.slice(1, -1);
      tokens.push(
        <em key={`i-${keyCounter++}`} className="italic text-[#6B645E]">
          {italicText}
        </em>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < remaining.length) {
    tokens.push(remaining.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}
