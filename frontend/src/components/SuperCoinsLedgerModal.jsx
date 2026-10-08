import React, { useState, useEffect } from 'react';
import { Award, ArrowDownLeft, ArrowUpRight, Flame, ShieldCheck, X } from 'lucide-react';

export function SuperCoinsLedgerModal({ isOpen, onClose }) {
  const [balance, setBalance] = useState(120);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const storedBalance = parseInt(localStorage.getItem('shopkart_supercoins') || '120', 10);
      setBalance(storedBalance);

      const defaultLedger = [
        {
          id: 'TXN_101',
          type: 'EARNED',
          amount: 48,
          description: 'Order #OD89234823 Completed',
          timestamp: '2026-10-06T14:32:00Z',
        },
        {
          id: 'TXN_102',
          type: 'STREAK_BONUS',
          amount: 15,
          description: 'Day 3 Daily Check-in Streak Reward',
          timestamp: '2026-10-07T09:15:00Z',
        },
        {
          id: 'TXN_103',
          type: 'REDEEMED',
          amount: 50,
          description: 'Instant Discount on Order #OD89112994',
          timestamp: '2026-10-05T18:45:00Z',
        },
        {
          id: 'TXN_104',
          type: 'EARNED',
          amount: 107,
          description: 'Order #OD89045123 Completed',
          timestamp: '2026-10-02T11:20:00Z',
        },
      ];

      const stored = localStorage.getItem('shopkart_coins_ledger');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setTransactions(parsed.length > 0 ? parsed : defaultLedger);
        } catch {
          setTransactions(defaultLedger);
        }
      } else {
        setTransactions(defaultLedger);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xs shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
        {/* Header Strip */}
        <div className="bg-[#0A3B74] text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-sm shadow-xs">
              SK
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">SuperCoins Zone</h2>
              <p className="text-xs text-blue-200">Your Flipkart-style Rewards Wallet & Ledger</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="mt-4 bg-[#2874F0] p-4 rounded-xs flex items-center justify-between border border-blue-400/40">
            <div>
              <span className="text-[11px] text-blue-100 font-semibold uppercase block">
                Available SuperCoins Balance
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-amber-300">{balance}</span>
                <span className="text-xs text-white font-medium">Coins (Worth ₹{balance})</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded font-bold uppercase inline-block">
                Earning Rate: 4%
              </span>
              <p className="text-[10px] text-blue-100 mt-1">4 Coins per ₹100 spent</p>
            </div>
          </div>
        </div>

        {/* Ledger Activity List */}
        <div className="p-5 max-h-80 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Recent Ledger Activity
          </h3>
          <div className="divide-y divide-gray-100">
            {transactions.map((t) => {
              const isEarn = t.type === 'EARNED' || t.type === 'STREAK_BONUS';
              return (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isEarn ? 'bg-green-100 text-[#388E3C]' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {isEarn ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.description}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(t.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-black text-sm shrink-0 ${
                      isEarn ? 'text-[#388E3C]' : 'text-red-600'
                    }`}
                  >
                    {isEarn ? `+${t.amount}` : `-${t.amount}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1.5 text-[#388E3C] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Guaranteed Redemption on Checkout</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#2874F0] text-white font-bold text-xs px-4 py-2 rounded-xs shadow-xs hover:bg-blue-600 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
