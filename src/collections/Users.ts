import type { CollectionConfig } from 'payload';
import { isAdmin, isAuthenticated } from './access';

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Tài khoản quản trị',
    plural: 'Tài khoản quản trị',
  },
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
  },
  access: {
    read: isAuthenticated,
    create: isAdmin,
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      if ('role' in user && user.role === 'admin') return true;
      return user.id === id;
    },
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      label: 'Họ và tên',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: 'Vai trò',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Quản trị viên (Admin)', value: 'admin' },
        { label: 'Biên tập viên (Editor)', value: 'editor' },
      ],
      access: {
        update: ({ req: { user } }) =>
          Boolean(user && 'role' in user && user.role === 'admin'),
      },
    },
  ],
};
