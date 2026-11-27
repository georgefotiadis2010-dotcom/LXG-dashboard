import React, { useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { LxgProvider, useTelemetry } from './context/LxgContext';
import { TelemetryHeader } from './components/TelemetryHeader';
import { HeroTelemetry } from './components/HeroTelemetry';
import { LiquidScrubber } from './components/LiquidScrubber';
import { TelemetrySheet } from './components/TelemetrySheet';

function TelemetryDashboard() {
  const {
    telemetry,
    activePlatform,
    setActivePlatform,
    activeMonthIndex,
    setActiveMonthIndex,
    isSheetOpen,
    sheetPlatform,
    focusedStatId,
    openSheet,
    closeSheet,
    spotifySnapshot,
    instagramSnapshot,
    sheetSnapshot,
  } = useTelemetry();

  const gestureStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSheetOpen) return;
    gestureStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSheetOpen || !gestureStartRef.current) return;
    const dx = e.clientX - gestureStartRef.current.x;
    const dy = e.clientY - gestureStartRef.current.y;
    const elapsed = Date.now() - gestureStartRef.current.time;
    gestureStartRef.current = null;

    // Trigger TelemetrySheet on intentional upward swipe anywhere on the main view
    if (dy < -48 && Math.abs(dy) > Math.abs(dx) * 1.25 && elapsed < 700) {
      const targetPlatform = activePlatform === 'all' ? 'spotify' : activePlatform;
      openSheet(targetPlatform);
    }
  };

  const activeScrubberPlatform = activePlatform === 'instagram' ? 'instagram' : 'spotify';
  const activeHeroValue =
    activeScrubberPlatform === 'instagram'
      ? instagramSnapshot.heroValue
      : spotifySnapshot.heroValue;
  const activeMilestones = telemetry.platforms[activeScrubberPlatform].milestones;

  return (
    <main
      className="telemetry-shell"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Dynamic Ambient Radial Mesh Gradients */}
      <div
        className="ambient-mesh-layer ambient-mesh-spotify"
        style={{ opacity: activePlatform === 'spotify' ? 1 : 0 }}
        aria-hidden="true"
      />
      <div
        className="ambient-mesh-layer ambient-mesh-instagram"
        style={{ opacity: activePlatform === 'instagram' ? 1 : 0 }}
        aria-hidden="true"
      />
      <div
        className="ambient-mesh-layer ambient-mesh-all"
        style={{ opacity: activePlatform === 'all' ? 1 : 0 }}
        aria-hidden="true"
      />

      {/* 56px Edge-to-Edge Header */}
      <TelemetryHeader
        activePlatform={activePlatform}
        onSelectPlatform={setActivePlatform}
      />

      {/* Upper ~55% Hero Focal Zone */}
      <HeroTelemetry
        activePlatform={activePlatform}
        telemetry={telemetry}
        spotifySnapshot={spotifySnapshot}
        instagramSnapshot={instagramSnapshot}
        onOpenSheet={openSheet}
      />

      {/* Lower ~35% Full-Bleed Liquid Scrubber */}
      <section
        aria-label="Timeline and Milestone Scrubber"
        className="relative z-10 flex shrink-0 flex-col justify-end"
        style={{ minHeight: '32dvh' }}
      >
        <LiquidScrubber
          platform={activePlatform}
          activeMonthIndex={activeMonthIndex}
          onMonthChange={setActiveMonthIndex}
          heroValue={activeHeroValue}
          milestones={activeMilestones}
        />

        {/* Minimalist Material You Swipe-Up Affordance */}
        <button
          type="button"
          onClick={() => openSheet(activeScrubberPlatform)}
          className="flex w-full flex-col items-center justify-center gap-1.5 py-2.5 font-sans-ui text-xs font-medium text-[#8E94A0] transition-colors hover:text-[#F8F9FA] focus:outline-none"
          aria-label="Swipe up or tap for 30-day trend and top callout"
        >
          <span className="h-1 w-8 rounded-full bg-white/20" aria-hidden="true" />
          <span>30-day trend</span>
        </button>
      </section>

      {/* Frosted-Glass Bottom Sheet */}
      <TelemetrySheet
        isOpen={isSheetOpen}
        onClose={closeSheet}
        platform={sheetPlatform}
        snapshot={sheetSnapshot}
        focusedStatId={focusedStatId}
      />
    </main>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LxgProvider>
        <TelemetryDashboard />
      </LxgProvider>
    </MotionConfig>
  );
}

export default App;
