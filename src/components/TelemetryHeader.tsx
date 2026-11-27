import React from 'react';
import { motion } from 'framer-motion';

export type TelemetryPlatform = 'spotify' | 'instagram' | 'all';

interface TelemetryHeaderProps {
  activePlatform: TelemetryPlatform;
  onSelectPlatform: (platform: TelemetryPlatform) => void;
}

const PLATFORMS: { id: TelemetryPlatform; label: string }[] = [
  { id: 'spotify', label: 'Spotify' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'all', label: 'All' },
];

export const TelemetryHeader: React.FC<TelemetryHeaderProps> = ({
  activePlatform,
  onSelectPlatform,
}) => {
  const dotColor = activePlatform === 'instagram' ? '#FF2E63' : '#1ED760';

  return (
    <header
      className="relative z-20 flex h-[56px] w-full shrink-0 items-center justify-between px-4 sm:px-6"
      role="banner"
    >
      {/* Left: Clean Material You artist wordmark + live dot */}
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="live-dot-pulse inline-block h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: dotColor,
            boxShadow: `0 0 10px ${dotColor}99`,
          }}
          aria-hidden="true"
        />
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-display text-[15px] font-bold tracking-[-0.02em] text-[#F8F9FA]">
            LXG
          </span>
          <span className="font-sans-ui text-xs font-medium text-[#8E94A0]">
            Studio
          </span>
        </div>
      </div>

      {/* Right: Material You segmented pill control */}
      <nav
        aria-label="Platform selector"
        className="relative flex shrink-0 items-center rounded-full bg-white/[0.07] p-1"
      >
        {PLATFORMS.map((platform) => {
          const isActive = activePlatform === platform.id;
          const activeBg =
            platform.id === 'spotify'
              ? 'rgba(30, 215, 96, 0.2)'
              : platform.id === 'instagram'
                ? 'rgba(255, 46, 99, 0.22)'
                : 'rgba(255, 255, 255, 0.14)';

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => onSelectPlatform(platform.id)}
              aria-pressed={isActive}
              className="relative flex min-h-[30px] items-center justify-center rounded-full px-3 py-1 font-sans-ui text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:px-3.5"
              style={{
                color: isActive ? '#F8F9FA' : '#8E94A0',
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="platform-pill-indicator"
                  transition={{
                    type: 'spring',
                    stiffness: 340,
                    damping: 30,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: activeBg,
                  }}
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 whitespace-nowrap">
                {platform.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default TelemetryHeader;
