import React from 'react';

export function MovingBorderButton({
  children,
  onClick,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center p-0.5 overflow-hidden rounded-lg font-semibold text-xs shadow-xs transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <span className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 px-3.5 py-2 rounded-md">
        {children}
      </span>
    </button>
  );
}
