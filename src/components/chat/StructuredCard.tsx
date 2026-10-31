'use client';

import React from 'react';
import { formatINR } from '@/lib/utils/format';

interface StructuredCardProps {
  structured: {
    type?: string;
    data?: any;
    [key: string]: any;
  } | null | undefined;
}

/**
 * Checks if a key name suggests a price, cost, or monetary amount.
 */
function isPriceKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k.includes('price') ||
    k.includes('cost') ||
    k.includes('budget') ||
    k.includes('amount') ||
    k.includes('fee') ||
    k.includes('rate') ||
    k.includes('total') ||
    k.includes('inr') ||
    k.includes('spend') ||
    k.includes('estimate') ||
    k.includes('low') ||
    k.includes('high')
  );
}

/**
 * Formats a value, converting numbers with price keys into Indian rupee grouping with (estimate) label.
 */
function formatValue(key: string, val: any): React.ReactNode {
  if (val === null || val === undefined) return <span className="text-[#6B645E] italic">—</span>;

  // Boolean
  if (typeof val === 'boolean') {
    return val ? (
      <span className="text-[#2A2521] font-medium">✓ Yes</span>
    ) : (
      <span className="text-[#94512F] font-medium">✕ No</span>
    );
  }

  // Number
  if (typeof val === 'number') {
    if (isPriceKey(key)) {
      return (
        <span className="font-serif font-medium text-[#2A2521]">
          {formatINR(val)}{' '}
          <span className="text-[10px] font-sans font-normal text-[#6B645E]">(estimate)</span>
        </span>
      );
    }
    return <span className="font-mono text-[#2A2521]">{val.toLocaleString('en-IN')}</span>;
  }

  // String
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (isPriceKey(key) && /^\d+(\.\d+)?$/.test(trimmed)) {
      const num = parseFloat(trimmed);
      return (
        <span className="font-serif font-medium text-[#2A2521]">
          {formatINR(num)}{' '}
          <span className="text-[10px] font-sans font-normal text-[#6B645E]">(estimate)</span>
        </span>
      );
    }
    return <span className="text-[#2A2521]">{trimmed}</span>;
  }

  // Array of primitives
  if (Array.isArray(val) && val.every((item) => typeof item !== 'object')) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {val.map((item, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-[#F1EDE8] text-[#2A2521] text-xs border border-[#E4DED6]"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  // Nested Object
  if (typeof val === 'object' && !Array.isArray(val)) {
    return <GenericObjectRenderer obj={val} depth={1} />;
  }

  return <span>{String(val)}</span>;
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function GenericObjectRenderer({ obj, depth = 0 }: { obj: Record<string, any>; depth?: number }) {
  if (!obj || typeof obj !== 'object') return null;

  if (
    ('estimated_low_inr' in obj || 'estimated_high_inr' in obj) &&
    typeof obj.estimated_low_inr === 'number' &&
    typeof obj.estimated_high_inr === 'number'
  ) {
    const { estimated_low_inr, estimated_high_inr, ...rest } = obj;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B645E]">Estimated Cost:</span>
          <span className="font-serif font-medium text-[#2A2521]">
            {formatINR(estimated_low_inr)} – {formatINR(estimated_high_inr)}{' '}
            <span className="text-[10px] font-sans font-normal text-[#6B645E]">(estimate)</span>
          </span>
        </div>
        {Object.entries(rest).map(([k, v]) => (
          <div key={k} className="flex items-start justify-between text-xs gap-2">
            <span className="text-[#6B645E] shrink-0">{formatKey(k)}:</span>
            <div className="text-right">{formatValue(k, v)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${depth > 0 ? 'pl-2.5 border-l border-[#E4DED6] my-1' : ''}`}>
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="flex items-start justify-between text-xs gap-3 py-0.5">
          <span className="text-[#6B645E] font-medium shrink-0">{formatKey(k)}:</span>
          <div className="text-right flex-1">{formatValue(k, v)}</div>
        </div>
      ))}
    </div>
  );
}

export const StructuredCard: React.FC<StructuredCardProps> = ({ structured }) => {
  if (!structured) return null;

  const payload = structured.structured ? structured.structured : structured;
  const type = payload?.type;
  const data = payload?.data;

  if (!type || type.toLowerCase() === 'none' || data === null || data === undefined) {
    return null;
  }

  const title = formatKey(type);

  return (
    <div className="mt-3 bg-[#F1EDE8] border border-[#E4DED6] p-4 text-[#2A2521]">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#E4DED6]">
        <h4 className="font-serif font-medium text-sm text-[#2A2521] tracking-wide">
          {title}
        </h4>
        <span className="font-micro text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 bg-white text-[#94512F] border border-[#E4DED6]">
          Estimated Pricing
        </span>
      </div>

      {/* Card Body */}
      <div className="text-xs">
        {Array.isArray(data) ? (
          <div className="space-y-2.5">
            {data.map((item, idx) => {
              if (typeof item === 'object' && item !== null) {
                const itemTitle =
                  item.title ||
                  item.name ||
                  item.category ||
                  item.vendor_type ||
                  item.task ||
                  `Item ${idx + 1}`;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-[#E4DED6]"
                  >
                    <div className="font-serif font-medium text-[#2A2521] text-xs mb-1.5 flex items-center justify-between">
                      <span>{itemTitle}</span>
                      {item.function && (
                        <span className="font-micro text-[10px] px-1.5 py-0.5 bg-[#F1EDE8] text-[#6B645E]">
                          {item.function}
                        </span>
                      )}
                    </div>
                    <GenericObjectRenderer
                      obj={Object.fromEntries(
                        Object.entries(item).filter(
                          ([k]) =>
                            !['title', 'name', 'category', 'vendor_type', 'task', 'function'].includes(k)
                        )
                      )}
                    />
                  </div>
                );
              }
              return (
                <div
                  key={idx}
                  className="px-2.5 py-1.5 bg-white border border-[#E4DED6] text-[#2A2521]"
                >
                  {String(item)}
                </div>
              );
            })}
          </div>
        ) : typeof data === 'object' && data !== null ? (
          <div className="p-3 bg-white border border-[#E4DED6]">
            <GenericObjectRenderer obj={data} />
          </div>
        ) : (
          <div className="p-3 bg-white border border-[#E4DED6]">
            {String(data)}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-3 pt-2 border-t border-[#E4DED6] flex items-center justify-between text-[10px] text-[#6B645E]">
        <span>* Rupee amounts grouped in Indian numbering system</span>
        <span className="font-serif font-medium text-[#2A2521]">Made in Heaven</span>
      </div>
    </div>
  );
};
