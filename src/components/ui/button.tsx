import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full text-lg font-medium ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}; 