import * as React from 'react';

export const rippleVariants = {
  default: 'bg-primary-foreground/30',
  destructive: 'bg-destructive/30',
  outline: 'bg-foreground/10',
  secondary: 'bg-secondary-foreground/30',
  ghost: 'bg-accent-foreground/20',
  link: 'bg-primary/20',
  select: 'bg-foreground/10',
  dropdown: 'bg-foreground/10',
};

export type RippleVariant = keyof typeof rippleVariants;

export function useRipple<T extends HTMLElement>(
  variant: RippleVariant = 'default'
) {
  const ref = React.useRef<T>(null);

  const createRipple = React.useCallback(
    (event: React.MouseEvent<T>) => {
      const element = ref.current;
      if (!element) return;

      const ripple = document.createElement('span');
      const rect = element.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.className = rippleVariants[variant] || rippleVariants.default;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 900ms ease-out';
      ripple.style.pointerEvents = 'none';

      element.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 900);
    },
    [variant]
  );

  return { ref, createRipple };
}

export const RippleStyles = () => (
  <style>{`
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `}</style>
);
