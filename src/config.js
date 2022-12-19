import util from '@/util';
import styles from '@/styles';
import config from '../config';
import * as fmt from '@/format';
import zctaMeta from 'data/gen/zcta/meta.json';
import stateMeta from 'data/gen/state/meta.json';
import countyMeta from 'data/gen/county/meta.json';
import CATS_FOR_PROPS from 'data/gen/prop_cats.json';

const MAPBOX_TOKEN = config.MAPBOX_TOKEN;
export const MAP = {
  SOURCE: {
    id: 'main',
    layer: 'data'
  },
  LAYERS: [{
    'id': 'main',
    'type': 'fill',
    'source': 'main',
    'source-layer': 'data',
    'paint': styles.defaultPlaces
  }, {
    'id': 'schools',
    'type': 'circle',
    'source': 'schools',
    'paint': styles.defaultSchools
  }],
  CONFIG: {
    style: 'mapbox://styles/jfift/ckkfrwny700zc17pdajfucczo',
    zoom: 3.5,
    maxZoom: 12,
    minZoom: 2,
    center: [-98.5556199, 39.8097343]
  }
}

const LOAS = ['zcta', 'state', 'county'];

// Initially selected category
const INITIAL_CAT = {
  Y: '2022'
};
const INITIAL_KEY = util.propForCat('med_bal', INITIAL_CAT);

const INITIAL_STATE_KEY = util.propForCat('AvgRelief_Across_Borrowers', INITIAL_CAT);

export const COLORS = {
  focus: '#f9ca74',
  null: '#E2E0E6'
};

const PROPS = {
  'med_bal': {
    desc: 'Median Student Debt Balance',
    nick: 'Med. Balance',
    fmt: fmt.curOrNA,
    color: {
      0.0: '#ffdbdb',
      1.0: '#fa2525'
    },
    legend: {
      flip: false,
      minClamped: true,
      maxClamped: true,
      special: {
        'Missing Data': COLORS['null'],
      }
    }
  },
  'AvgRelief_Across_Borrowers': {
    desc: 'Average Student Debt Relief',
    nick: 'Avg. Debt Relief',
    fmt: fmt.curOrNA,
    color: {
      0.0: '#ccebd4',
      1.0: '#0c5219'
    },
    loas: ['state'],
    legend: {
      flip: false,
      minClamped: true,
      maxClamped: true,
      special: {
        'Missing Data': COLORS['null'],
      }
    }
  },
  'Max_Cancelled_in_b': {
    desc: 'Maximum Debt Cancelled (billions)',
    nick: 'Maximum Debt Cancelled (billions)',
    fmt: (val) => fmt.curOrNA(val, false),
    color: {
      0.0: '#f2e6fc',
      1.0: '#410175'
    },
    loas: ['state'],
    legend: {
      flip: false,
      minClamped: true,
      maxClamped: true,
      special: {
        'Missing Data': COLORS['null'],
      }
    }
  },
  'med_inc': {
    desc: 'Median Borrower Income',
    nick: 'Med. Income',
    fmt: fmt.curOrNA,
    color: {
      0.0: '#d4e4fc',
      1.0: '#2C84FC'
    },
    legend: {
      flip: false,
      minClamped: true,
      maxClamped: true,
      special: {
        'Missing Data': COLORS['null'],
      }
    }
  },
  'pct_bal_grt': {
    desc: 'Share of Loans where Balance is greater than Origination',
    nick: 'Loans where Balance > Origination',
    fmt: fmt.pctOrNA,
    color: {
      0.0: '#ffdbdb',
      1.0: '#fa2525'
    },
    legend: {
      flip: false,
      minClamped: true,
      maxClamped: true,
      special: {
        'Missing Data': COLORS['null'],
      }
    }
  },
}

const CUSTOM_RANGES = {
  'zcta': {
    'med_bal': [5000, 25000],
    'med_inc': [50000, 65000],
  },
  'county': {
    'med_bal': [5000, 25000],
    'med_inc': [50000, 65000],
  },
  'state': {
    'med_bal': [13000, 25000],
    'AvgRelief_Across_Borrowers': [12000, 16000],
    'Max_Cancelled_in_b': [0, 50],
    'med_inc': [50000, 65000],
  }
}

// Mapping of cat keys to labels
export const CATS = {
  // R: {
  //   'ALL': 'All',
  //   'BLACK': 'Black',
  //   'WHITE': 'White',
  //   'NATVAM': 'Native Amer.',
  //   'ASIAN': 'Asian',
  //   'LATINO': 'Latino',
  // },
  Y: { // Show academic year
    // '2021': '2020-2021',
    '2022': '2021-2022',
  }
};

const PROPS_FOR_LOA = {};
const META = {
  zcta: zctaMeta,
  county: countyMeta,
  state: stateMeta,
};
const allCategories = util.allCategories(CATS);
LOAS.forEach((loa) => {
  PROPS_FOR_LOA[loa] = JSON.parse(JSON.stringify(PROPS));
  Object.keys(CATS_FOR_PROPS).forEach((p) => {
    if (!(p in PROPS)) return;
    let keys = allCategories.map((cat) => util.propForCat(p, cat));
    keys.forEach((k) => {
      PROPS_FOR_LOA[loa][k] = {
        key: k,
        range: p in CUSTOM_RANGES[loa] ? CUSTOM_RANGES[loa][p] : META[loa].ranges[p],
        stats: {
          // min: META[loa].min[k]
        },
        ...PROPS[p]
      };
    });
  });
});

// Keys for which there is no/missing data
const NO_DATA = [
  // 'MEDIANINCOME.Y:2019',
];

const SHARED_CONFIG = {
  CATS,
  COLORS,
};

export default {
  maps: {
    state: {
      LOA: 'state',
      MAP_ID: 'jfift.msd_state__2022_12-13_2',
      PLACE_NAME: 'state',
      PLACE_NAME_PLURAL: 'states',
      MIN_ZOOM: 2,
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 2,
        NO_TERRITORIES: false,
        NO_PLACE_SELECTOR: true,
        NO_DATA_LABEL: false,
      },
      PROPS: PROPS_FOR_LOA['state'],
      INITIAL_STATE: {
        cat: INITIAL_CAT,
        props: [PROPS_FOR_LOA['state'][INITIAL_STATE_KEY]]
      },
      ...SHARED_CONFIG
    },

    county: {
      LOA: 'county',
      MAP_ID: 'jfift.msd_county__2022_12-13',
      PLACE_NAME: 'county',
      PLACE_NAME_PLURAL: 'counties',
      MIN_ZOOM: 4,
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 5,
        NO_TERRITORIES: false,
        NO_PLACE_SELECTOR: true,
        NO_DATA_LABEL: false,
      },
      PROPS: PROPS_FOR_LOA['county'],
      INITIAL_STATE: {
        cat: INITIAL_CAT,
        props: [PROPS_FOR_LOA['county'][INITIAL_KEY]]
      },
      ...SHARED_CONFIG
    },

    zcta: {
      LOA: 'zcta',
      MAP_ID: 'jfift.msd_zcta__2022_12-13',
      PLACE_NAME: 'ZIP code',
      PLACE_NAME_PLURAL: 'zips',
      MIN_ZOOM: 6,
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 5,
        NO_TERRITORIES: false,
        NO_PLACE_SELECTOR: false,
        NO_DATA_LABEL: true,
      },
      PROPS: PROPS_FOR_LOA['zcta'],
      INITIAL_STATE: {
        cat: INITIAL_CAT,
        props: [PROPS_FOR_LOA['zcta'][INITIAL_KEY]]
      },
      ...SHARED_CONFIG
    },
  },

  MAPBOX_TOKEN
};
