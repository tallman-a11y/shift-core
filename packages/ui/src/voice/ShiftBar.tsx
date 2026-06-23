'use client';
import type { ShiftBarState } from './useHeyShift.js';

export interface ShiftBarProps {
  state: ShiftBarState;
  /** Number of dots. Default 3 for wave effect. */
  dots?: number;
  /** Dot size in px. Default 7. */
  size?: number;
  className?: string;
}

const COLORS: Record<ShiftBarState, string> = {
  idle:      'rgba(255,255,255,0.15)',
  wake:      '#0ed882',
  listening: '#0ed882',
  thinking:  '#22d3ee',
  speaking:  '#a78bfa',
  error:     '#f87171',
};

export function ShiftBar({ state, dots = 3, size = 7, className = '' }: ShiftBarProps) {
  const color = COLORS[state];
  const isAnimated = state !== 'idle' && state !== 'error';

  return (
    <>
      <style>{`
        @keyframes _sb_pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.45)} }
        @keyframes _sb_wave  { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.9)} }
        @keyframes _sb_spin  { to{transform:rotate(360deg)} }
      `}</style>
      <span
        className={className}
        role="status"
        aria-label={`Shift: ${state}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.6) }}
      >
        {Array.from({ length: dots }).map((_, i) => {
          let animation: string | undefined;
          if (isAnimated) {
            if (state === 'thinking') {
              animation = `_sb_spin 1s linear infinite`;
            } else if (state === 'speaking') {
              animation = `_sb_wave .7s ease-in-out ${i * 0.12}s infinite`;
            } else {
              animation = `_sb_pulse 1.2s ease-in-out ${i * 0.18}s infinite`;
            }
          }
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: state === 'thinking' ? size * 1.6 : size,
                height: size,
                borderRadius: state === 'thinking' ? '50%' : '50%',
                background: state === 'thinking' ? 'transparent' : color,
                border: state === 'thinking' ? `2px solid ${color}` : 'none',
                borderTopColor: state === 'thinking' ? 'transparent' : undefined,
                transition: 'background .3s ease, border-color .3s ease',
                animation,
                transformOrigin: '50% 50%',
              }}
            />
          );
        })}
      </span>
    </>
  );
}
