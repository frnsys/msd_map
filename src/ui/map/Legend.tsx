import Legend from '@/lib/Legend';
import * as React from 'react';
import type Map from '@/lib/map';
import { MAP_SOURCE } from '../Map';

interface Props {
  map: Map,
  props: Prop[],
  features: MapFeature[],
  noDataLabel: string,
}

function MapLegend({props, map, features, noDataLabel}: Props) {
  const otherColors: Colors = {
    [noDataLabel]: '#520004'
  };

  const onBinEnter = React.useCallback((filter: MapboxExpression) => {
    map.setFilter(MAP_SOURCE, filter, {mute: true}, {mute: false});
  }, [map]);
  const onBinLeave = React.useCallback(() => {
    map.resetFilter(MAP_SOURCE, {mute: false});
  }, [map]);

  return <Legend
    props={props}
    features={features}
    special={otherColors}
    stats={['min']}
    onBinEnter={onBinEnter}
    onBinLeave={onBinLeave} />
}

export default MapLegend;
