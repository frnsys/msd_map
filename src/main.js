import Map from './lib/map';
import Legend from './lib/legend';
import Painter from './lib/paint';
import info from './info';
import util from './util';
import setupUI from './ui';
import mapboxgl from 'mapbox-gl';
import config from './config';
import styles from './styles';
import schools from '../data/schools.json';
import zipSchools from '../data/zip_schools.json';

mapboxgl.accessToken = config.MAPBOX_TOKEN;

const tooltip = document.getElementById('map-tooltip');

const state = {
  props: config.INITIAL_PROPS,
  cat: config.INITIAL_CAT
};

const sources = {
  'zctas': {
    'type': 'vector',
    'url': `mapbox://${config.MAP_ID}`
  },
  'schools': {
    'type': 'geojson',
    'data': 'assets/schools.geojson'
  }
};
const layers = [{
  'id': 'zctas',
  'type': 'fill',
  'source': 'zctas',
  'source-layer': 'zctas',
  'paint': styles.defaultZCTAs
}, {
  'id': 'schools',
  'type': 'circle',
  'source': 'schools',
  'paint': styles.defaultSchools
}];

function focusFeatures(features, ev) {
  // If features, render
  if (features['zctas'].length > 0) {
    let feats = features['zctas'];
    map.focusFeatures({
      id: 'zctas',
      layer: 'zctas'
    }, feats);
    legend.renderFeatures(feats);

    // If only one feature,
    // highlight schools for that ZCTA
    if (feats.length == 1) {
      let feat = feats[0];
      let zip = feat.properties['zipcode'].split(',')[0];
      let key = util.keyForCat({'Y': state.cat['Y'], 'I': state.cat['I']});
      let schoolIds = zipSchools[zip] ? zipSchools[zip][key] : [];
      let filter = ['!in', '$id'].concat(schoolIds);
      map.setFilter({
        id: 'schools'
      }, filter, {mute: true}, {mute: false});
    } else {
      map.focusFeatures({
        id: 'schools'
      }, []);
    }

    if (features['schools'].length > 0) {
      let focusedSchools = features['schools'];
      info.explain(feats, state.cat, focusedSchools);
      map.focusFeatures({
        id: 'schools'
      }, focusedSchools);
    } else {
      map.focusFeatures({
        id: 'schools'
      }, []);
      info.explain(feats, state.cat, []);
    }

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
  container: 'map',
  style: 'mapbox://styles/frnsys/ck36ls0sm0hus1cpi2zedg77t',
  zoom: 3,
  maxZoom: 12,
  minZoom: 2,
  center: [-98.5556199, 39.8097343]
}, sources, layers, {'zctas': state.props}, painter, focusFeatures, (features, ev) => {
  // Ignore at low zoom levels, gets really choppy
  if (map.map.getZoom() <= 6) return;

  if (features['schools'].length > 0) {
    tooltip.style.left = `${ev.originalEvent.offsetX+10}px`;
    tooltip.style.top = `${ev.originalEvent.offsetY+10}px`;
    tooltip.style.display = 'block';
    tooltip.innerHTML = features['schools'].map((s) => {
      return `<div class="school-info">
        ${s.properties['INSTNM']}
        <div>ZCTA: ${s.properties['ZIP']}</div>
        <div>Enrollment Seats: ${s.properties['UNDUPUG']}</div>
      </div>`;
    }).join('<br />');
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
const legend = new Legend(map, {id: 'zctas', layer: 'zctas'}, state.props, {
  'Education Desert': config.COLORS['null'],
  'No ZCTA': '#520004'
}, ['min']);

setupUI(map, legend, info, state);
info.reset();
