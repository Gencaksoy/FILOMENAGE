'use client';

import React from 'react';

export function KpiSkeleton({ count = 4 }: { count?: number } = {}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-2.5 w-28 bg-slate-100 dark:bg-slate-850 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-16 flex items-center px-4 gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className={`h-3 bg-slate-200 dark:bg-slate-800 rounded-md ${
                  c === 0 ? 'w-24' : 'flex-1'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4"
        >
          <div className="h-44 bg-slate-200 dark:bg-slate-800 w-full" />
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-3.5 w-40 bg-slate-100 dark:bg-slate-850 rounded-md" />
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
