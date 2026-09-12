'use client';

import dynamic from 'next/dynamic';

const HermesDevCockpit = dynamic(() => import('./HermesDevCockpit'), {
  ssr: false
});

export function DevCockpitWrapper() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return <HermesDevCockpit />;
}
