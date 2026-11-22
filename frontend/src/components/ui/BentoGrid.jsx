import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function BentoGrid({ className, children }) {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[auto] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
  children,
}) {
  return (
    <div
      className={cn(
        "rounded-xl group/bento transition duration-200 p-5 bg-white border border-slate-200 shadow-xs hover:shadow-md justify-between flex flex-col space-y-4 hover:border-slate-300",
        className
      )}
    >
      {header}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          {icon}
          {title && (
            <div className="font-bold text-slate-900 tracking-tight text-sm">
              {title}
            </div>
          )}
        </div>
        {description && (
          <div className="text-slate-500 font-normal text-xs leading-relaxed">
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
