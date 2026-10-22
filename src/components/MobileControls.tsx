import React from 'react';
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown, Zap, LocateFixed } from 'lucide-react';

interface MobileControlsProps {
  onVirtualKey: (action: 'forward' | 'backward' | 'left' | 'right' | 'boost', isHeld: boolean) => void;
  onResetCar: () => void;
  boostFuel: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onVirtualKey,
  onResetCar,
  boostFuel,
}) => {
  // Helper to bind both touch and pointer events safely
  const createTouchHandlers = (action: 'forward' | 'backward' | 'left' | 'right' | 'boost') => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        onVirtualKey(action, true);
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault();
        onVirtualKey(action, false);
      },
      onPointerCancel: (e: React.PointerEvent) => {
        e.preventDefault();
        onVirtualKey(action, false);
      },
      onPointerLeave: (e: React.PointerEvent) => {
        e.preventDefault();
        onVirtualKey(action, false);
      },
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        onVirtualKey(action, true);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        onVirtualKey(action, false);
      },
      onTouchCancel: (e: React.TouchEvent) => {
        e.preventDefault();
        onVirtualKey(action, false);
      },
    };
  };

  return (
    <div
      className="absolute inset-x-0 bottom-3 px-3 sm:px-6 pointer-events-none z-30 flex justify-between items-end select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Left Cluster: Steering (Left & Right) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Left Turn */}
        <button
          {...createTouchHandlers('left')}
          aria-label="Steer Left"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0e1724]/80 active:bg-cyan-600/60 border-2 border-cyan-500/40 active:border-cyan-300 text-cyan-200 flex items-center justify-center shadow-lg active:scale-95 transition-transform backdrop-blur-xs cursor-pointer touch-none"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>

        {/* Right Turn */}
        <button
          {...createTouchHandlers('right')}
          aria-label="Steer Right"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0e1724]/80 active:bg-cyan-600/60 border-2 border-cyan-500/40 active:border-cyan-300 text-cyan-200 flex items-center justify-center shadow-lg active:scale-95 transition-transform backdrop-blur-xs cursor-pointer touch-none"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Center Utility: Quick Reset Car */}
      <div className="pointer-events-auto flex items-center mb-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            onResetCar();
          }}
          aria-label="Reset Car to Town Center"
          title="Reset Car"
          className="w-10 h-10 rounded-full bg-[#141e2e]/85 active:bg-amber-600/60 border border-amber-500/40 active:border-amber-300 text-amber-300 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer touch-none"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Right Cluster: Throttle, Reverse & Boost */}
      <div className="flex items-end gap-2.5 pointer-events-auto">
        {/* Nitro Boost Button */}
        <button
          {...createTouchHandlers('boost')}
          aria-label="Nitro Boost"
          disabled={boostFuel < 5}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer touch-none ${
            boostFuel >= 5
              ? 'bg-amber-600/40 active:bg-amber-500 border-amber-400 text-amber-200 shadow-amber-900/40'
              : 'bg-slate-800/40 border-slate-700 text-slate-500 opacity-60'
          }`}
        >
          <Zap className="w-5 h-5 fill-current" />
          <span className="text-[9px] font-bold tracking-tighter">BOOST</span>
        </button>

        {/* Reverse / Brake */}
        <button
          {...createTouchHandlers('backward')}
          aria-label="Reverse / Brake"
          className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-[#0e1724]/80 active:bg-rose-600/60 border-2 border-rose-500/40 active:border-rose-300 text-rose-200 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer touch-none"
        >
          <ChevronDown className="w-6 h-6" />
          <span className="text-[8px] font-bold tracking-tight">REV</span>
        </button>

        {/* Drive / Forward */}
        <button
          {...createTouchHandlers('forward')}
          aria-label="Drive Forward"
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-[#0e2a4a] to-[#1a4a82] active:from-cyan-500 active:to-blue-600 border-2 border-cyan-400 active:border-white text-white flex flex-col items-center justify-center shadow-xl active:scale-95 transition-transform cursor-pointer touch-none"
        >
          <ChevronUp className="w-8 h-8 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-wide">DRIVE</span>
        </button>
      </div>
    </div>
  );
};
