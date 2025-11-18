'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/app/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.25 }}
            className="absolute"
          >
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.25 }}
            className="absolute"
          >
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          </motion.span>
        )}
      </AnimatePresence>

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
