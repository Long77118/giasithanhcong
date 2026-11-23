import { AuthenticationError, type CollectionConfig } from 'payload';
import { isAdmin, isAdminUser } from './access';
import { isCloudflareTarget } from '../lib/deployment';

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Tài khoản quản trị',
    plural: 'Tài khoản quản trị',
  },
  auth: { cookies: { secure: isCloudflareTarget(), sameSite: 'Lax' } },
  admin: {
    group: 'Cài đặt',
    description: 'Quản lý tài khoản có quyền vào trang quản trị.',
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
  },
  access: {
    admin: isAdmin,
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    unlock: isAdmin,
  },
  hooks: {
    beforeLogin: [({ user, req }) => {
      if (!isAdminUser(user)) throw new AuthenticationError(req.t);
      return user;
    }],
    refresh: [({ user, args: { req } }) => {
      if (!isAdminUser(user)) throw new AuthenticationError(req.t);
    }],
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
        { label: 'Quản trị viên', value: 'admin' },
      ],
      access: {
        update: ({ req: { user } }) => isAdminUser(user),
      },
    },
  ],
};
