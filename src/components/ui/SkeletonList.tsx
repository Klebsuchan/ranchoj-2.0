import React from 'react';
import { SkeletonCard } from './SkeletonCard';

export interface SkeletonListProps {
  count?: number;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 4 }) => {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando itens">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={`skeleton-${idx}`} />
      ))}
    </div>
  );
};
