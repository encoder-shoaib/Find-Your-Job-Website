import React from 'react';

export function PriorityBadge({ priority }) {
  if (priority === 'High') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
        High Priority
      </span>
    );
  }
  if (priority === 'Medium') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
      Low
    </span>
  );
}

export function ScoreBadge({ score }) {
  const num = parseInt(score, 10) || 5;
  let style = 'text-slate-600 bg-slate-50 border-slate-200 font-medium';
  if (num >= 8) style = 'text-emerald-800 bg-emerald-50 border-emerald-200 font-semibold';
  else if (num >= 6) style = 'text-slate-700 bg-slate-100 border-slate-200 font-semibold';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border font-mono ${style}`}>
      {num}/10
    </span>
  );
}
