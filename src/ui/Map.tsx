import Info from './Info';
import Map from '@/lib/map';
import { MAP, COLORS } from '@/config';
import { SchoolAPI } from '@/api';
import MapLegend from './map/Legend';
import IconLegend from './map/IconLegend';
import PlaceSelector from './map/PlaceSelector';
import RegionSelector from './map/RegionSelector';
import PropertySelector from './map/PropertySelector';
import type { MapMouseEvent } from 'mapbox-gl';
import util from '@/util';
import Painter from '@/lib/paint';
import * as React from 'react';

const schoolAPI = new SchoolAPI();
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

const schoolIconLegend = [[{
  label: 'Public',
  style: {background: '#33C377'}
}, {
  label: 'Private not-for-profit',
  style: {background: '#ffcc00'}
}, {
  label: 'Private for-profit',
  style: {background: '#05a1ff'}
}], [{
  label: 'Bachelor Degree',
  style: {border: '2px solid #000'}
}, {
  label: 'Associate Degree',
  style: {border: '2px solid #888'}
}, {
  label: 'Below Associate Degree',
  style: {border: '2px solid #fff'}
}]];

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
    'schools': {
      'type': 'geojson',
      'data': `assets/maps/schools.geojson`
    }
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
    text: <></>,
  });

  const mapEl = React.useRef();
  const [map, setMap] = React.useState<Map>();
  React.useEffect(() => {
    const map_ = createMap(
      config.MAP_ID,
      mapEl.current,
      props,
      config.MIN_ZOOM,

      // onMouseMove
      (features, ev) => {
        let feats = features['main'] || [];
        let schools = features['schools'] || [];
        if (schools.length > 0) {
          setTipState({...tipState, display: 'none'});
          let promises = schools.map((s) => schoolAPI.dataForSchool(s.properties.id));
          Promise.all(promises).then((data) => {
            let schoolInfo = data.map((d) => {
              return <div className="tip-school-info" key={d['MAPNAME']}>
                <em>{d['MAPNAME']}</em>
                <div>Tuition & Fees: {formatter.format(d['Tuition & Fees'])}</div>
                <div>Undergraduates: {d['Degree-seeking Undergraduates'] || 'N/A'}</div>
                <div>Graduates: {d['Graduate Students'] || 'N/A'}</div>
              </div>
            });
            setTipState({
              text: <>
                {feats.length > 0 && <h5>{feats[0].properties.name}</h5>}
                {schoolInfo}
              </>,
              display: 'block',
              left: `${ev.originalEvent.offsetX+10}px`,
              top: `${ev.originalEvent.offsetY+10}px`,
            });

          });
        } else if (feats.length > 0) {
          setTipState({
            text: <>
              <h5>{feats[0].properties.name}</h5>
            </>,
            display: 'block',
            left: `${ev.originalEvent.offsetX+10}px`,
            top: `${ev.originalEvent.offsetY+10}px`,
          });
        } else {
          setTipState({...tipState, display: 'none'});
        }
      },

      // onFocusFeatures
      (features) => {
        // If features, render
        let newFeats = features['main'];
        if (newFeats.length > 0) {
          map_.focusFeatures(MAP.SOURCE, newFeats);
          setFeats((feats) => {
            // Only update if the features have actually changed;
            let fingerprint = newFeats.map((f) => f.id.toString()).join('-');
            let existing = feats.map((f) => f.id.toString()).join('-');
            if (fingerprint === existing) return feats;

            return newFeats;
          });

        // Otherwise, hide
        // if we don't already have no feats
        } else if (feats.length > 0){
          setFeats([]);
        }
      });
    map_.map.on('dragstart', () => {
      setTipState({...tipState, display: 'none'});
    });
    setMap(map_);
  }, []);

  // Update map props when props change
  React.useEffect(() => {
    if (map && map.map.loaded()) map.set('main', props);
  }, [props]);

  // Update map props when category changes
  React.useEffect(() => {
    let newProps = props.map((prop) => {
      let [p, ..._] = util.keyParts(prop.key);
      return config.PROPS[util.propForCat(p, cat)];
    });
    setProps(newProps);
  }, [cat]);

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
      // setFeats([feat]);
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

  const setYear = React.useCallback((year: string) => {
    setCat((cat) => {
      let _cat = {...cat};
      _cat['Y'] = year;
      return _cat;
    });
  }, []);

  // Necessary to prevent re-renders in MapLegend;
  // see <https://stackoverflow.com/questions/72409549/why-react-memo-doesnt-work-with-props-children-property>
  const propertySelector = React.useMemo(() => {
    return <PropertySelector
      hideLabel={true}
      label="Display Variable"
      props={config.PROPS}
      selected={props[0].key}
      onChange={onPropertySelect} />
  }, [props, onPropertySelect]);

  return <div>
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
          {propertySelector}
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
        placeNamePlural={config.PLACE_NAME_PLURAL}
        setYear={setYear}
      />
    </section>
    <IconLegend iconGroups={schoolIconLegend} />
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
