import React, { useRef, useEffect, useState } from 'react';
import { Gift, Copy, Check, Sparkles, Award } from 'lucide-react';

export function ScratchCard({
  promoCode = 'SHOPKART200',
  discountText = '₹200 Instant Off on Next Purchase',
  coinsBonus = 50,
  onRevealed,
}) {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw silver coating with subtle metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#B0BEC5');
    gradient.addColorStop(0.5, '#ECEFF1');
    gradient.addColorStop(1, '#90A4AE');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add metallic pattern text
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#455A64';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH HERE TO REVEAL', width / 2, height / 2 - 10);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#607D8B';
    ctx.fillText('Mystery Reward Inside!', width / 2, height / 2 + 12);
  }, []);

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let transparentPixels = 0;
      const totalPixels = data.length / 4;

      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) {
          transparentPixels++;
        }
      }

      const percent = (transparentPixels / totalPixels) * 100;
      if (percent > 40 && !isRevealed) {
        setIsRevealed(true);
        if (onRevealed) onRevealed();
      }
    } catch {
      // ignore
    }
  };

  const scratch = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e) => {
    setIsDrawing(true);
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDrawing || !e.touches[0]) return;
    scratch(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleRevealAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsRevealed(true);
    if (onRevealed) onRevealed();
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-[#FF7A00] rounded-xs p-5 text-center relative overflow-hidden shadow-sm">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Gift className="w-5 h-5 text-[#FF7A00]" />
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-900">
          Post-Purchase Mystery Scratch Card
        </h3>
      </div>
      <p className="text-xs text-gray-600 mb-4">
        Scratch below to unlock an exclusive reward for your next purchase!
      </p>

      {/* Card wrapper */}
      <div className="relative w-72 h-36 mx-auto rounded-xs overflow-hidden border border-gray-300 shadow-md bg-white select-none">
        {/* Underlying Prize */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-gradient-to-r from-blue-50 to-amber-50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2874F0]">
            <Award className="w-4 h-4" />
            <span>Bonus: +{coinsBonus} SuperCoins Credited!</span>
          </div>
          <span className="text-xs font-semibold text-gray-700 mt-1">{discountText}</span>
          <div className="mt-2 flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-dashed border-gray-400">
            <span className="font-mono font-black text-sm tracking-wider text-[#FB641B]">
              {promoCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="text-gray-500 hover:text-gray-900 transition p-1 cursor-pointer"
              title="Copy Promo Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="text-[10px] text-gray-400 mt-1">Valid on cart value above ₹999</span>
        </div>

        {/* Scratchable Canvas Layer */}
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            width={288}
            height={144}
            className="absolute inset-0 cursor-crosshair touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-4">
        {!isRevealed ? (
          <button
            onClick={handleRevealAll}
            className="text-xs text-[#2874F0] font-bold hover:underline cursor-pointer"
          >
            Auto-Reveal Reward
          </button>
        ) : (
          <span className="text-xs font-bold text-[#388E3C] flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Reward Unlocked & Added to Account
          </span>
        )}
      </div>
    </div>
  );
}
