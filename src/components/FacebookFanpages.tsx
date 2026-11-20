import { ArrowUpRight } from 'lucide-react';
import { FacebookPageFrame } from './FacebookPageFrame';

export function FacebookFanpages({ pages }: { pages: { id: string; name: string; url: string }[] }) {
  return (
    <aside aria-labelledby="facebook-fanpages" className="home-social">
      <h2 id="facebook-fanpages">Fanpage Facebook</h2>
      <ul>
        {pages.map(({ id, name, url }) => (
          <li key={id}>
            <h3>{name}</h3>
            <FacebookPageFrame key={url} name={name} pageUrl={url} />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Mở ${name} trên Facebook`}
              className="home-more"
            >
              Mở trên Facebook
              <ArrowUpRight size={16} className="shrink-0" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
