import React from 'react';

export function FlyToCartProjectile({ projectile, onComplete }) {
  if (!projectile) return null;

  return (
    <div
      className="fly-projectile"
      style={{
        left: `${projectile.startX}px`,
        top: `${projectile.startY}px`,
        '--target-x': `${projectile.targetX - projectile.startX}px`,
        '--target-y': `${projectile.targetY - projectile.startY}px`,
      }}
      onAnimationEnd={onComplete}
    >
      <div className="w-14 h-14 rounded-full border-2 border-[#2874F0] bg-white shadow-xl overflow-hidden p-1 flex items-center justify-center">
        <img
          src={projectile.imageUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}
