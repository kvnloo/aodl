import React, { useMemo } from 'react';
import katex from 'katex';

export function Tex({ math, display = false, className = '' }) {
  const html = useMemo(
    () =>
      katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
        strict: 'ignore',
        trust: false,
      }),
    [math, display],
  );
  const Tag = display ? 'div' : 'span';
  return (
    <Tag
      className={`aodl-tex${display ? ' aodl-tex--display' : ''} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
