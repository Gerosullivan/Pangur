import { useEffect, useMemo, useRef } from 'react';
import { useTutorialStore } from '../state/tutorialStore';

const tokenSelectorMap: Record<string, string[]> = {
  'incoming-lane': ['.incoming-lane'],
  'board-wrapper': ['.board-wrapper'],
  'board-all-cells': ['.board-cell'],
  'cats-staging': ['.panel-staging'],
  'cats-on-board': ['.board-cell .cat'],
  'resident-mice': ['.board-cell .mouse'],
  'shadow-cells': ['.board-cell.shadow'],
  'gate-line': ['.board-cell.gate'],
  'top-bar-metric': ['.top-bar-metric'],
};

const catSelectorMap: Record<string, string[]> = {
  pangur: ['[aria-label^="Pangur"]'],
  baircne: ['[aria-label^="Baircne"]'],
  guardian: ['[aria-label^="Breonne"]', '[aria-label^="Guardian"]'],
};

function getElementsForToken(token: string): Element[] {
  const mappedSelectors = tokenSelectorMap[token];
  if (mappedSelectors) {
    return mappedSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
  }

  const catSelectors = catSelectorMap[token];
  if (catSelectors) {
    return catSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
  }

  // Button token syntax: button:Label Text
  if (token.startsWith('button:')) {
    const label = token.slice('button:'.length).toLowerCase();
    return Array.from(document.querySelectorAll('button')).filter((btn) =>
      btn.textContent?.toLowerCase().includes(label)
    );
  }

  // Cell id like C4, B5, etc. matches aria-label "Cell C4"
  if (/^[A-E][1-5]$/.test(token)) {
    const selector = `[aria-label="Cell ${token}"]`;
    return Array.from(document.querySelectorAll(selector));
  }

  // Fallback to direct selector
  return Array.from(document.querySelectorAll(token));
}

function TutorialHighlights() {
  const step = useTutorialStore((state) => (state.active ? state.steps[state.index] : undefined));
  const highlights = step?.highlights ?? [];
  const prevElements = useRef<Element[]>([]);

  const tokens = useMemo(() => highlights, [highlights]);

  useEffect(() => {
    // Remove old highlights
    prevElements.current.forEach((el) => {
      el.classList.remove('outline-pulse');
    });

    if (tokens.length === 0 || !step) {
      prevElements.current = [];
      return;
    }

    const nextElements: Element[] = [];
    tokens.forEach((token) => {
      const elements = getElementsForToken(token);
      elements.forEach((el) => {
        el.classList.add('outline-pulse');
        nextElements.push(el);
      });
    });
    prevElements.current = nextElements;

    return () => {
      nextElements.forEach((el) => el.classList.remove('outline-pulse'));
    };
  }, [tokens, step]);

  // Note: In an earlier iteration we drew absolute-positioned overlay divs for highlights.
  // If we ever need to revert to that approach (e.g., to ensure consistent sizing independent of target styles),
  // we could reintroduce rendering a layer of <div className="tutorial-highlight"> elements sized to target rects.
  // This direct-class approach keeps DOM simpler and avoids positioning logic.

  return null;
}

export default TutorialHighlights;
