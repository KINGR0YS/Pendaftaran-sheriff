'use client';
import { useEffect, useRef } from 'react';
import { sfx } from '@/lib/sfx';

export default function AestheticEnhancements() {
  const lastHoveredRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    // Event delegation for global click sound
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        'a, button, select, input, textarea, .sidebar-menu-item, [role="button"], .tab-btn, .subtab-btn'
      );
      if (target) {
        sfx.playClick();
      }
    };

    // Event delegation for global hover sound
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        'a, button, select, input, textarea, .sidebar-menu-item, [role="button"], .tab-btn, .subtab-btn'
      );
      if (target) {
        if (lastHoveredRef.current !== target) {
          sfx.playHover();
          lastHoveredRef.current = target;
        }
      } else {
        lastHoveredRef.current = null;
      }
    };

    document.addEventListener('click', handleGlobalClick, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return null; // Render nothing to keep DOM footprint at zero
}
