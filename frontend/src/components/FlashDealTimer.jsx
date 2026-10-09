import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function FlashDealTimer({ serverTime, endTime, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!serverTime || !endTime) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    const offset = Date.parse(serverTime) - Date.now();
    const remaining = Math.max(0, Date.parse(endTime) - (Date.now() + offset));
    return {
      hours: Math.floor(remaining / 3600000),
      minutes: Math.floor((remaining % 3600000) / 60000),
      seconds: Math.floor((remaining % 60000) / 1000),
      expired: remaining <= 0,
    };
  });

  useEffect(() => {
    if (!serverTime || !endTime) return;

    // Calculate fixed clock skew/offset between client and server once on mount
    const offset = Date.parse(serverTime) - Date.now();
    const targetMs = Date.parse(endTime);

    const updateTimer = () => {
      const nowSynced = Date.now() + offset;
      const remainingMs = targetMs - nowSynced;

      if (remainingMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft({
        hours: Math.floor(remainingMs / 3600000),
        minutes: Math.floor((remainingMs % 3600000) / 60000),
        seconds: Math.floor((remainingMs % 60000) / 1000),
        expired: false,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [serverTime, endTime, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 px-3 py-1 rounded-sm border border-rose-200 font-bold shrink-0">
        <Clock className="w-3.5 h-3.5 text-rose-600" />
        <span>Deal Expired</span>
      </div>
    );
  }

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-100/90 px-2.5 py-1 rounded-sm border border-gray-200/80 shrink-0">
      <Clock className="w-3.5 h-3.5 text-[#0A3B74]" />
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-tight hidden xs:inline">
        Ends in:
      </span>
      {/* Tabular numbers with fixed width boxes preventing layout shifts */}
      <div className="flex items-center gap-1 font-mono tabular-nums text-xs font-black">
        <span className="bg-[#0A3B74] text-white px-1.5 py-0.5 rounded-xs min-w-[24px] text-center inline-block shadow-2xs">
          {pad(timeLeft.hours)}
        </span>
        <span className="text-gray-400 font-bold">:</span>
        <span className="bg-[#0A3B74] text-white px-1.5 py-0.5 rounded-xs min-w-[24px] text-center inline-block shadow-2xs">
          {pad(timeLeft.minutes)}
        </span>
        <span className="text-gray-400 font-bold">:</span>
        <span className="bg-[#FF7A00] text-white px-1.5 py-0.5 rounded-xs min-w-[24px] text-center inline-block shadow-2xs">
          {pad(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
}
