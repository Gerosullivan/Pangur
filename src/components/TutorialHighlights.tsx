import { useEffect, useMemo, useState } from 'react';
import { useTutorialStore } from '../state/tutorialStore';

type HighlightRect = { top: number; left: number; width: number; height: number };

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
  const step = useTutorialStore((state) => state.steps[state.index]);
  const highlights = step?.highlights ?? [];
  const [rects, setRects] = useState<HighlightRect[]>([]);

  const tokens = useMemo(() => highlights, [highlights]);

  const recompute = () => {
    if (tokens.length === 0) {
      setRects([]);
      return;
    }
    const nextRects: HighlightRect[] = [];
    tokens.forEach((token) => {
      const elements = getElementsForToken(token);
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        nextRects.push({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      });
    });
    setRects(nextRects);
  };

  useEffect(recompute, [tokens]);

  useEffect(() => {
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [tokens]);

  if (!step) return null;

  return (
    <div className="tutorial-highlight-layer" aria-hidden>
      {rects.map((rect, idx) => (
        <div
          key={`${rect.top}-${rect.left}-${idx}`}
          className="tutorial-highlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ))}
    </div>
  );
}

export default TutorialHighlights;
