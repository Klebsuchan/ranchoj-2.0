import React from 'react';

export interface SkeletonCardProps {
  heightClass?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ heightClass = 'h-32' }) => {
  return (
    <div className={`w-full rounded-card bg-slate-200/70 animate-pulse p-4 flex flex-col justify-between ${heightClass}`}>
      <div className="flex items-start gap-3.5">
        <div className="w-[72px] h-[72px] rounded-field bg-slate-300/70 shrink-0" />
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="h-4 bg-slate-300/70 rounded-pill w-3/4" />
          <div className="h-3 bg-slate-300/60 rounded-pill w-1/2" />
          <div className="h-6 bg-slate-300/70 rounded-pill w-1/3" />
        </div>
      </div>
    </div>
  );
};
