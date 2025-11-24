import IncomingQueueRow from './IncomingQueueRow';

function IncomingLane() {
  return (
    <div className="incoming-lane">
      <IncomingQueueRow variant="overlay" />
      <div className="incoming-slot-grid" aria-label="Incoming mice slots">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="incoming-slot" aria-label={`Incoming slot ${idx + 1}`} />
        ))}
      </div>
    </div>
  );
}

export default IncomingLane;
