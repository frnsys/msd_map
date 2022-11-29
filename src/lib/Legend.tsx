import * as React from 'react';
import Bivariate from './Legend/Bivariate';
import Univariate from './Legend/Univariate';

export interface Props {
  props: Prop[]
  stats: string[],
  special: Colors,
  features: MapFeature[],
  onBinEnter: (filter: MapboxExpression) => void,
  onBinLeave: () => void,
  children?: JSX.Element,
}

function Legend(props: Props) {
  // Special keys, if any
  let specs = [props.special].concat(props.props.map((p) => (p.legend || {}).special || {}));
  let specials = specs.reduce((acc, s) => {
    Object.keys(s).forEach((k) => acc[k] = s[k]);
    return acc;
  }, {});

  const bivariate = props.props.length > 1;
  return <div className={`legend ${bivariate ? 'legend--bivariate' : 'legend-univariate'}`}>
    {props.children}
    {bivariate ?
      <Bivariate {...props} />
      : <Univariate {...props} />}
    <div className="legend--special">
      {Object.keys(specials).map((key) => {
        let color = specials[key];
        return <div key={key} className="legend--single">
          <div className="legend--single-color" style={{background: color}} />
          <span>{key}</span>
        </div>
      })}
    </div>
  </div>
}

export default Legend;
