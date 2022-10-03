import * as React from 'react';
import R from 'data/gen/regions.json';

const REGIONS = R as {[key:string]: number[]};
const alwaysInclude = ['Alaska', 'Hawaii', 'Puerto Rico'];

interface Props {
  excludeTerritories: boolean,
  onSelect: (bbox: Bounds) => void,
}

const RegionSelector = (props: Props) => {
  const regions = Object.keys(REGIONS)
    .sort((a, b) => a.localeCompare(b))
    .filter((name) => !props.excludeTerritories || alwaysInclude.includes(name))
    .map((name) => {
        let bbox = REGIONS[name] as Bounds;
        return <div key={name} onClick={() => props.onSelect(bbox)}>{name}</div>
    });
  return <div className="map-regions">{regions}</div>
}

export default React.memo(RegionSelector);
