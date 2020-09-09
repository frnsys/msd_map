import config from '../config';
import data from '../data/gen/meta.json';

let params = window.location.search.substr(1).split('&').reduce((acc, param) => {
    let val = true;
    if (param.includes('=')) [param, val] = param.split('=');
    acc[param] = val;
    return acc;
}, {});


const MAPBOX_TOKEN = config.MAPBOX_TOKEN;

let MAP_ID = 'frnsys.msd__3_0_beta';
let INITIAL_CAT = {
  S: 'allschools',
  I: '45min',
  Y: '2018'
};

const COLORS = {
  focus: '#f9ca74',
  null: '#6b0106'
};

const PROPS = {
  'SCI': {
    desc: 'School Concentration Index',
    nick: 'SCI',
    color: {
      0.0: '#ffdbdb',
      1.0: '#fa2525'
      // 0.0: '#ffffff',
      // 1.0: '#ffffff'
    },
    legend: {
      flip: false,
      special: {
        'Education Desert': COLORS['null'],
      }
    }
  },
  'AVGNP': {
    desc: 'Average Net Price',
    nick: 'Avg Net Price',
    color: {
      0.0: '#d9ddff',
      1.0: '#263cff'
      // 0.0: '#ffffff',
      // 1.0: '#ffffff'
    },
    legend: {
      maxClamped: true,
      minClamped: true,
      special: {
        'Education Desert': COLORS['null'],
      }
    }
  },
  'MEDIANINCOME': {
    desc: 'Median Household Income',
    nick: 'Median Income',
    color: {
      0.0: '#fcfcea',
      0.5: '#e8ca0b',
      1.0: '#079b1d'
    },
    nullColor: '#333333',
    legend: {
      maxClamped: true,
      minClamped: true,
      special: {
        'Data Unavailable': '#333333'
      }
    }
  },
  'STU_TOT_BAL': {
    desc: 'Median Total Balance for Student Loan Borrowers aged 18-35',
    nick: 'Median Total Balance',
    color: {
      0.0: '#079b1d',
      0.5: '#f4e61a',
      1.0: '#f4371a'
    },
    nullColor: '#333333',
    legend: {
      maxClamped: true,
      minClamped: true,
      special: {
        'Data Unavailable': '#333333'
      }
    }
  },

  // Not including these as part of the map feature properties
  // to keep tileset size down. Thus we can't use them here.
  // 'n': {
  //   desc: 'Number of Schools',
  //   nick: '# Schools',
  //   color: {
  //     0.0: '#f5fff8',
  //     1.0: '#32a852'
  //   }
  // },
  // 'ZCTAZONEPOP': {
  //   desc: 'Population Estimate',
  //   nick: 'Pop. Est.',
  //   color: {
  //     0.0: '#fff8d6',
  //     1.0: '#ffd721'
  //   }
  // },
  // 'ENROLLED': {
  //   desc: 'Enrollment Seats',
  //   nick: 'Enrollment Seats',
  //   color: {
  //     0.0: '#ffedff',
  //     1.0: '#c65cff'
  //   }
  // },
}


const CATS = {
  S: {
    'allschools': 'All School Types',
    'public': 'Public',
    'privnot4prof': 'Private, not-for-profit',
    'priv4prof': 'Private, for-profit',
    'bachelor': 'Bachelor Degree',
    'associate': 'Associate Degree',
    'belowassociate': 'Below Associate Degree'
  },
  I: {
    '30min': '30 min.',
    '45min': '45 min.',
    '60min': '60 min.'
  },
  Y: { // Show academic year
    '2009': '2008-2009',
    '2010': '2009-2010',
    '2011': '2010-2011',
    '2012': '2011-2012',
    '2013': '2012-2013',
    '2014': '2013-2014',
    '2015': '2014-2015',
    '2016': '2015-2016',
    '2017': '2016-2017',
    '2018': '2017-2018',
    '2019': '2018-2019'
  }
};
const CAT_PROP_EXPRS = {
  'S': {
    'public': ['CONTROL', 1],
    'privnot4prof': ['CONTROL', 2],
    'priv4prof': ['CONTROL', 3],
    'bachelor': ['ICLEVEL', 1],
    'associate': ['ICLEVEL', 2],
    'belowassociate': ['ICLEVEL', 3]
  }
};
const CATS_FOR_PROPS = {
  'SCI': ['S', 'I', 'Y'],
  'n': ['S', 'I', 'Y'],
  'ENROLLED': ['S', 'I', 'Y'],
  'AVGNP': ['S', 'I', 'Y'],
  'AVGTF': ['S', 'I', 'Y'],
  'MEDIANINCOME': ['Y'],
  'STU_TOT_BAL': ['Y'],
};
const HAS_CATS = Object.keys(CATS_FOR_PROPS);
HAS_CATS.forEach((p) => {
  if (p in PROPS) {
    const cat_keys = CATS_FOR_PROPS[p].sort((a, b) => a.localeCompare(b)).reduce((acc, k) => {
      if (acc.length == 0) {
        return Object.keys(CATS[k]).map((v) => `${k}:${v}`);
      } else {
        return [].concat(...acc.map((key) => Object.keys(CATS[k]).map((v) => `${key}.${k}:${v}`)));
      }
    }, []);

    cat_keys.forEach((key) => {
      let k = `${p}.${key}`;
      PROPS[k] = JSON.parse(JSON.stringify(PROPS[p]));
      PROPS[k].key = k;
      PROPS[k].range = data.ranges[p];
      PROPS[k].stats = {
        min: data.min[k]
      };
    });
  }
});

const INITIAL_CAT_KEY = Object.keys(INITIAL_CAT)
  .sort((a, b) => a.localeCompare(b))
  .map((k) => `${k}:${INITIAL_CAT[k]}`).join('.');
const INITIAL_PROPS = ['AVGNP'].map((p) => {
  let k = HAS_CATS.includes(p) ? `${p}.${INITIAL_CAT_KEY}` : p;
  return PROPS[k];
});

const NO_DATA = [
  'MEDIANINCOME.Y:2019',
];
CATS_FOR_PROPS['AVGNP'].sort((a, b) => a.localeCompare(b)).reduce((acc, k) => {
  if (acc.length == 0) {
    return Object.keys(CATS[k]).map((v) => `${k}:${v}`);
  } else {
    return [].concat(...acc.map((key) => Object.keys(CATS[k]).map((v) => `${key}.${k}:${v}`)));
  }
}, []).filter((k) => k.includes('Y:2019')).forEach((k) => NO_DATA.push(`AVGNP.${k}`));

export default {
  MAP_ID,
  PROPS,
  COLORS,
  NO_DATA,
  INITIAL_PROPS,
  INITIAL_CAT,
  CATS, HAS_CATS, CAT_PROP_EXPRS,
  CATS_FOR_PROPS,
  MAPBOX_TOKEN
};
