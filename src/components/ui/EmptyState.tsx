import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
      <div className="w-14 h-14 mb-4 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-fleet-blue hover:bg-navy-700 rounded-lg shadow-sm transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
