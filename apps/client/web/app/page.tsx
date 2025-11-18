'use client';

import { Button } from '@/app/components/ui/button';
import { ThemeToggle } from './components/shared/theme-toggle';

export default function Home() {
  return (
    <>
      <ThemeToggle /> <Button>Press here</Button>
    </>
  );
}
