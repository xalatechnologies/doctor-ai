'use client';

import { ReactNode } from 'react';

interface WidgetProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: ReactNode;
  className?: string;
}

export function Widget({
  title,
  value,
  description,
  trend,
  icon,
  className = '',
}: WidgetProps) {
  return (
    <div className={`card group ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="stats-label">{title}</h3>
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="stats-value">{value}</div>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      )}
      {trend && (
        <div className={`text-sm mt-2 flex items-center gap-1 ${
          trend.isPositive ? 'text-success' : 'text-error'
        }`}>
          {trend.isPositive ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
              />
            </svg>
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
} 