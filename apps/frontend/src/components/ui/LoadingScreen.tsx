import React from 'react';

const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-lg">
      <span className="text-white font-bold text-xl">T</span>
    </div>
    <div className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-accent animate-pulse-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
    <p className="text-muted-foreground text-sm">Loading TVS ERM...</p>
  </div>
);

export default LoadingScreen;
