import React from "react";

const PATHS = {
  arrow: "M5 12h14M13 6l6 6-6 6",
};

export function Icon({ name, size = 18, sw = 1.6, style, className }) {
  const d = PATHS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden="true">
      {d ? <path d={d} /> : null}
    </svg>
  );
}
