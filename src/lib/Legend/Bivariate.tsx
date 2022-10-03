import color from '../color';
import * as React from 'react';
import {Props} from '../Legend';

function Bivariate({onBinEnter, onBinLeave, props, stats, features}: Props) {
  let [propA, propB] = props;
  let flipA = propA.legend && propA.legend.flip;
  let flipB = propB.legend && propB.legend.flip;
  let colors = {
    a: propA.color,
    b: propB.color
  };
  let ranges = {
    a: propA.range,
    b: propB.range
  };

  const statPoints = stats.map((stat) => {
    let vals = props.map((p) => p.stats[stat]);
    return <Point className="stat-point" values={vals} props={props} />
  });
  const featPoints = features.map((feat) => {
    let vals = props.map((p) => feat.properties[p.key]);
    return <Point className="focus-point" values={vals} props={props} />
  });

  // 5x5
  const n = 5;
  const grid = [...Array(n).keys()].map((i) => {
    let cells = [...Array(n).keys()].map((j) => {
      let I = flipA ? n - i - 1 : i;
      let J = flipB ? n - j - 1 : j;
      let x = I/(n-1);
      let y = ((n-1)-J)/(n-1);

      let aColor = color.interpolate(colors.a, y);
      let bColor = color.interpolate(colors.b, x);
      let mix = color.multiply(aColor, bColor);
      let rgb = color.RGBToCSS(mix);

      return <div
        className="legend--cell"
        style={{background: rgb}}
        onMouseEnter={() => {
          // j -> a
          let a_rng = ranges.a[1] - ranges.a[0];
          let a_l = ranges.a[0] + (a_rng * (n-J-1)/n);
          let a_u = ranges.a[0] + (a_rng * (n-J)/n);

          // i -> b
          let b_rng = ranges.b[1] - ranges.b[0];
          let b_l = ranges.b[0] + (b_rng * I/n);
          let b_u = ranges.b[0] + (b_rng * (I+1)/n);

          // Select features _outside_ of this range,
          // to mute them
          let filter: any[] = ['any'];

          // If it's the lowest, include anything below the upper range (i.e. <=u)
          // If it's the highest, include anything above the lower range (i.e. >=l)
          if (i == n-1) {
            filter.push(['>', propB.key, b_u]);
          } else if (i == 0) {
            filter.push(['<', propB.key, b_l]);
          } else {
            filter.push(['<', propB.key, b_l]);
            filter.push(['>', propB.key, b_u]);
          }

          if (j == n-1) {
            filter.push(['>', propA.key, a_u]);
          } else if (j == 0) {
            filter.push(['<', propA.key, a_l]);
          } else {
            filter.push(['<', propA.key, a_l]);
            filter.push(['>', propA.key, a_u]);
          }

          onBinEnter(filter);
        }}
        onMouseLeave={onBinLeave} />
    });
    return <div>{cells}</div>
  });

  return <>
    <div className="legend--bivariate-wrapper">
      <div className="legend--bivariate-container">
        <div className="legend--grid-container">
          <Label prop={propA} />
          <div className="legend--grid">
            {grid}
            {statPoints}
            {featPoints}
          </div>
          <Label prop={propB} isX={true} />
          <div className="legend--bivariate-label legend--bivariate-label-a">{propA.nick}</div>
          <div className="legend--bivariate-label">{propB.nick}</div>
        </div>
      </div>
    </div>
  </>
}

function Point({props, values, className}: {props: Prop[], values: number[], className: string}) {
  let [valA, valB] = values;
  let [propA, propB] = props;
  let p_a = (valA-propA.range[0])/(propA.range[1] - propA.range[0]);
  let p_b = (valB-propB.range[0])/(propB.range[1] - propB.range[0]);
  p_a = Math.max(Math.min(p_a, 1), 0);
  p_b = Math.max(Math.min(p_b, 1), 0);

  let [flipA, flipB] = props.map((p) => p.legend && p.legend.flip);
  if (flipA) p_a = 1 - p_a;
  if (flipB) p_b = 1 - p_b;

  return <div
    className={`legend--bivariate-point ${className}`}
    style={{
      left: `calc(${p_b*100}% - ${12/2}px)`,
      bottom: `calc(${p_a*100}% - ${12/2}px)`,
    }} />
}

function Label({prop, isX}: {prop: Prop, isX?: boolean}) {
  const {legend, range} = prop;
  const flip = legend && legend.flip;

  let labelTexts = [
    legend.minClamped ? `≤${Math.floor(range[0])}` : Math.floor(range[0]),
    legend.maxClamped ? `≥${Math.ceil(range[1])}` : Math.ceil(range[1]),
  ];
  if (flip) labelTexts.reverse();

  return <div
    className={`legend--labels ${isX ? 'legend--labels_x' : ''}`}>
    <div>{labelTexts[1]}</div>
    <div>{labelTexts[0]}</div>
  </div>
}

export default Bivariate;
