import Info from './Info';
import Map from '@/lib/map';
import { MAP, COLORS } from '@/config';
import MapLegend from './map/Legend';
import PlaceSelector from './map/PlaceSelector';
import RegionSelector from './map/RegionSelector';
import PropertySelector from './map/PropertySelector';
import type { MapMouseEvent } from 'mapbox-gl';
import util from '@/util';
import Painter from '@/lib/paint';
import * as React from 'react';

function createMap(
  mapId: string,
  container: HTMLElement,
  props: Prop[],
  minZoom: number,
  onMouseMove: (features: SourceMapping<MapFeature[]>, ev: MapMouseEvent) => void,
  onFocusFeatures: (features: SourceMapping<MapFeature[]>, ev: MapMouseEvent) => void) {

  const sources = {
    'main': {
      'type': 'vector',
      'url': `mapbox://${mapId}`
    },
  };

  const painter = new Painter(COLORS);
  const map = new Map({
    container,
    ...MAP.CONFIG as MapboxConfig,
  }, sources, MAP.LAYERS, {'main': props}, painter, onFocusFeatures, (features, ev) => {
    // Ignore at low zoom levels, gets really choppy
    if (map.map.getZoom() <= minZoom) {
      onMouseMove({}, ev);
      return;
    }

    onMouseMove(features, ev);
    if (!map.focusedLock) {
      onFocusFeatures(features, ev);
    }
  });
  return map;
}

function MapTool({config}: {config: MapConfig}) {
  const [cat, setCat] = React.useState(config.INITIAL_STATE.cat);
  const [props, setProps] = React.useState(config.INITIAL_STATE.props);
  const [feats, setFeats] = React.useState<MapFeature[]>([]);
  const [tipState, setTipState] = React.useState({
    top: `0px`,
    left: `0px`,
    display: 'none',
    text: '',
  });

  const mapEl = React.useRef();
  const [map, setMap] = React.useState<Map>();
  React.useEffect(() => {
    const map_ = createMap(
      config.MAP_ID,
      mapEl.current,
      props,
      config.MIN_ZOOM,
      (features, ev) => {
        let feats = features['main'] || [];
        if (feats.length > 0) {
          setTipState({
            text: feats[0].properties.name,
            display: 'block',
            left: `${ev.originalEvent.offsetX+10}px`,
            top: `${ev.originalEvent.offsetY+10}px`,
          });
        } else {
          setTipState({...tipState, display: 'none'});
        }
      },
      (features) => {
        // If features, render
        let feats = features['main'];
        if (feats.length > 0) {
          map_.focusFeatures(MAP.SOURCE, feats);
          setFeats(feats);

        // Otherwise, hide
        } else {
          // TODO?
          // if (features['composite']) {
          //   info.empty();
          // }
          setFeats([]);
        }
      });
    map_.map.on('dragstart', () => {
      setTipState({...tipState, display: 'none'});
    });
    setMap(map_);
  }, []);
  React.useEffect(() => {
    if (map) map.set('main', props);
  }, [props]);

  // Resize the map when visibility changes
  const visible = useVisible(mapEl);
  React.useEffect(() => {
    if (visible) map.map.resize();
  }, [visible]);

  let mapOverlay;
  if (props.some((p) => config.UI.NO_DATA.includes(p.key))) {
    mapOverlay = <div className="map-notification">No data available for this selection.</div>;
  }

  const onPropertySelect = React.useCallback((propKeys: string[]) => {
    let newProps = propKeys.map((p) => config.PROPS[util.propForCat(p, cat)]);
    setProps(newProps);
  }, [config]);
  const onPlaceSelect = React.useCallback((bbox: Bounds, place: string) => {
    map.fitBounds(bbox);
    map.featsByProp(MAP.SOURCE, 'id', place, (feats) => {
      let feat = feats[0];
      map.focusFeatures(MAP.SOURCE, [feat]);
      setFeats([feat]);
    });
  }, [map]);
  const onRegionSelect = React.useCallback((bbox: Bounds) => {
    map.fitBounds(bbox);
  }, [map]);
  const hideTooltip = React.useCallback(() => {
    setTipState((cur) => {
      return {...cur, display: 'none'};
    });
  }, []);

  return <div className="map-wrapper">
    <section className="stage">
      <RegionSelector
        onSelect={onRegionSelect}
        excludeTerritories={config.UI.NO_TERRITORIES} />
      <div className="map-wrapper" onMouseLeave={hideTooltip}>
        {mapOverlay}
        <div className="map" ref={mapEl}></div>
        <div className="map-tooltip" style={tipState}>{tipState.text}</div>
        {(map && map.focusedLock) ?
          <div className="map-help">Press <span className="hotkey">Esc</span> to unselect.</div>
          : <div className="map-help"><span className="hotkey">Click</span> on a place to select it.</div>}
        <MapLegend
          map={map}
          props={props}
          features={feats}
          noDataLabel={`No ${config.PLACE_NAME}`}>
          <PropertySelector
            hideLabel={true}
            label="Display Variable"
            props={config.PROPS}
            selected={props[0].key}
            onChange={onPropertySelect} />
        </MapLegend>
        {!config.UI.NO_PLACE_SELECTOR && <PlaceSelector
          loa={config.LOA}
          name={config.PLACE_NAME}
          idLength={config.UI.PLACE_ID_LENGTH}
          onSelect={onPlaceSelect} />}
      </div>
      <Info
        loa={config.LOA}
        category={cat}
        features={feats}
        defaultMsg={config.INFO}
        placeNamePlural={config.PLACE_NAME_PLURAL} />
    </section>
  </div>
}

// Hook for when an element's visibility changes
function useVisible<T extends Element>(ref: React.MutableRefObject<T>) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.intersectionRatio > 0);
      }, {
        root: document.documentElement
      });
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      observer.unobserve(ref.current);
    };
  }, [ref]);
  return visible;
}

export default React.memo(MapTool);
