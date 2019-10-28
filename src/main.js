import Map from './lib/map';
import Legend from './lib/legend';
import Painter from './lib/paint';
import info from './info';
import setupUI from './ui';
import mapboxgl from 'mapbox-gl';
import config from './config';
import schools from '../data/schools.json';

mapboxgl.accessToken = config.MAPBOX_TOKEN;

const tooltip = document.getElementById('map-tooltip');

const state = {
  props: config.INITIAL_PROPS,
  cat: config.INITIAL_CAT
};

const allSchoolsStyle = {
  'circle-opacity': [
    'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
      'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.25,
      1.0
    ]
  ],
  'circle-stroke-opacity': [
    'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
      'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.25,
      1.0
    ]
  ]
};

const sources = {
  'zctas': {
    'type': 'vector',
    'url': 'mapbox://frnsys.6ct9nbap'
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
  'paint': {
    'fill-color': '#000000', // will be replaced on map initialization

    // Fade-out ZCTA outlines at low zooms
    'fill-outline-color': [
      'interpolate', ['linear'], ['zoom'], 5, 'rgba(0, 0, 0, 0)', 10, 'rgba(0,0,0,1)'
    ],

    'fill-opacity': [
      'case',
        ['boolean', ['feature-state', 'mute'], false],
          0.25,
        1.0
    ]
  }
}, {
  'id': 'schools',
  'type': 'circle',
  'source': 'schools',
  'paint': {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'], 5, 1, 10, 5
    ],
    'circle-color': [
      'case',

      ['boolean', ['feature-state', 'focus'], false],
        '#67A2FD',

      ['==', ['get', 'CONTROL'], 1],
        '#33C377',

      ['==', ['get', 'CONTROL'], 2],
        '#ffcc00',

      ['==', ['get', 'CONTROL'], 3],
        '#b296ff',

      '#000000',
    ],
    'circle-stroke-color': [
      'case',

      ['boolean', ['feature-state', 'focus'], false],
        '#1f70ed',

      ['==', ['get', 'ICLEVEL'], 1],
        '#000000',

      ['==', ['get', 'ICLEVEL'], 2],
        '#888888',

      ['==', ['get', 'ICLEVEL'], 3],
        '#eeeeee',

      '#ff0000',
    ],
    'circle-stroke-width': [
      'interpolate', ['linear'], ['zoom'], 6, 0.0, 9, 3.0
    ],
    'circle-opacity': allSchoolsStyle['circle-opacity'],
    'circle-stroke-opacity': allSchoolsStyle['circle-stroke-opacity'],
  }
}];


const painter = new Painter(config.RANGES, config.COLORS);
const map = new Map({
  container: 'map',
  style: 'mapbox://styles/frnsys/cjzk1fw9w5goc1cpd8pzx6wuu',
  zoom: 2,
  maxZoom: 12,
  minZoom: 2,
  center: [-73.935242, 40.730610]
}, sources, layers, {'zctas': state.props}, painter, (features, ev) => {
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
      let schoolIds = JSON.parse(feat.properties['schools']);
      let schoolsForZCTA = schoolIds.map((id) => schools[id]);
      let filter = ['!in', '$id'].concat(schoolIds);
      map.setFilter({
        id: 'schools'
      }, filter, {mute: true}, {mute: false});
    }

    if (features['schools'].length > 0) {
      tooltip.style.left = `${ev.originalEvent.offsetX+10}px`;
      tooltip.style.top = `${ev.originalEvent.offsetY+10}px`;
      tooltip.style.display = 'block';
      tooltip.innerHTML = features['schools'].map((s) => s.properties['INSTNM']).join('<br />');

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
      tooltip.style.display = 'none';
    }

  // Otherwise, hide
  } else {
    info.reset();
    legend.hideFeatures();
    tooltip.style.display = 'none';
  }
});
map.map.on('dragstart', () => {
  tooltip.style.display = 'none';
});
const legend = new Legend(map, config.COLORS, config.RANGES, config.SHORT_NAMES, {id: 'zctas', layer: 'zctas'}, state.props);

setupUI(map, legend, info, state);
