import Info from './Info';
import Map from '@/lib/map';
import { MAP, COLORS } from '@/config';
import MapLegend from './map/Legend';
import IconLegend from './map/IconLegend';
import PlaceSelector from './map/PlaceSelector';
import RegionSelector from './map/RegionSelector';
import PropertySelector from './map/PropertySelector';
import { FeatureAPI, SchoolAPI } from '@/api';
import type { MapMouseEvent } from 'mapbox-gl';
import util from '@/util';
import Painter from '@/lib/paint';
import * as React from 'react';
import regions from 'data/gen/regions.json';

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
      'data': `assets/maps/schools.geojson`,
      'promoteId': 'id'
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

  map.map.on('load', () => {
    let bbox = regions['Mainland'];
    map.fitBounds(bbox as Bounds);
  });
  return map;
}

function getMaybeRaceVariable(val: any) {
  if (typeof val == 'number') {
    return val;
  } else {
    return val['R:ALL'];
  }
}

async function setTooltip(
  features: SourceMapping<MapFeature[]>,
  ev: MapMouseEvent,
  loa: string,
  cat: Category,
  props: Prop[],
  api: FeatureAPI,
  setTipState: React.Dispatch<React.SetStateAction<TipState>>) {
  let feats = features['main'] || [];
  let schools = features['schools'] || [];

  if (schools.length === 0 && feats.length === 0) {
    setTipState((tipState) => ({...tipState, display: 'none'}));
    return
  }

  let schoolInfo = null;
  if (schools.length > 0) {
    let promises = schools.map((s) => schoolAPI.dataForSchool(s.properties.id));
    let schoolData = await Promise.all(promises);
    schoolInfo = schoolData.map((d) => {
      return <div className="tip-school-info" key={d['MAPNAME']}>
        <em>{d['MAPNAME']}</em>
        <div>Tuition & Fees: {formatter.format(d['Tuition & Fees'])}</div>
        <div>Undergraduates: {d['Degree-seeking Undergraduates'] || 'N/A'}</div>
        <div>Graduates: {d['Graduate Students'] || 'N/A'}</div>
      </div>
    });
  }

  let featInfo = null;
  if (feats.length > 0) {
    const key = util.keyForCat(cat);
    let featData = await api.dataForKeyPlace(key, feats[0].properties.id);
    if (Object.keys(featData).length > 0) {
      let [p, ..._] = util.keyParts(props[0].key);
      featInfo = <table>
        <tbody>
          <tr>
            <td>{props[0].nick}</td>
            <td>{props[0].fmt(getMaybeRaceVariable(featData[p]))}</td>
          </tr>
          {loa == 'state' ? (featData[`${p}_rankNat`] !== undefined ? <tr>
            <td>National Rank</td>
            <td>{getMaybeRaceVariable(featData[`${p}_rankNat`])}</td>
          </tr> : '') : <>
            <tr>
              <td>National Percentile</td>
              <td>{getMaybeRaceVariable(featData[`${p}_pctNat`])}</td>
            </tr>
            <tr>
              <td>State Percentile</td>
              <td>{getMaybeRaceVariable(featData[`${p}_pctState`])}</td>
            </tr>
          </>}
        </tbody>
      </table>
    }
  }

  setTipState({
    text: <>
      {feats.length > 0 && <h5>{feats[0].properties.name}</h5>}
      {featInfo}
      {schoolInfo}
    </>,
    display: 'block',
    left: `${ev.originalEvent.offsetX+10}px`,
    top: `${ev.originalEvent.offsetY+10}px`,
  });
}

type TipState = {
  top: string,
  left: string,
  display: string,
  text: JSX.Element
}

function MapTool({config}: {config: MapConfig}) {
  const [cat, setCat] = React.useState(config.INITIAL_STATE.cat);
  const [props, setProps] = React.useState(config.INITIAL_STATE.props);
  const [feats, setFeats] = React.useState<MapFeature[]>([]);
  const [tipState, setTipState] = React.useState<TipState>({
    top: `0px`,
    left: `0px`,
    display: 'none',
    text: <></>,
  });

  const api = React.useRef(new FeatureAPI(config.LOA));
  const tooltipFn = React.useRef((features: SourceMapping<MapFeature[]>, ev: MapMouseEvent) => {
    setTooltip(features, ev, config.LOA, cat, props, api.current, setTipState)
  });
  React.useEffect(() => {
    tooltipFn.current = (features, ev) => {
      setTooltip(features, ev, config.LOA, cat, props, api.current, setTipState)
    }
  }, [cat, props]);

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
        tooltipFn.current(features, ev);
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

            // If only one feature,
            // highlight its schools
            if (newFeats.length == 1) {
              let id = newFeats[0].properties['id'].split(',')[0];
              api.current.schoolsForPlace(id).then((schoolIds) => {
                if (!Array.isArray(schoolIds)) schoolIds = [];
                let filter = ['in', 'id'].concat(schoolIds);
                map_.setFilter({
                  id: 'schools'
                }, filter, {mute: false}, {mute: true});
              });
            }

            return newFeats;
          });

        // Otherwise, hide
        // if we don't already have no feats
        } else {
          setFeats((feats) => {
            if (feats.length > 0) {
              map_.focusFeatures(MAP.SOURCE, []);
              return [];
            } else {
              // Prevent redundant update,
              // return the same existing state
              return feats;
            }
          });
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
    if (visible) {
      map.map.resize();

      // Zoom to contiguous 48
      let bbox = regions['Mainland'];
      map.map.fitBounds(bbox as Bounds);
    }
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
    // Filter only to valid props for this loa
    let configProps: PropMap = {};
    Object.entries(config.PROPS).forEach(([k, v]) => {
      if (!('loas' in v) || v['loas'].includes(config.LOA)) {
        configProps[k] = v;
      }
    });
    return <PropertySelector
      hideLabel={true}
      label="Display Variable"
      props={configProps}
      selected={props[0].key}
      onChange={onPropertySelect} />
  }, [props, onPropertySelect]);

  return <div>
    <section className="stage">
      <Info
        loa={config.LOA}
        category={cat}
        features={feats}
        placeNamePlural={config.PLACE_NAME_PLURAL}
        setYear={setYear}
      />
      <div className="map-wrapper" onMouseLeave={hideTooltip}>
        <RegionSelector
          onSelect={onRegionSelect}
          excludeTerritories={config.UI.NO_TERRITORIES} />
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
          noDataLabel={config.UI.NO_DATA_LABEL ? `No ${config.PLACE_NAME}` : null}>
          {propertySelector}
        </MapLegend>
        {!config.UI.NO_PLACE_SELECTOR && <PlaceSelector
          loa={config.LOA}
          name={config.PLACE_NAME}
          idLength={config.UI.PLACE_ID_LENGTH}
          onSelect={onPlaceSelect} />}
        <IconLegend title="School Legend" iconGroups={schoolIconLegend} />
      </div>
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
