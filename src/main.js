// <https://blog.mapbox.com/going-live-with-electoral-maps-a-guide-to-feature-state-b520e91a22d>
// <https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/>

import * as d3 from 'd3';
import data from '../msd_map_3_data.json';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnJuc3lzIiwiYSI6ImNpeGNwYjFkNDAwYXAyeWxmcm0ycmpyMXYifQ.NeU0Zkf83cbL4Tw_9Ahgww';
const ZIPCODE_PROPERTY = 'ZCTA5CE10';
const PROPERTY_COLOR_RANGES = {
  'avginc': ['#adb0f7', '#0712ea'],
  'debtburden': ['#fffef5', '#fa0255'],
  'avbal': ['#aff7d3', '#04e876'],
  'avgearn': ['#f9f1b3', '#f4d909'],
  'emp': ['#fcb7ae', '#ef1e02'],
  'neshare': ['#ddb4f7', '#8902dd']
};
const PROPERTY_RANGES = Object.keys(PROPERTY_COLOR_RANGES).reduce((acc, k) => {
  acc[k] = [null, null];
  Object.values(data).forEach((d) => {
    if (d[k] != null) {
      if (acc[k][0] == null || d[k] < acc[k][0]) {
        acc[k][0] = d[k];
      }
      if (acc[k][1] == null || d[k] > acc[k][1]) {
        acc[k][1] = d[k];
      }
    }
  });
  return acc;
}, {});
const PROPERTY_COLOR_SCALES = Object.keys(PROPERTY_COLOR_RANGES).reduce((acc, k) => {
  acc[k] = d3.scaleLinear()
    .domain(PROPERTY_RANGES[k])
    .range(PROPERTY_COLOR_RANGES[k]);

  return acc;
}, {});

let selected_property = 'debtburden';

// <https://docs.mapbox.com/mapbox-gl-js/style-spec/#other-filter>
// <https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions>
// TODO this isn't working correctly b/c this property isn't on the feature, it's loaded separately
let selected_filter = ['<', ['to-number', ['get', 'avginc']], 50000];

mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({
  container: 'main',
  style: 'mapbox://styles/mapbox/dark-v10',
  zoom: 2,
  center: [-73.935242, 40.730610],
  pitchWithRotate: false,
  dragRotate: false
});

map.on('load', function () {
  // Get index of first symbol layer,
  // so we can draw the zipcode features beneath the labels
  let layers = map.getStyle().layers;
  let labelLayerId;
  for (var i=0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
      labelLayerId = layers[i].id;
      break;
    }
  }

  map.addLayer({
    'id': 'zipcodes',
    'type': 'fill',
    'source': {
      type: 'vector',
      url: 'mapbox://frnsys.77gb3267'
    },
    'source-layer': 'zipcodes',
    'paint': {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'highlight'], false],
        ['feature-state', 'color'],
        'rgba(0, 0, 0, 0)' // transparent
      ],
      'fill-outline-color': '#383838'
    }
  }, labelLayerId);
});

map.on('click', function(e) {
  let features = map.queryRenderedFeatures(e.point);
  if (features.length > 0) {
    let zipcode = features[0].properties[ZIPCODE_PROPERTY];
    if (zipcode) {
      let zipcodeData = data[zipcode];
      let html = `<h5>${zipcode}</h5>`;
      Object.keys(zipcodeData).forEach((k) => {
        html += `<div>${k}: ${zipcodeData[k]}</div>`;
      });
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    }
  }
});

// NOTE this only applies to loaded features
let highlightedFeatures = [];
function setFilter() {
  // Reset existing selections
  highlightedFeatures.forEach(function(f) {
    map.setFeatureState({
      source: 'zipcodes',
      sourceLayer: 'zipcodes',
      id: f.id
    },{
      highlight: false
    });
  });

  updateFilter();
}

function updateFilter() {
  highlightedFeatures = map.querySourceFeatures('zipcodes', {
    sourceLayer: 'zipcodes',
    filter: [
      'all',
      selected_filter
    ]
  });

  highlightedFeatures.forEach((f) => {
    map.setFeatureState({
      source: 'zipcodes',
      sourceLayer: 'zipcodes',
      id: f.id
    },{
      highlight: true
    });
  });
}

function colorFeatures() {
  highlightedFeatures.forEach((f) => {
    let zipcode = f.properties[ZIPCODE_PROPERTY];
    let zipcodeData = data[zipcode];
    map.setFeatureState({
      source: 'zipcodes',
      sourceLayer: 'zipcodes',
      id: f.id
    },{
      color: PROPERTY_COLOR_SCALES[selected_property](zipcodeData[selected_property])
    });
  });
}

// <https://docs.mapbox.com/mapbox-gl-js/api/#map.event:styledata>
map.on('sourcedata', function(e) {
  if (e.sourceId === 'zipcodes') {
    updateFilter();
    colorFeatures();
  }
});