'use client';

import { useMutation } from '@tanstack/react-query';
// import { useRouter } from 'next/router';
import { loginAction } from '../actions/auth.actions';
import { useAuthStore } from '../store/auth.store';

export const useLogin = () => {
  const setUser = useAuthStore((state) => state.setUser);
  // const router = useRouter();

  return useMutation({
    mutationFn: loginAction,
    onSuccess: (data) => {
      setUser(data.user);

      // router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Login mutation failed:', error);
    },
  });
};
