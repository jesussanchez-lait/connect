'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/src/domain/entities/User';
import { getCurrentUserUseCase, logoutUseCase } from '@/src/shared/di/container';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUserUseCase.execute();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUseCase.execute();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [router]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser: checkAuth,
  };
}

