import type { Access } from 'payload';

export function isAdminUser(user: unknown): boolean {
  return Boolean(
    user && typeof user === 'object' &&
    'collection' in user && user.collection === 'users' &&
    'role' in user && user.role === 'admin',
  );
}

export const isAdmin = (({ req: { user } }) => isAdminUser(user)) satisfies Access;

export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (isAdminUser(user)) return true;
  return {
    status: {
      equals: 'published',
    },
  };
};
