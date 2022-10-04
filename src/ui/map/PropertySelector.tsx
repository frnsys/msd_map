import util from '@/util';
import * as React from 'react';

interface Props {
  props: PropMap,
  label: string,
  selected: string,
  hideLabel?: boolean,
  onChange: (propKeys: string[]) => void,
}

function PropertySelector({props, selected, onChange, label, hideLabel}: Props) {
  const opts = Object.keys(props).map((property) => {
    // Skip categorized properties
    if (property.includes('.')) return;

    let prop = props[property];
    return <option key={property} value={property}>
      {prop.desc}
    </option>
  });

  const handler = React.useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
    let propKeys = ev.target.value.split(',');
    onChange(propKeys);
  }, [onChange]);

  let [current, ..._rest] = util.keyParts(selected);
  let title = props[current].desc;
  return <div className="property-selector" title={title}>
    {!hideLabel && <label>{label}</label>}
    <select aria-label={label} autoComplete="off" onChange={handler} value={current}>
      {opts}
    </select>
  </div>
}

export default React.memo(PropertySelector);
