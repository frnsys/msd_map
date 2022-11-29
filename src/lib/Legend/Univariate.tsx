import * as React from 'react';
import {Props} from '../Legend';

function Univariate({onBinEnter, onBinLeave, props, stats, features}: Props) {
  const prop = props[0];
  let flip = prop.legend && prop.legend.flip;

  // Bar background
  let gradient = prop.color;
  let stops = Object.keys(gradient).map((stop) => parseFloat(stop)).sort();
  if (flip) stops.reverse();
  let gradientCss = stops.map((stop) => {
    return `${gradient[stop]} ${(flip ? 1-stop : stop)*100}%`;
  })
  const barBackground = `linear-gradient(0, ${gradientCss.join(', ')})`;

  const n = 4;
  const range = prop.range;
  const bins = [...Array(n).keys()].map((i) => {
    return <div
      key={i}
      className="legend--bar-bin"
      onMouseEnter={() => {
        let u = (n - i)/n * range[1];
        let l = (n - (i+1))/n * range[1];
        let filter = ['any',
          ['<', prop.key, l],
          ['>', prop.key, u],
        ];

        // If it's the lowest, include anything below the upper range (i.e. <=u)
        if (i == n-1) {
          filter = ['any', ['>', prop.key, u]];

        // If it's the highest, include anything above the lower range (i.e. >=l)
        } else if (i == 0) {
          filter = ['any', ['<', prop.key, l]];
        }
        onBinEnter(filter);
      }}
      onMouseLeave={onBinLeave} />
  });

  if (flip) {
    bins.reverse();
  }

  let legendSpec = prop.legend;
  let labelTexts = [
    legendSpec.minClamped ? `≤${Math.floor(range[0])}` : Math.floor(range[0]),
    legendSpec.maxClamped ? `≥${Math.ceil(range[1])}` : Math.ceil(range[1]),
  ];
  if (flip) labelTexts.reverse();

  const statPoints = stats.map((stat) => {
    let val = prop.stats[stat];
    return <Point key={stat} className="stat-point" value={val} prop={prop} />
  });
  const featPoints = features.map((feat, i) => {
    let val = feat.properties[prop.key];
    // There is a bug where if I use `feat.id` as the `key` here,
    // sometimes points stick on the legend even after those features are
    // no longer present in the `features` array.
    // So you'll get weird situations where `features.length === 1` but
    // there are 5 different points showing up on the legend.
    // Using the index as the key instead seems to resolve it.
    return <Point key={i} className="focus-point" value={val} prop={prop} />
  });

  return <>
    <div className="legend--title">{prop.nick}</div>
    <div className="legend--range">
      <div className="legend--bar" style={{background: barBackground}}>
        <div className="legend--bar-bins">{bins}</div>
        {statPoints}
        {featPoints}
      </div>
      <div className="legend--labels">
        <div>{labelTexts[1]}</div>
        <div>{labelTexts[0]}</div>
      </div>
    </div>
  </>
}

function Point({prop, value, className}: {prop: Prop, value: number, className: string}) {
  let p = (value-prop.range[0])/(prop.range[1] - prop.range[0]);
  p = Math.max(Math.min(p, 1), 0);

  let flip = prop.legend && prop.legend.flip;
  if (flip) p = 1 - p;

  return <div
    className={`legend--point ${className}`}
    style={{
      bottom: `calc(${p*100}% - 1px)`
    }} />
}

export default Univariate;
