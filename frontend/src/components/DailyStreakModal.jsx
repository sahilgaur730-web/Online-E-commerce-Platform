import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, Flame, Gift, Sparkles, X } from 'lucide-react';

function getEvaluatedStreak() {
  const saved = localStorage.getItem('shopkart_streak_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.lastCheckInDate) {
        const lastDate = new Date(parsed.lastCheckInDate);
        const today = new Date();
        const isToday = lastDate.toDateString() === today.toDateString();

        const d1 = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

        if (isToday) {
          return { ...parsed, claimedToday: true };
        } else if (diffDays === 1) {
          // Consecutive check-in, ready to claim
          return { ...parsed, claimedToday: false };
        } else if (diffDays > 1) {
          // Broken streak resets to Day 1
          return { currentStreak: 1, lastCheckInDate: parsed.lastCheckInDate, claimedToday: false };
        }
      }
      return parsed;
    } catch {
      // fallback
    }
  }
  return {
    currentStreak: 3,
    lastCheckInDate: null,
    claimedToday: false,
  };
}

export function DailyStreakModal({ isOpen, onClose, onCoinsClaimed }) {
  const [streakData, setStreakData] = useState(getEvaluatedStreak);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStreakData(getEvaluatedStreak());
    }
  }, [isOpen]);

  const rewards = [
    { day: 1, coins: 5 },
    { day: 2, coins: 10 },
    { day: 3, coins: 15 },
    { day: 4, coins: 20 },
    { day: 5, coins: 25 },
    { day: 6, coins: 35 },
    { day: 7, coins: 50, special: 'ShopKart VIP Badge' },
  ];

  const handleClaim = () => {
    if (isClaiming || streakData.claimedToday) return;
    setIsClaiming(true);

    const earned = rewards[streakData.currentStreak - 1]?.coins || 15;
    const nextStreak = (streakData.currentStreak % 7) + 1;
    const updated = {
      currentStreak: nextStreak,
      lastCheckInDate: new Date().toISOString(),
      claimedToday: true,
    };
    setStreakData(updated);
    localStorage.setItem('shopkart_streak_data', JSON.stringify(updated));

    // Update global SuperCoins balance
    const currentBalance = parseInt(localStorage.getItem('shopkart_supercoins') || '120', 10);
    const newBalance = currentBalance + earned;
    localStorage.setItem('shopkart_supercoins', newBalance.toString());
    window.dispatchEvent(new Event('shopkart_coins_updated'));

    // Record ledger transaction
    const ledger = JSON.parse(localStorage.getItem('shopkart_coins_ledger') || '[]');
    ledger.unshift({
      id: 'TXN_' + Date.now(),
      type: 'STREAK_BONUS',
      amount: earned,
      description: `Day ${streakData.currentStreak} Daily Check-in Streak Reward`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('shopkart_coins_ledger', JSON.stringify(ledger));

    if (onCoinsClaimed) {
      onCoinsClaimed(earned, newBalance);
    }
    setTimeout(() => setIsClaiming(false), 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xs shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
        {/* Header Strip */}
        <div className="bg-gradient-to-r from-[#0A3B74] to-[#2874F0] p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-300">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">7-Day SuperCoin Streak</h2>
              <p className="text-xs text-blue-100">Check in every day to unlock bonus SuperCoins & VIP Perks</p>
            </div>
          </div>

          <div className="mt-4 bg-white/10 rounded-xs p-2.5 flex items-center justify-between text-xs font-semibold">
            <span>Current Streak: {streakData.currentStreak} Days</span>
            <span className="text-amber-300 flex items-center gap-1 font-bold">
              <Award className="w-3.5 h-3.5" /> Day 7 Bonus: 50 Coins + VIP
            </span>
          </div>
        </div>

        {/* 7-Day Stepper Grid */}
        <div className="p-5">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {rewards.map((r) => {
              const isPast = r.day < streakData.currentStreak;
              const isCurrent = r.day === streakData.currentStreak;
              const isFuture = r.day > streakData.currentStreak;

              return (
                <div
                  key={r.day}
                  className={`flex flex-col items-center justify-between p-2 rounded-xs border text-center transition ${
                    isPast
                      ? 'bg-green-50 border-green-200 text-[#388E3C]'
                      : isCurrent
                      ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-300 shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">Day {r.day}</span>
                  <div className="my-2">
                    {isPast ? (
                      <CheckCircle className="w-5 h-5 text-[#388E3C] mx-auto" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xs font-bold">
                        +{r.coins}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-semibold">{r.coins} C</span>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            {streakData.claimedToday ? (
              <div className="p-3 bg-green-50 rounded-xs border border-green-200 flex items-center justify-center gap-2 text-xs font-bold text-[#388E3C]">
                <CheckCircle className="w-4 h-4" />
                <span>You have claimed today&apos;s reward! Come back tomorrow for Day {(streakData.currentStreak % 7) + 1}.</span>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full py-3 bg-[#FF7A00] hover:bg-[#e06b00] disabled:bg-gray-300 text-white font-bold text-xs uppercase tracking-wider rounded-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                <span>{isClaiming ? 'Claiming...' : `Claim Day ${streakData.currentStreak} (${rewards[streakData.currentStreak - 1]?.coins} SuperCoins)`}</span>
              </button>
            )}
            <p className="text-[11px] text-gray-500 mt-2">
              SuperCoins can be used for up to 100% instant discounts during checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
