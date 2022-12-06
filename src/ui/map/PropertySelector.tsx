import util from '@/util';
import * as React from 'react';
import Select from 'react-select';

interface Props {
  props: PropMap,
  label: string,
  selected: string,
  hideLabel?: boolean,
  onChange: (propKeys: string[]) => void,
}

type OptionType = {
  value: string,
  label: string,
}

function PropertySelector({props, selected, onChange, label, hideLabel}: Props) {
  const options = Object.keys(props).filter((property) => {
    // Skip categorized properties
    return !property.includes('.');
  }).map((property) => {
    let prop = props[property];
    return {
      value: property,
      label: prop.desc
    }
  });

  const handler = React.useCallback(({value}: OptionType) => {
    let propKeys = value.split(',');
    onChange(propKeys);
  }, [onChange]);

  let [current, ..._rest] = util.keyParts(selected);
  let title = props[current].desc;
  return <div className="property-selector" title={title}>
    {!hideLabel && <label>{label}</label>}
    <Select aria-label={label}
      options={options}
      onChange={handler}
      value={{
        value: current,
        label: props[current].desc
      }}
      styles={{
        control: (baseStyles, _state) => ({
          ...baseStyles,
          minHeight: 0,
          background: 'none',
          border: 0,
          marginBottom: '2px',
          fontSize: '0.8em',
        }),
        singleValue: (baseStyles, _state) => ({
          ...baseStyles,
          color: '#fff',
          fontWeight: 'bold',
          overflow: 'visible',
          textAlign: 'center',
          whiteSpace: 'normal',
        }),
        menu: (baseStyles, _state) => ({
          ...baseStyles,
          fontSize: '12px',
          color: '#000',
        }),
        input: (baseStyles, _state) => ({
          ...baseStyles,
          padding: 0,
          margin: 0,
        }),
        valueContainer: (baseStyles, _state) => ({
          ...baseStyles,
          padding: 0
        }),
        dropdownIndicator: (baseStyles, _state) => ({
          ...baseStyles,
          padding: '0 0 0 2px',
          width: '20px',
          color: 'hsl(0deg 79% 66%)',
          marginTop: '-6px',
        }),
        indicatorSeparator: (_baseStyles, _state) => ({
          display: 'none',
        })
      }}/>
  </div>
}

export default React.memo(PropertySelector);
