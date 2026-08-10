"use client";

import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      startTransition(() => {
        router.replace('/sign-in');
        router.refresh();
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button disabled={isSubmitting || isPending} variant="secondary" onPress={handleLogout}>
      {isSubmitting || isPending ? 'Saindo...' : 'Sair'}
    </Button>
  );
}
