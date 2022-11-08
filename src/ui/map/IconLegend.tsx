import * as React from 'react';

type IconLegend = {
  label: string,
  style: React.CSSProperties,
}

function IconLegend({iconGroups}: {iconGroups: IconLegend[][]}) {
  return <div className="icon-legend">
    <div className="icon-legend--icons">
      {iconGroups.map((group) => {
        return group.map((legend) => {
          return <div className="icon-legend-key" key={legend.label}>
            <span className="icon-key" style={legend.style}></span>
            <span>{legend.label}</span>
          </div>
        })
      })}
    </div>
    <div className="icon-legend--note">Schools appear at higher zoom levels.</div>
  </div>
}

export default React.memo(IconLegend);
