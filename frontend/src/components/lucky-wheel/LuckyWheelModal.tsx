'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  Heart,
  Volume2,
  VolumeX,
  AlertCircle,
  Clock,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

const triggerConfetti = () => {
  if (typeof window === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    vx: number;
    vy: number;
    alpha: number;
  }> = [];

  const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.55,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 18,
      vy: Math.random() * -18 - 6,
      alpha: 1,
    });
  }

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.42;
      p.alpha -= 0.014;
      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  };
  render();
};

export interface WheelSegment {
  id: string;
  title: string;
  prizeType: string;
  prizeValue: number;
  color: string;
  textColor: string;
  icon?: string;
  sortOrder?: number;
}

interface Winner {
  id: string;
  userName: string;
  avatarUrl?: string;
  amount: number;
  segmentTitle?: string;
  timeAgo: string;
}

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpinSuccess?: (wonAmount: number) => void;
}

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  onSpinSuccess,
}) => {
  const { lang } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [emptyMessage, setEmptyMessage] = useState<string>(
    'শূন্য আমি রিক্ত আমি আজ দেওয়ার কিছু নাই, আজ আছে শুধু ভালোবাসা দিয়ে গেলাম তাই, আবার চেষ্টা করুন ❤️'
  );
  const [spinStatus, setSpinStatus] = useState<{
    canSpin: boolean;
    hasWonCashToday: boolean;
  }>({
    canSpin: true,
    hasWonCashToday: false,
  });

  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Result popup states
  const [showWinModal, setShowWinModal] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [resultData, setResultData] = useState<{
    wonAmount: number;
    title: string;
    isCash: boolean;
    message?: string;
  }>({ wonAmount: 0, title: '', isCash: false });

  // Web Audio Context for synthesized ticking and fanfare (No external audio file needed!)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy catch
    }
  }, [soundEnabled, getAudioContext]);

  const playFanfareSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch {
      // Silently catch
    }
  }, [soundEnabled, getAudioContext]);

  // Wheel rotation angle state
  const rotationAngleRef = useRef<number>(0);

  // Draw wheel on canvas
  const drawWheel = useCallback(
    (currentAngle: number) => {
      const canvas = canvasRef.current;
      if (!canvas || segments.length === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const radius = width / 2;
      const arc = (2 * Math.PI) / segments.length;

      ctx.clearRect(0, 0, width, height);

      // Save context for rotation
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate((currentAngle * Math.PI) / 180);

      // Draw Segments
      segments.forEach((seg, i) => {
        const angle = i * arc;

        ctx.beginPath();
        ctx.fillStyle = seg.color || '#3B82F6';
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius - 8, angle, angle + arc);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Slice border divider
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw text and icon
        ctx.save();
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = seg.textColor || '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';

        // Draw Title
        const displayTitle = seg.title.length > 14 ? seg.title.substring(0, 13) + '…' : seg.title;
        ctx.fillText(displayTitle, radius - 26, 5);

        ctx.restore();
      });

      // Outer rim decorative lights
      const numPegs = segments.length * 2;
      for (let i = 0; i < numPegs; i++) {
        const pegAngle = (i * 2 * Math.PI) / numPegs;
        const px = Math.cos(pegAngle) * (radius - 5);
        const py = Math.sin(pegAngle) * (radius - 5);
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = i % 2 === 0 ? '#FBBF24' : '#FFFFFF';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // Outer Rim Golden Ring
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 6, 0, 2 * Math.PI);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Center Hub
      ctx.beginPath();
      ctx.arc(radius, radius, 36, 0, 2 * Math.PI);
      ctx.fillStyle = '#0F172A';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(radius, radius, 32, 0, 2 * Math.PI);
      ctx.fillStyle = '#1E293B';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(radius, radius, 28, 0, 2 * Math.PI);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      // Center Hub Text / Star
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('★', radius, radius);
    },
    [segments]
  );

  // Fetch initial config & status
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [configRes, statusRes, winnersRes] = await Promise.allSettled([
        api.get('/lucky-wheel/config'),
        api.get('/lucky-wheel/my-status'),
        api.get('/lucky-wheel/recent-winners'),
      ]);

      if (configRes.status === 'fulfilled' && configRes.value) {
        const cData = (configRes.value as any)?.data ?? configRes.value;
        setSegments(cData.segments || []);
        if (cData.emptyMessage) {
          setEmptyMessage(cData.emptyMessage);
        }
      }

      if (statusRes.status === 'fulfilled' && statusRes.value) {
        const sData = (statusRes.value as any)?.data ?? statusRes.value;
        setSpinStatus({
          canSpin: sData.canSpin !== false,
          hasWonCashToday: Boolean(sData.hasWonCashToday),
        });
      }

      if (winnersRes.status === 'fulfilled' && winnersRes.value) {
        const wData = (winnersRes.value as any)?.data ?? winnersRes.value;
        setRecentWinners(Array.isArray(wData) ? wData : []);
      }
    } catch (err) {
      console.error('Failed to load lucky wheel data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  useEffect(() => {
    if (!loading && segments.length > 0) {
      drawWheel(rotationAngleRef.current);
    }
  }, [loading, segments, drawWheel]);

  // Execute Spin Animation & Backend Verification
  const handleSpin = async () => {
    if (spinning || !spinStatus.canSpin || segments.length === 0) return;

    try {
      setSpinning(true);
      getAudioContext();

      // Trigger spin on backend
      const res = await api.post('/lucky-wheel/spin');
      const data = (res as any)?.data ?? res;

      const targetIndex = data.targetIndex ?? 0;
      const numSegments = segments.length;
      const sliceDeg = 360 / numSegments;

      // Pointer is fixed at top (270 degrees in canvas coords)
      // When wheel rotates by R degrees, segment i is at (i * sliceDeg + sliceDeg/2 + R) % 360
      // To align segment i with pointer at 270 deg:
      // R = 270 - (i * sliceDeg + sliceDeg/2)
      const targetSliceCenter = targetIndex * sliceDeg + sliceDeg / 2;
      const baseStopAngle = (270 - targetSliceCenter + 360) % 360;

      // Add 6 to 8 full revolutions for realistic spin anticipation
      const fullRotations = 7 * 360;
      const currentMod = rotationAngleRef.current % 360;
      const deltaAngle = fullRotations + ((baseStopAngle - currentMod + 360) % 360);
      const targetAngle = rotationAngleRef.current + deltaAngle;

      const duration = 5200; // 5.2 seconds
      const startTime = performance.now();
      const initialAngle = rotationAngleRef.current;
      let lastSlicePassed = -1;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Quintic Deceleration Easing: 1 - (1 - t)^5
        const easeOut = 1 - Math.pow(1 - progress, 5);
        const currentAngle = initialAngle + deltaAngle * easeOut;

        rotationAngleRef.current = currentAngle;
        drawWheel(currentAngle);

        // Calculate slice currently passing under top pointer (270 deg)
        const normalizedAngle = ((270 - (currentAngle % 360)) + 360) % 360;
        const currentSliceIndex = Math.floor(normalizedAngle / sliceDeg);

        if (currentSliceIndex !== lastSlicePassed) {
          lastSlicePassed = currentSliceIndex;
          playTickSound();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Spin complete
          setSpinning(false);
          setResultData({
            wonAmount: data.wonAmount || 0,
            title: data.selectedSegment?.title || '',
            isCash: data.isCash || false,
            message: data.emptyMessage || emptyMessage,
          });

          // Refresh status (spins are unlimited!)
          setSpinStatus((prev) => ({
            ...prev,
            canSpin: true,
            hasWonCashToday: prev.hasWonCashToday || Boolean(data.isCash && data.wonAmount > 0),
          }));

          if (data.isCash && data.wonAmount > 0) {
            playFanfareSound();
            triggerConfetti();
            setShowWinModal(true);
            if (onSpinSuccess) {
              onSpinSuccess(data.wonAmount);
            }
          } else {
            // Non-cash / Try again poetic message
            setShowEmptyModal(true);
          }
        }
      };

      requestAnimationFrame(animate);
    } catch (err: any) {
      setSpinning(false);
      alert(err.response?.data?.message || 'স্পিন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-slate-100 flex flex-col">
        {/* Header Bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-1.5">
                <span>{lang === 'bn' ? 'লাকি হুইল' : 'Lucky Wheel'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Spin & Win
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'দৈনিক ফ্রি স্পিন ঘুরিয়ে ক্যাশ জিতে নিন' : 'Spin daily and win instant cash!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={spinning}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Winners Marquee Ticker */}
        {recentWinners.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 overflow-hidden flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-amber-400 font-bold shrink-0 text-[11px]">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'সাম্প্রতিক বিজয়ী:' : 'Recent Winners:'}</span>
            </div>
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-marquee space-x-6 text-[11px] text-slate-300 font-medium">
                {recentWinners.map((w, idx) => (
                  <span key={w.id || idx} className="inline-flex items-center gap-1">
                    <span className="font-semibold text-white">{w.userName}</span>
                    <span className="text-emerald-400 font-bold">৳{w.amount}</span>
                    <span className="text-slate-500 text-[9px]">•</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wheel Body */}
        <div className="p-5 flex flex-col items-center justify-center space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">হুইল লোড হচ্ছে...</p>
            </div>
          ) : (
            <>
              {/* Wheel Container with Pointer */}
              <div className="relative flex items-center justify-center">
                {/* Pointer / Needle at Top */}
                <div className="absolute -top-3 z-30 flex flex-col items-center">
                  <div
                    className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-400 drop-shadow-md"
                    style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.5))' }}
                  />
                  <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-amber-300 -mt-7" />
                </div>

                {/* Canvas Wheel */}
                <div className="p-2 rounded-full bg-gradient-to-b from-amber-400/20 via-slate-800 to-slate-950 shadow-2xl border-4 border-amber-500/40">
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={340}
                    className="rounded-full max-w-[280px] max-h-[280px] sm:max-w-[340px] sm:max-h-[340px] select-none"
                  />
                </div>
              </div>

              {/* Status Banner (Monthly cap strictly hidden from user!) */}
              <div className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xs flex items-center gap-1.5">
                      <span>{lang === 'bn' ? '🎡 আনলিমিটেড স্পিন' : '🎡 Unlimited Spins'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {spinStatus.hasWonCashToday
                        ? (lang === 'bn'
                            ? 'আজকের ক্যাশ রিওয়ার্ড সম্পন্ন, উপহার পেতে স্পিন করুন!'
                            : 'Cash reward claimed today, spin for love & luck!')
                        : (lang === 'bn'
                            ? 'দিনে যতবার খুশি স্পিন করুন এবং উপহার জিতে নিন!'
                            : 'Spin anytime as much as you want and win rewards!')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                    {lang === 'bn' ? 'আনলিমিটেড' : 'Unlimited'}
                  </span>
                </div>
              </div>

              {/* Action Spin Button (Always active for unlimited daily spins) */}
              <div className="w-full pt-1">
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={spinning || !spinStatus.canSpin}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 shadow-xl active:scale-98 cursor-pointer ${
                    spinning
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-amber-500/30 ring-2 ring-amber-400/40 hover:scale-[1.01]'
                  }`}
                >
                  {spinning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{lang === 'bn' ? 'হুইল ঘুরছে...' : 'Spinning Wheel...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🎡</span>
                      <span>{lang === 'bn' ? 'স্পিন করুন (SPIN NOW)' : 'SPIN NOW'}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 1. Cash Win Congratulations Celebration Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
              <Trophy className="w-9 h-9" />
            </div>

            <h4 className="text-xl font-black text-white mb-1">
              🎉 {lang === 'bn' ? 'অভিনন্দন! আপনি জিতেছেন' : 'Congratulations!'}
            </h4>
            <div className="my-3 py-2 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 inline-block">
              <span className="text-3xl font-black text-amber-300">
                ৳{resultData.wonAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-6">
              {lang === 'bn'
                ? 'পুরস্কারের টাকা তাৎক্ষণিকভাবে আপনার মূল ওয়ালেট ব্যালেন্সে যোগ করে দেওয়া হয়েছে।'
                : 'The reward has been credited to your available wallet balance.'}
            </p>

            <button
              type="button"
              onClick={() => {
                setShowWinModal(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-sm shadow-md transition active:scale-95"
            >
              {lang === 'bn' ? 'দারুণ! ধন্যবাদ' : 'Awesome! Thank you'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Poetic Try-Again Bengali Message Modal */}
      {showEmptyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-rose-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden">
            {/* Heart Glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 mb-4 animate-pulse">
              <Heart className="w-8 h-8 fill-current" />
            </div>

            <h4 className="text-lg font-black text-rose-300 mb-3">
              {resultData.title || (lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again')}
            </h4>

            {/* Requested Poetic Bengali Message */}
            <div className="my-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-100 font-medium text-sm leading-relaxed shadow-inner">
              <p className="whitespace-pre-line text-sm sm:text-base font-semibold">
                {resultData.message || emptyMessage}
              </p>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              {lang === 'bn'
                ? 'আজকের জন্য ফ্রি স্পিন শেষ। আগামীকাল আবার আসুন এবং চেষ্টা করুন!'
                : 'Free spin completed for today. Try again tomorrow!'}
            </p>

            <button
              type="button"
              onClick={() => setShowEmptyModal(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition active:scale-95"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'OK, Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
