import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg border border-slate-200 ${className}`}>
      {(title || action) && (
        <div className="px-4 py-5 sm:px-6 border-b border-slate-100 flex justify-between items-center">
          {title && <h3 className="text-lg leading-6 font-medium text-slate-900">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};