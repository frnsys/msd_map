import color from './lib/color';
import config from '../config';
import data from '../data/meta.json';

let params = window.location.search.substr(1).split('&').reduce((acc, param) => {
    let val = true;
    if (param.includes('=')) [param, val] = param.split('=');
    acc[param] = val;
    return acc;
}, {});


const BBOXES = data.bboxes;
const RANGES = data.ranges;
const MAPBOX_TOKEN = config.MAPBOX_TOKEN;

const colors = {
  'SCI': {
    0.0: '#7dd177',
    0.3: '#f4d71a',
    1.0: '#9b150c'
  },
  'avg_grosscost': {
    0.0: '#a9bdfc',
    1.0: '#023ff7'
  },
  'schools': {
    0.0: '#f5fff8',
    1.0: '#32a852'
  },
  'population_total': {
    0.0: '#fff8d6',
    1.0: '#ffd721'
  },
  'UNDUPUG': {
    0.0: '#ffedff',
    1.0: '#c65cff'
  }
};
const COLORS = Object.keys(colors).reduce((acc, prop) => {
  acc[prop] = Object.keys(colors[prop]).reduce((a, stop) => {
    a[stop] = color.hexToRGB(colors[prop][stop]);
    return a;
  }, {});
  return acc;
}, {});
COLORS.FOCUS = '#f9ca74';
COLORS.EMPTY = '#6b0106';

const CATS = {
  'allschools': 'All School Types',
  'public': 'Public',
  'privnot4prof': 'Private, not-for-profit',
  'priv4prof': 'Private, for-profit',
  'bachelor': 'Bachelor Degree',
  'associate': 'Associate Degree',
  'belowassociate': 'Below Associate Degree'
};
const CAT_PROP_EXPRS = {
  'public': ['CONTROL', 1],
  'privnot4prof': ['CONTROL', 2],
  'priv4prof': ['CONTROL', 3],
  'bachelor': ['ICLEVEL', 1],
  'associate': ['ICLEVEL', 2],
  'belowassociate': ['ICLEVEL', 3]
};
const HAS_CATS = [
  'SCI', 'avg_grosscost',
  'schools', 'UNDUPUG'
];

const DESCS = {
  'SCI': 'School Concentration Index',
  'avg_grosscost': 'Average Tuition',
  'schools': 'Number of Schools',
  'population_total': 'Population Estimate',
  'UNDUPUG': 'Enrollment Seats'
};

const SHORT_NAMES = {
  'SCI': 'SCI',
  'avg_grosscost': 'Avg Tuition',
  'schools': '# Schools',
  'population_total': 'Pop. Est.',
  'UNDUPUG': 'Enrollment Seats'
};

let MAP_ID = 'frnsys.aiuzp85f';
let INITIAL_CAT = 'allschools';
if (params['30']) {
  MAP_ID = 'frnsys.590w69s5';
  INITIAL_CAT = 'public';
} else if (params['45']) {
  MAP_ID = 'frnsys.8srbv2ok';
  INITIAL_CAT = 'public';
} else if (params['60']) {
  MAP_ID = 'frnsys.44fgwf33';
  INITIAL_CAT = 'public';
}
const INITIAL_PROPS = ['SCI'].map((p) => {
  return HAS_CATS.includes(p) ? `${p}.${INITIAL_CAT}` : p;
});

HAS_CATS.forEach((p) => {
  Object.keys(CATS).forEach((cat) => {
    RANGES[`${p}.${cat}`] = RANGES[p];
    COLORS[`${p}.${cat}`] = COLORS[p];
    SHORT_NAMES[`${p}.${cat}`] = SHORT_NAMES[p];
    DESCS[`${p}.${cat}`] = DESCS[p];
  });
});

export default {
  MAP_ID,
  INITIAL_PROPS,
  INITIAL_CAT,
  CATS, HAS_CATS, CAT_PROP_EXPRS,
  SHORT_NAMES, DESCS,
  COLORS, RANGES,
  BBOXES, MAPBOX_TOKEN
};
