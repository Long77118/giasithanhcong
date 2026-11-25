/** Reveal the targets below the initial viewport once. Existing data-reveal attributes are restored on cleanup. */
export function observeScrollReveal(root: HTMLElement, selector = '[data-reveal]'): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stop: (() => void) | undefined;

  const start = () => {
    const targets = new Map<HTMLElement, string | null>();
    const restore = (element: HTMLElement, original: string | null) => {
      if (original === null) element.removeAttribute('data-reveal');
      else element.setAttribute('data-reveal', original);
      element.removeAttribute('data-reveal-step');
    };

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting && entry.target.getAttribute('data-reveal') === 'pending');
      visible.forEach(({ target }, index) => {
        const element = target as HTMLElement;
        observer.unobserve(element);
        element.dataset.revealStep = String(Math.min(index, 3));
        element.dataset.reveal = 'entering';
      });
    }, { threshold: .06 });

    const scan = () => {
      for (const [element, original] of targets) {
        if (root.contains(element)) continue;
        observer.unobserve(element);
        restore(element, original);
        targets.delete(element);
      }
      for (const element of root.querySelectorAll<HTMLElement>(selector)) {
        if (targets.has(element) || !element.getClientRects().length) continue;
        targets.set(element, element.getAttribute('data-reveal'));
        const isBelowViewport = element.getBoundingClientRect().top >= window.innerHeight;
        element.dataset.reveal = isBelowViewport ? 'pending' : 'shown';
        if (isBelowViewport) observer.observe(element);
      }
    };

    const showFocusedTarget = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let element = event.target.closest<HTMLElement>('[data-reveal]');
      while (element && root.contains(element)) {
        if (targets.has(element)) {
          observer.unobserve(element);
          element.dataset.reveal = 'shown';
        }
        element = element.parentElement?.closest<HTMLElement>('[data-reveal]') ?? null;
      }
    };

    const additions = new MutationObserver(scan);
    additions.observe(root, { childList: true, subtree: true });
    root.addEventListener('focusin', showFocusedTarget);
    scan();

    return () => {
      additions.disconnect();
      observer.disconnect();
      root.removeEventListener('focusin', showFocusedTarget);
      for (const [element, original] of targets) restore(element, original);
    };
  };

  const sync = () => {
    stop?.();
    stop = motion.matches ? undefined : start();
  };
  motion.addEventListener('change', sync);
  sync();
  return () => {
    motion.removeEventListener('change', sync);
    stop?.();
  };
}
