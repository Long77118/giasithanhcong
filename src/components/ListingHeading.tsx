import type { ReactNode } from 'react';

export function ListingHeading({ title, description, summary, actions, media }: {
  title: string;
  description?: string | null;
  summary?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
}) {
  return (
    <header className="listing-heading">
      <div className="listing-heading-line">
        <h1>{title}</h1>
        {summary && <div className="listing-heading-summary">{summary}</div>}
      </div>
      {description && <p>{description}</p>}
      {actions}
      {media ?? <svg className="listing-heading-art" viewBox="0 0 190 104" aria-hidden="true" focusable="false">
        <path d="M13 73C20 48 46 54 67 35c23-20 52-20 87-17 30 3 32 31 15 51-20 24-49 25-72 22-21-2-42 11-65 6-12-3-23-12-19-24Z" fill="#d9e6ca" />
        <path d="m86 43 28-13 28 13v25l-28 14-28-14Zm0 0 28 14 28-14m-28 14v25m-13-45 28 14" fill="none" stroke="var(--listing-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 65c14-10 31 9 52-1m72-35c9-8 19-9 27-6" fill="none" stroke="var(--listing-brick)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 5" />
        <circle cx="155" cy="66" r="3" fill="var(--listing-brick)" />
        <path d="M60 37v13m-6.5-6.5h13" fill="none" stroke="var(--listing-muted)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>}
    </header>
  );
}
