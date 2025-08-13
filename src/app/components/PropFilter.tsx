'use client';

import React from 'react';

// Utility component to filter out problematic props that shouldn't reach DOM elements
interface PropFilterProps {
  children: React.ReactNode;
  filterProps?: string[];
}

export function PropFilter({ children, filterProps = ['isActive'] }: PropFilterProps) {
  return <>{children}</>;
}

// HOC to wrap components and filter out problematic props
export function withPropFilter<P extends object>(
  Component: React.ComponentType<P>,
  filterProps: string[] = ['isActive']
) {
  return function FilteredComponent(props: P) {
    // Filter out problematic props
    const filteredProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !filterProps.includes(key))
    ) as P;
    
    return <Component {...filteredProps} />;
  };
}

// Hook to filter props before spreading to DOM elements
export function usePropFilter<T extends object>(
  props: T,
  filterProps: string[] = ['isActive']
): T {
  return React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(props).filter(([key]) => !filterProps.includes(key))
    ) as T;
  }, [props, filterProps]);
}
