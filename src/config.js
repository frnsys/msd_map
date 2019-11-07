import config from '../config';
import data from '../data/meta.json';

let params = window.location.search.substr(1).split('&').reduce((acc, param) => {
    let val = true;
    if (param.includes('=')) [param, val] = param.split('=');
    acc[param] = val;
    return acc;
}, {});


const BBOXES = data.bboxes;
const MAPBOX_TOKEN = config.MAPBOX_TOKEN;

let MAP_ID = 'frnsys.1hm4znww';
let INITIAL_CAT = 'allschools';

// Isochrone Comparisons
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

const PROPS = {
  'SCI': {
    desc: 'School Concentration Index',
    nick: 'SCI',
    color: {
      0.0: '#7dd177',
      0.3: '#f4d71a',
      1.0: '#9b150c'
    }
  },
  'avg_grosscost': {
    desc: 'Average Tuition',
    nick: 'Avg Tuition',
    color: {
      0.0: '#a9bdfc',
      1.0: '#023ff7'
    }
  },
  'schools': {
    desc: 'Number of Schools',
    nick: '# Schools',
    color: {
      0.0: '#f5fff8',
      1.0: '#32a852'
    }
  },
  'population_total': {
    desc: 'Population Estimate',
    nick: 'Pop. Est.',
    color: {
      0.0: '#fff8d6',
      1.0: '#ffd721'
    }
  },
  'UNDUPUG': {
    desc: 'Enrollment Seats',
    nick: 'Enrollment Seats',
    color: {
      0.0: '#ffedff',
      1.0: '#c65cff'
    }
  }
}

const COLORS = {
  focus: '#f9ca74',
  null: '#6b0106'
};

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
HAS_CATS.forEach((p) => {
  Object.keys(CATS).forEach((cat) => {
    let k = `${p}.${cat}`;
    PROPS[k] = JSON.parse(JSON.stringify(PROPS[p]));
    PROPS[k].key = k;
    PROPS[k].range = data.ranges[p];
    PROPS[k].stats = {
      min: data.min[k]
    };
  });
});

const INITIAL_PROPS = ['SCI'].map((p) => {
  let k = HAS_CATS.includes(p) ? `${p}.${INITIAL_CAT}` : p;
  return PROPS[k];
});


export default {
  MAP_ID,
  PROPS,
  COLORS,
  INITIAL_PROPS,
  INITIAL_CAT,
  CATS, HAS_CATS, CAT_PROP_EXPRS,
  BBOXES, MAPBOX_TOKEN
};
