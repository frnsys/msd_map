import * as React from 'react';

interface Props {
  props: PropMap,
  selected: string,
  onChange: (propKeys: string[]) => void,
}

function PropertySelector({props, selected, onChange}: Props) {
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

  return <div>
    <label>Display Variable</label>
    <select autoComplete="off" onChange={handler} value={selected}>
      {opts}
    </select>
  </div>
}

export default React.memo(PropertySelector);
