'use client';

import React from 'react';

interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function StyledButton({ 
  isActive, 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: StyledButtonProps) {
  // Filter out isActive and other problematic props
  const { isActive: _, ...buttonProps } = { isActive, ...props };
  
  const baseClasses = 'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const activeClasses = isActive ? 'ring-2 ring-purple-400 shadow-lg' : '';
  
  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${activeClasses} ${className}`.trim();
  
  return (
    <button 
      className={finalClassName}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

// HOC version for wrapping existing components
export function withStyledProps<P extends object>(
  Component: React.ComponentType<P>,
  filterProps: string[] = ['isActive']
) {
  return function StyledComponent(props: P) {
    const filteredProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !filterProps.includes(key))
    ) as P;
    
    return <Component {...filteredProps} />;
  };
}
