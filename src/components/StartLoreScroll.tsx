import { useEffect, useMemo, useState } from "react";
import loreText from "../../context/pangur_brehon_cats.md?raw";

const LORE_SCROLL_DELAY_MS = 2800;

function StartLoreScroll() {
  const [scrolling, setScrolling] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setScrolling(true), LORE_SCROLL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const blocks = useMemo(
    () =>
      loreText
        .trim()
        .split(/\n\s*\n/)
        .map((block) => block.replace(/^##?\s*/, "").replace(/\*/g, "").trim())
        .filter(Boolean),
    []
  );

  return (
    <div className="start-lore-shell">
      <div
        className={`start-lore-content ${scrolling ? "scrolling" : ""} ${
          paused ? "paused" : ""
        }`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {blocks.map((block, idx) => (
          <p key={idx}>{block}</p>
        ))}
      </div>
      <div className="start-lore-fade" />
    </div>
  );
}

export default StartLoreScroll;
