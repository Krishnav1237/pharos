// Create this file: hooks/useRenderTracker.ts
'use client';

import { useEffect, useRef } from 'react';

export const useRenderTracker = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const timeSinceMount = Date.now() - startTime.current;
    
    // Log renders with color coding
    const color = renderCount.current > 10 ? 'red' : renderCount.current > 5 ? 'orange' : 'green';
    console.log(
      `%c${componentName} - Render #${renderCount.current} (${timeSinceMount}ms since mount)`,
      `color: ${color}; font-weight: bold;`
    );

    // Alert if too many renders in a short time
    if (renderCount.current > 50 && timeSinceMount < 5000) {
      console.error(
        `%c🚨 POSSIBLE INFINITE LOOP DETECTED in ${componentName}!`,
        'color: red; font-size: 16px; font-weight: bold;'
      );
      console.error(`${renderCount.current} renders in ${timeSinceMount}ms`);
    }
  });

  return renderCount.current;
};

// Debug props changes
export const usePropsChange = (componentName: string, props: Record<string, any>) => {
  const prevProps = useRef(props);

  useEffect(() => {
    const changes = Object.keys(props).filter(
      key => !Object.is(props[key], prevProps.current[key])
    );

    if (changes.length > 0) {
      console.group(`${componentName} - Props Changed`);
      changes.forEach(key => {
        console.log(`${key}:`, {
          from: prevProps.current[key],
          to: props[key]
        });
      });
      console.groupEnd();
    }

    prevProps.current = props;
  }, Object.values(props));
};