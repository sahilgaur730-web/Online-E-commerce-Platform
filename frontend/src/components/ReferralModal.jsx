import React, { useState } from 'react';
import { Share2, Copy, Check, Users, Gift, X } from 'lucide-react';

export function ReferralModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const referralCode = 'RAHUL730';
  const referralLink = `https://shopkart.in/invite?code=${referralCode}`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xs shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-[#2874F0] to-[#0A3B74] text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Give ₹100, Get ₹100</h2>
              <p className="text-xs text-blue-100">ShopKart Peer Referral Program</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-700 leading-relaxed">
            Invite your friends to shop on ShopKart. When they place their first order, they get ₹100 instant discount and you receive 100 SuperCoins directly in your wallet!
          </p>

          <div className="bg-blue-50/60 p-3.5 border border-blue-200 rounded-xs space-y-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Your Referral Code
            </span>
            <div className="flex items-center justify-between bg-white border border-blue-300 rounded-xs px-3 py-2">
              <span className="font-mono font-black text-base text-[#2874F0] tracking-widest">
                {referralCode}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-bold text-[#2874F0] hover:text-blue-800 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
            <span className="flex items-center gap-1 font-semibold text-gray-700">
              <Users className="w-4 h-4 text-[#2874F0]" /> 8 Friends Invited
            </span>
            <span className="font-bold text-[#388E3C]">₹800 Earned Total</span>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-3 bg-[#FB641B] hover:bg-[#e05816] text-white font-bold text-xs uppercase tracking-wider rounded-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Referral Link Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
