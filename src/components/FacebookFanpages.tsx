import { ArrowUpRight, Facebook } from 'lucide-react';
import { FacebookPageFrame } from './FacebookPageFrame';

export function FacebookFanpages({ pages }: { pages: { id: string; name: string; url: string }[] }) {
  return (
    <section aria-labelledby="facebook-fanpages" className="home-social">
      <div className="home-social-heading">
        <h2 id="facebook-fanpages">Ghé nhà bên mình trên Facebook</h2>
        <p>Xem mẫu bao bì, đọc mẹo chọn đồ cho quán và trò chuyện cùng bên mình.</p>
      </div>

      <svg className="home-social-doodle home-social-doodle--top" viewBox="0 0 208 108" aria-hidden="true" focusable="false">
        <path fill="var(--home-sage)" d="M55 56C76 17 123 32 151 16c11-6 23-10 34-3 18 12 11 37-5 50-19 15-46 10-65 27-17 14-51 20-64-2-6-10-2-23 4-32Z" />
        <path d="M48 81c36-30 74-6 105-32 12-10 16-23 10-30-7-9-27-5-42 6" fill="none" stroke="var(--home-accent)" strokeWidth="2" strokeLinecap="round" />
        <path d="M92 17v14m-7-7h14M188 71v16m-8-8h16" fill="none" stroke="var(--home-sage-ink)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="37" cy="46" r="4" fill="var(--home-accent)" />
        <circle cx="118" cy="75" r="3" fill="var(--home-sage-ink)" />
      </svg>
      <svg className="home-social-doodle home-social-doodle--bottom" viewBox="0 0 132 62" aria-hidden="true" focusable="false">
        <path d="M10 30c18-21 38-6 57 3 16 7 36 5 53-11" fill="none" stroke="var(--home-accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 6" />
        <path d="M40 32v18m-9-9h18m27-33v12m-6-6h12" fill="none" stroke="var(--home-sage-ink)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="13" r="4" fill="var(--home-sage-ink)" />
      </svg>

      <ul className="home-fanpage-list" role="list">
        {pages.map(({ id, name, url }) => (
          <li key={id} className="home-fanpage">
            <div className="home-fanpage-bar">
              <span className="home-fanpage-dots" aria-hidden="true"><i /><i /><i /></span>
              <h3>{name}</h3>
            </div>
            <div className="home-fanpage-body">
              <div className="home-fanpage-label">
                <span className="home-fanpage-chip"><Facebook size={16} fill="currentColor" aria-hidden="true" /></span>
                Bài mới nhất
              </div>
              <FacebookPageFrame key={url} name={name} pageUrl={url} />
              <p className="home-fanpage-fallback">
                Không thấy khung?{' '}
                <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Mở trên Facebook: ${name} (tab mới)`}>
                  Mở trên Facebook
                </a>
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Theo dõi bên mình: ${name} trên Facebook (tab mới)`}
                className="home-more home-fanpage-follow"
              >
                Theo dõi bên mình
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
