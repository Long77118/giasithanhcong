import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Payload } from 'payload';
import { getSiteSettingsCached } from '@/lib/queries';
import { OverviewLink } from './OverviewLink';
import { LoginGreeting } from './LoginGreeting';

export function WorkspaceIcon() {
  return <Image className="workspace-mark" src="/admin-assets/mark.png" alt="" width={40} height={40} unoptimized />;
}

export async function WorkspaceLogo() {
  const { contact } = await getSiteSettingsCached();
  return (
    <span className="workspace-brand">
      <WorkspaceIcon />
      <span className="workspace-brand__name">{contact.brandName}</span>
    </span>
  );
}

export async function WorkspaceNavigation({ payload }: { payload: Payload }) {
  const adminPath = payload.config.routes.admin;
  return (
    <div className="workspace-nav-start">
      <Link href={adminPath} className="workspace-nav-brand" aria-label="Về trang tổng quan">
        <WorkspaceLogo />
      </Link>
      <OverviewLink href={adminPath} />
    </div>
  );
}

export function LoginIntroduction() {
  return (
    <>
      <div className="workspace-login-art">
        <Image
          alt=""
          src="/admin-assets/packaging-illustration.svg"
          fill
          sizes="(max-width: 820px) 100vw, 50vw"
          unoptimized
          priority
        />
      </div>
      <div className="workspace-login-title">
        <LoginGreeting />
        <p>Dùng email quản trị của bạn để đăng nhập.</p>
      </div>
    </>
  );
}

export function LoginFooter() {
  return (
    <Link className="workspace-login-back" href="/">
      <ArrowLeft size={16} aria-hidden />
      Về website
    </Link>
  );
}
