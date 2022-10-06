import Legend from '@/lib/Legend';
import * as React from 'react';
import type Map from '@/lib/map';
import { MAP } from '@/config';

interface Props {
  map: Map,
  props: Prop[],
  features: MapFeature[],
  noDataLabel: string,
  children: JSX.Element,
}

function MapLegend({props, map, features, noDataLabel, children}: Props) {
  const otherColors: Colors = {
    [noDataLabel]: '#520004'
  };

  const onBinEnter = React.useCallback((filter: MapboxExpression) => {
    map.setFilter(MAP.SOURCE, filter, {mute: true}, {mute: false});
  }, [map]);
  const onBinLeave = React.useCallback(() => {
    map.resetFilter(MAP.SOURCE, {mute: false});
  }, [map]);

  return <Legend
    props={props}
    features={features}
    special={otherColors}
    stats={[]}
    onBinEnter={onBinEnter}
    onBinLeave={onBinLeave}>
    {children}
  </Legend>
}

export default MapLegend;
