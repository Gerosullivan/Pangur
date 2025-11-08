interface IncomingMiceRowProps {
  queueCount: number;
  totalMeow: number;
}

function IncomingMiceRow({ queueCount, totalMeow }: IncomingMiceRowProps) {
  const scaredCount = Math.min(totalMeow, queueCount);
  const regularCount = Math.max(0, queueCount - scaredCount);

  return (
    <div className="incoming-mice-row">
      <div className="mouse-queue-container">
        {/* Scared mice */}
        {Array.from({ length: scaredCount }).map((_, i) => (
          <div key={`scared-${i}`} className="incoming-mouse scared">
            😱
          </div>
        ))}
        {/* Regular mice */}
        {Array.from({ length: regularCount }).map((_, i) => (
          <div key={`regular-${i}`} className="incoming-mouse">
            🐭
          </div>
        ))}
      </div>
      {totalMeow > 0 && (
        <div className="deterrence-label">
          Deterring: {scaredCount} mice
        </div>
      )}
    </div>
  );
}

export default IncomingMiceRow;
