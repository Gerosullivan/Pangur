interface TopBarProps {
  grain: number;
  wave: number;
}

function TopBar({ grain, wave }: TopBarProps) {
  return (
    <div className="top-bar">
      <div className="title-block">
        Pangur <span style={{ fontSize: '16px', color: '#F2F2F2' }}>Wave {wave}</span>
      </div>
      <div className="grain-counter">
        <span>🌾</span>
        <span>Grain {grain}</span>
      </div>
    </div>
  );
}

export default TopBar;
