import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
      {/* Header: Avatar + Info */}
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar Skeleton */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 animate-shimmer"></div>

        <div className="flex-1 min-w-0">
          {/* Name Skeleton */}
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-md mb-2 w-3/4 animate-shimmer"></div>
          {/* Handle Skeleton */}
          <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-md w-1/2 animate-shimmer"></div>
        </div>
      </div>

      {/* Vote Count Skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-md w-20 animate-shimmer"></div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 animate-shimmer"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
