'use client';

import { useEffect, useState } from 'react';
import { adminLoginGreeting } from '@/lib/admin-dashboard';

export function LoginGreeting() {
  const [greeting, setGreeting] = useState('Chào bạn!');
  useEffect(() => {
    setGreeting(adminLoginGreeting(new Date().getHours()));
  }, []);
  return <h1>{greeting}</h1>;
}
