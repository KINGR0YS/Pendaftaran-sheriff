'use client';
import { useEffect, useState } from 'react';
import { sfx } from '@/lib/sfx';

export default function AestheticEnhancements() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hidden, setHidden] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  useEffect(() => {
    // 1. SOUND TRIGGERS
    const handleGlobalClick = () => {
      sfx.playClick();
    };

    const handleGlobalHover = () => {
      sfx.playHover();
    };

    document.addEventListener('click', handleGlobalClick);

    // 2. CURSOR MOVEMENT
    const mMove = (el: MouseEvent) => {
      setPosition({ x: el.clientX, y: el.clientY });
      if (hidden) setHidden(false);
    };

    const mLeave = () => {
      setHidden(true);
    };

    const mDown = () => {
      setClicked(true);
    };

    const mUp = () => {
      setClicked(false);
    };

    document.addEventListener('mousemove', mMove);
    document.addEventListener('mouseleave', mLeave);
    document.addEventListener('mousedown', mDown);
    document.addEventListener('mouseup', mUp);

    // 3. ATTACH HOVER SOUNDS TO INTERACTIVE ELEMENTS
    const attachHoverEvents = () => {
      const elements = document.querySelectorAll(
        'a, button, select, input, textarea, .sidebar-menu-item, [role="button"]'
      );
      elements.forEach((el) => {
        // Play sound on enter
        if (!(el as any)._hasHoverSound) {
          (el as any)._hasHoverSound = true;
          el.addEventListener('mouseenter', handleGlobalHover);
        }
        // Change cursor scale on hover
        if (!(el as any)._hasCursorHover) {
          (el as any)._hasCursorHover = true;
          el.addEventListener('mouseenter', () => setLinkHovered(true));
          el.addEventListener('mouseleave', () => setLinkHovered(false));
        }
      });
    };

    attachHoverEvents();
    // Catch dynamic additions (tabs, modals, new fields)
    const interval = setInterval(attachHoverEvents, 1000);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('mousemove', mMove);
      document.removeEventListener('mouseleave', mLeave);
      document.removeEventListener('mousedown', mDown);
      document.removeEventListener('mouseup', mUp);
      clearInterval(interval);
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      className={`custom-cursor ${clicked ? 'clicked' : ''} ${linkHovered ? 'hovered' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    />
  );
}
