import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export type OdometerFormat = 'raw' | 'comma' | 'compact';

export interface OdometerNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: OdometerFormat;
  /** Per-digit cascade delay in milliseconds (default: 40ms) */
  staggerMs?: number;
  /** Optional className for typography sizing/colors */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 28,
  mass: 0.75,
};

function formatNumberParts(
  value: number,
  decimals: number,
  format: OdometerFormat,
  prefix: string,
  suffix: string
): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  let core = '';

  if (format === 'compact') {
    const abs = Math.abs(safeVal);
    if (abs >= 1_000_000) {
      core = `${(safeVal / 1_000_000).toFixed(decimals || 1)}M`;
    } else if (abs >= 1_000) {
      core = `${(safeVal / 1_000).toFixed(decimals || 1)}K`;
    } else {
      core = safeVal.toFixed(decimals);
    }
  } else if (format === 'comma') {
    core = safeVal.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else {
    core = safeVal.toFixed(decimals);
  }

  return `${prefix}${core}${suffix}`;
}

interface DigitSlotProps {
  digit: number;
  delaySec: number;
}

const DigitSlot: React.FC<DigitSlotProps> = React.memo(({ digit, delaySec }) => {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block overflow-hidden align-top select-none"
      style={{
        height: '1.08em',
        lineHeight: '1.08em',
        width: '0.62em',
      }}
    >
      <motion.span
        className="block w-full"
        initial={false}
        animate={{ y: `-${digit * 10}%` }}
        transition={{
          ...SPRING_TRANSITION,
          delay: delaySec,
        }}
        style={{
          willChange: 'transform',
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="block text-center"
            style={{
              height: '1.08em',
              lineHeight: '1.08em',
            }}
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
});

DigitSlot.displayName = 'DigitSlot';

export const OdometerNumber: React.FC<OdometerNumberProps> = React.memo(
  ({
    value,
    decimals = 0,
    prefix = '',
    suffix = '',
    format = 'comma',
    staggerMs = 40,
    className = '',
    style,
  }) => {
    const formatted = useMemo(
      () => formatNumberParts(value, decimals, format, prefix, suffix),
      [value, decimals, format, prefix, suffix]
    );

    const tokens = useMemo(() => {
      const chars = formatted.split('');
      let digitCounter = 0;
      const totalDigits = chars.filter((c) => c >= '0' && c <= '9').length;

      return chars.map((char, idx) => {
        const isDigit = char >= '0' && char <= '9';
        const posFromRight = chars.length - 1 - idx;
        if (isDigit) {
          const order = digitCounter++;
          return {
            key: `d-${posFromRight}`,
            isDigit: true as const,
            digit: Number(char),
            char,
            delaySec: (order * staggerMs) / 1000,
            totalDigits,
          };
        }
        return {
          key: `s-${posFromRight}-${char}`,
          isDigit: false as const,
          digit: 0,
          char,
          delaySec: 0,
          totalDigits,
        };
      });
    }, [formatted, staggerMs]);

    return (
      <span
        aria-label={formatted}
        className={`inline-flex items-center ${className}`}
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"tnum" 1',
          lineHeight: '1.08em',
          ...style,
        }}
      >
        <span className="sr-only">{formatted}</span>
        {tokens.map((token) =>
          token.isDigit ? (
            <DigitSlot
              key={token.key}
              digit={token.digit}
              delaySec={token.delaySec}
            />
          ) : (
            <motion.span
              key={token.key}
              aria-hidden="true"
              initial={{ opacity: 0.4, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.24,
                ease: [0.2, 0.0, 0, 1.0],
              }}
              className="inline-block"
              style={{
                height: '1.08em',
                lineHeight: '1.08em',
                willChange: 'transform, opacity',
              }}
            >
              {token.char}
            </motion.span>
          )
        )}
      </span>
    );
  }
);

OdometerNumber.displayName = 'OdometerNumber';

export default OdometerNumber;
