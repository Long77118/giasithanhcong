import type { Access } from 'payload';

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

export const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user && 'role' in user && user.role === 'admin');
};

export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true;
  return {
    status: {
      equals: 'published',
    },
  };
};
