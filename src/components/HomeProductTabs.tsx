'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

interface ProductTab {
  id: string;
  label: string;
  content: ReactNode;
}

export function HomeProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  }

  return (
    <>
      <div className="home-shop-tabs" role="tablist" aria-label="Chọn theo mô hình quán">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={element => { buttons.current[index] = element; }}
            type="button"
            role="tab"
            id={`home-shop-tab-${tab.id}`}
            aria-controls={`home-shop-panel-${tab.id}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={event => onKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          id={`home-shop-panel-${tab.id}`}
          className="home-shop-panel"
          role="tabpanel"
          aria-labelledby={`home-shop-tab-${tab.id}`}
          tabIndex={0}
          hidden={active !== index}
        >
          {tab.content}
        </div>
      ))}
    </>
  );
}
