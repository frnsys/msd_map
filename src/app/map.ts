import Map from '@/lib/map';
import Legend from '@/lib/legend';
import Painter from '@/lib/paint';
// import color from '@/lib/color';
import API from './api';
import Info from './info';
import styles from './styles';
import setupUI from './ui';
import type { MapMouseEvent } from 'mapbox-gl';


function MSDMap(config: Config) {
  const loa = config.LOA;
  const state = config.INITIAL_STATE;
  const tooltip = document.getElementById(`${loa}--map-tooltip`);

  const api = new API(config.LOA);
  const info = new Info(`${loa}--info`, api, config);

  const dataLayerName = 'data';
  const sources = {
    'main': {
      'type': 'vector',
      'url': `mapbox://${config.MAP_ID}`
    },
  };
  const layers = [{
    'id': 'main',
    'type': 'fill',
    'source': 'main',
    'source-layer': dataLayerName,
    'paint': styles.defaultPlaces
  }];

  function focusFeatures(features: SourceMapping<MapFeature[]>, _ev: MapMouseEvent) {
    // If features, render
    if (features['main'].length > 0) {
      let feats = features['main'];
      map.focusFeatures({
        id: 'main',
        layer: dataLayerName
      }, feats);
      legend.renderFeatures(feats);
      info.explain(feats, state.cat);

    // Otherwise, hide
    } else {
      if (features['composite']) {
        info.empty();
      } else {
        info.reset();
      }
      legend.hideFeatures();
    }
  }

  const painter = new Painter(config.COLORS);
  const map = new Map({
    container: `${loa}--map`,
    style: 'mapbox://styles/jfift/ckkfrwny700zc17pdajfucczo',
    zoom: 3.5,
    maxZoom: 12,
    minZoom: 2,
    center: [-98.5556199, 39.8097343]
  }, sources, layers, {'main': state.props}, painter, focusFeatures, (features, ev) => {
    // Ignore at low zoom levels, gets really choppy
    if (map.map.getZoom() <= 6) return;

    if (true) {
      tooltip.style.left = `${ev.originalEvent.offsetX+10}px`;
      tooltip.style.top = `${ev.originalEvent.offsetY+10}px`;
      tooltip.style.display = 'block';
      tooltip.innerHTML = 'hello!';
    } else {
      tooltip.style.display = 'none';
    }
    if (!map.focusedLock) {
      focusFeatures(features, ev);
    }
  });
  map.map.on('dragstart', () => {
    tooltip.style.display = 'none';
  });

  const otherColors: Colors = {};
  otherColors[`No ${config.PLACE_NAME}`] = '#520004';
  const legend = new Legend(`${loa}--legend`, map, {id: 'main', layer: 'data'}, state.props, otherColors, ['min']);

  setupUI(map, config, legend, info, state);
  info.reset();

  return map;
}

export default MSDMap;
