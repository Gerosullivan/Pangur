// CatCard component - Displays a cat with stats and health
import { useState } from "react";
import "./CatCard.css";

function CatCard({
  cat,
  visualClass,
  indicator,
  statClasses = {},
  statOverrides = {},
  heartOverride = null,
  draggable = false,
  onDragStart,
}) {
  const [isDragging, setIsDragging] = useState(false);
  // Render hearts for health display
  const renderHearts = () => {
    const filled = Math.round(cat.health);
    const empty = Math.max(0, cat.maxHealth - filled);

    const hearts = [];

    for (let i = 0; i < filled; i += 1) {
      const isLast = i === filled - 1;
      if (heartOverride?.type === 'gain' && isLast) {
        hearts.push(<span key={`filled-${i}`}>💚</span>);
      } else {
        hearts.push(<span key={`filled-${i}`}>❤️</span>);
      }
    }

    const damageAmount = heartOverride?.damage ?? 1;
    for (let i = 0; i < empty; i += 1) {
      // Show black hearts for the first N empty hearts where N = damage amount
      if (heartOverride?.type === 'loss' && i < damageAmount) {
        hearts.push(<span key={`empty-${i}`}>🖤</span>);
      } else {
        hearts.push(<span key={`empty-${i}`}>🤍</span>);
      }
    }

    return <>{hearts}</>;
  };

  const getStatValue = (statKey) => {
    const override = statOverrides?.[statKey];
    if (override === null || override === undefined) {
      return cat[statKey];
    }
    return override;
  };

  const getStatClass = (statKey) => {
    const cls = statClasses?.[statKey];
    return cls ? `stat-value ${cls}` : "stat-value";
  };

  // Get role image filename
  const getRoleImage = () => {
    // Map role to image filename
    const imageMap = {
      rincne: "Rincne",
      cruibne: "Cruibne",
      breoinne: "Breonne",
      baircne: "Baircne",
      meoinne: "Meoinne",
      folum: "Folum",
    };
    return imageMap[cat.role] || "Rincne";
  };

  const isDead = cat.health <= 0;

  const handleDragStart = (e) => {
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(e);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`cat-card ${isDead ? "dead" : ""} ${visualClass || ""} ${isDragging ? "dragging" : ""}`}
      data-cat-id={cat.id}
      data-cat-position={cat.position}
      data-attack-id={`cat-${cat.id}`}
      style={{ position: "relative" }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Visual indicator (e.g., meow emoji) */}
      {indicator && (
        <span
          className="cat-indicator"
          style={{
            position: "absolute",
            top: "-110px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "72px",
            zIndex: 10,
            textShadow: "0 0 10px rgba(0, 136, 255, 0.5)",
          }}
        >
          {indicator}
        </span>
      )}
      {/* Cat image */}
      <div className="cat-image">
        <img src={`/${getRoleImage()}.png`} alt={cat.roleName} />

        {/* Catch stat overlay (top left) */}
        <div className="stat-icon-overlay stat-icon-catch">
          <img src="/claw.png" alt="Catch" className="stat-icon" />
          <span data-stat="catch" className={getStatClass("catch")}>
            {getStatValue("catch")}
          </span>
        </div>

        {/* Meow stat overlay (top right) */}
        <div className="stat-icon-overlay stat-icon-meow">
          <img src="/meow.png" alt="Meow" className="stat-icon" />
          <span data-stat="meow" className={getStatClass("meow")}>
            {getStatValue("meow")}
          </span>
        </div>

        {/* Name overlay */}
        <div className="cat-name-overlay">
          <strong>{cat.name}</strong>
        </div>

        {/* Role overlay */}
        <div className="cat-role-overlay">{cat.roleName}</div>
      </div>

      {/* Health hearts */}
      <div className="cat-vitals">
        <div className="stat-emoji-container">{renderHearts()}</div>
      </div>
    </div>
  );
}

export default CatCard;
