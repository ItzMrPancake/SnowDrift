import React, { useState } from 'react';
import { Camera, X, Download, Sliders, Eye, Sparkles } from 'lucide-react';
import { synthAudio } from '../audio/synthAudio';

interface PhotoModeOverlayProps {
  districtName: string;
  onExit: () => void;
  onCaptureScreenshot: () => string;
  onSetFov: (zoom: number) => void;
  onRotateCamera?: (yawDelta: number, pitchDelta: number) => void;
}

export const PhotoModeOverlay: React.FC<PhotoModeOverlayProps> = ({
  districtName,
  onExit,
  onCaptureScreenshot,
  onSetFov,
  onRotateCamera,
}) => {
  const [fov, setFov] = useState(32);
  const [flash, setFlash] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCapture = () => {
    synthAudio.playPickup();
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    try {
      const dataUrl = onCaptureScreenshot();
      const link = document.createElement('a');
      const cleanName = (districtName || 'Town').replace(/\s+/g, '_');
      link.download = `SnowDrift_${cleanName}_${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2400);
    } catch (e) {
      console.warn('Screenshot download error:', e);
    }
  };

  const handlePreset = (presetFov: number, yawDelta = 0, pitchDelta = 0) => {
    synthAudio.playBump();
    setFov(presetFov);
    onSetFov(presetFov);
    if (onRotateCamera) {
      onRotateCamera(yawDelta, pitchDelta);
    }
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* White Camera Shutter Flash */}
      {flash && (
        <div className="fixed inset-0 bg-white pointer-events-none z-50 animate-out fade-out duration-300" />
      )}

      {/* Top Header Bar */}
      <div className="flex justify-between items-center w-full">
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#0b121e]/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-4 py-2 text-cyan-100 shadow-xl">
          <Camera className="w-4 h-4 text-cyan-300 animate-pulse" />
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-cyan-300 font-mono">Photo Mode</div>
            <div className="text-[11px] text-slate-300 font-medium">{districtName}</div>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={onExit}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 bg-[#0b121e]/85 hover:bg-[#1a2538] backdrop-blur-md border border-slate-700/80 text-slate-200 rounded-2xl text-xs font-semibold transition active:scale-95 shadow-xl cursor-pointer"
        >
          <X className="w-4 h-4 text-slate-400" />
          <span>Exit Photo Mode</span>
        </button>
      </div>

      {/* Floating Center Orbit Guide Notification */}
      <div className="self-center bg-[#0b121e]/70 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-1.5 text-[11px] text-slate-300 shadow-lg pointer-events-none">
        Drag to Orbit & Tilt Angle · Scroll to Zoom
      </div>

      {/* Bottom Camera Tool Dock */}
      <div className="pointer-events-auto self-center flex flex-col items-center gap-3 w-full max-w-md bg-[#0b121e]/90 backdrop-blur-md border border-slate-700/80 rounded-3xl p-3 sm:p-4 shadow-2xl mb-2 sm:mb-4">
        {/* Presets and FOV Slider */}
        <div className="flex items-center justify-between w-full gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-mono">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">FOV:</span>
          </div>

          <input
            type="range"
            min="18"
            max="52"
            value={fov}
            onChange={(e) => {
              const val = Number(e.target.value);
              setFov(val);
              onSetFov(val);
            }}
            className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          <span className="text-[11px] font-mono text-cyan-300 tabular-nums w-8 text-right">{fov}°</span>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => handlePreset(32)}
              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition cursor-pointer"
            >
              Classic
            </button>
            <button
              onClick={() => handlePreset(22, 0.4, -0.2)}
              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => handlePreset(48, 0, 0.5)}
              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition cursor-pointer"
            >
              Wide
            </button>
          </div>
        </div>

        {/* Capture Snapshot Action Button */}
        <button
          onClick={handleCapture}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-cyan-500 via-sky-500 to-amber-400 hover:from-cyan-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition active:scale-98 cursor-pointer"
        >
          {downloadSuccess ? (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Snapshot Saved to Downloads!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-slate-950" />
              <span>Capture High-Res Photo (PNG)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
