// <https://blog.mapbox.com/going-live-with-electoral-maps-a-guide-to-feature-state-b520e91a22d>
// <https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/>

import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';
import * as d3 from 'd3';
import data from '../msd_map_3_data.json';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZnJuc3lzIiwiYSI6ImNpeGNwYjFkNDAwYXAyeWxmcm0ycmpyMXYifQ.NeU0Zkf83cbL4Tw_9Ahgww';
const COLOR_RANGE = ['#fffef5', '#fa0255'];
const PROPERTIES = ['avginc', 'debtburden', 'avbal', 'avgearn', 'emp', 'neshare'];
const PROPERTY_RANGES = PROPERTIES.reduce((acc, k) => {
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
const PROPERTY_COLOR_SCALES = PROPERTIES.reduce((acc, k) => {
  acc[k] = d3.scaleLinear()
    .domain(PROPERTY_RANGES[k])
    .range(COLOR_RANGE);
  return acc;
}, {});

// Create property selector, for color coding
function makePropertySelector() {
  let select_el = document.createElement('select');
  PROPERTIES.forEach((k) => {
    let option_el = document.createElement('option');
    option_el.value = k;
    option_el.innerText = k;
    select_el.appendChild(option_el);
  });
  return select_el;
}
const colors_el = document.getElementById('color');
const select_el = makePropertySelector();
colors_el.appendChild(select_el);
select_el.addEventListener('change', (ev) => {
  selected_property = ev.target.value;
  colorFeatures();
});
let selected_property = select_el.value;


// Create filter control
// <https://docs.mapbox.com/mapbox-gl-js/style-spec/#other-filter>
// <https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions>
let selected_filter = null;
const filter_el = document.getElementById('filter');
const filter_select_el = makePropertySelector();
filter_select_el.addEventListener('change', (ev) => {
  Object.values(filter_range_els).forEach((r) => {
    r.el.style.display = 'none';
  });
  filter_range_els[ev.target.value].el.style.display = 'block';
});
filter_el.appendChild(filter_select_el);
const filter_range_els = PROPERTIES.reduce((acc, k) => {
  let el = document.createElement('div');
  let [min, max] = PROPERTY_RANGES[k];
  let slider = noUiSlider.create(el, {
    range: {min, max},
    start: [min, max],
    step: 1,
    connect: true,
    pips: {
        mode: 'positions',
        values: [0, 25, 50, 75, 100],
        density: 4
    },
    tooltips: true
  });
  filter_el.appendChild(el);
  el.style.display = 'none';
  acc[k] = {el, slider};
  return acc;
}, {});
filter_range_els[filter_select_el.value].el.style.display = 'block';

const filter_apply_el = document.createElement('button');
filter_apply_el.innerText = 'Apply';
filter_apply_el.addEventListener('click', () => {
  let prop = filter_select_el.value;
  let [min, max] = filter_range_els[prop].slider.get();
  min = parseFloat(min);
  max = parseFloat(max);
  selected_filter = [
    ['>', ['to-number', ['get', prop]], min],
    ['<', ['to-number', ['get', prop]], max]
  ];
  setFilter();
});
filter_el.appendChild(filter_apply_el);
const filter_clear_el = document.createElement('button');
filter_clear_el.addEventListener('click', () => {
  selected_filter = null;
  setFilter();
});
filter_clear_el.innerText = 'Clear';
filter_el.appendChild(filter_clear_el);


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
    let zipcode = features[0].properties['zipcode'];
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
  let opts = {
    sourceLayer: 'zipcodes'
  };
  if (selected_filter !== null) {
    opts.filter = ['all', ...selected_filter];
  }

  highlightedFeatures = map.querySourceFeatures('zipcodes', opts);
  highlightedFeatures.forEach((f) => {
    map.setFeatureState({
      source: 'zipcodes',
      sourceLayer: 'zipcodes',
      id: f.id
    },{
      highlight: true
    });
  });

  colorFeatures();
}

function colorFeatures() {
  highlightedFeatures.forEach((f) => {
    let zipcode = f.properties['zipcode'];
    let zipcodeData = data[zipcode];
    let val = zipcodeData[selected_property];
    map.setFeatureState({
      source: 'zipcodes',
      sourceLayer: 'zipcodes',
      id: f.id
    },{
      color: val == null ? '#000000' : PROPERTY_COLOR_SCALES[selected_property](val)
    });
  });
}

// <https://docs.mapbox.com/mapbox-gl-js/api/#map.event:styledata>
map.on('sourcedata', function(e) {
  if (e.sourceId === 'zipcodes') {
    updateFilter();
  }
});