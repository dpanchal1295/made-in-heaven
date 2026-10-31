'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError caught error]:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#FCFBF8', fontFamily: 'Inter, system-ui, sans-serif', color: '#2A2521' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '440px', width: '100%', background: '#FFFFFF', border: '1px solid #E4DED6', padding: '32px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94512F', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              MADE IN HEAVEN
            </span>
            <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '26px', fontWeight: 'normal', margin: '0 0 12px 0', color: '#2A2521' }}>
              Something went wrong loading the application
            </h1>
            <p style={{ fontSize: '13px', color: '#6B645E', lineHeight: '1.6', marginBottom: '24px' }}>
              Please try refreshing the page or restarting your session.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: '#2A2521',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
