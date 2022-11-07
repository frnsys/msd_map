import util from '@/util';
import styles from '@/styles';
import config from '../config';
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

export const COLORS = {
  focus: '#f9ca74',
  null: '#202124'
};

const PROPS = {
  'med_bal': {
    desc: 'Median Balance',
    nick: 'Med. Balance',
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
  'med_dti': {
    desc: 'Median Debt-to-Income Ratio',
    nick: 'Med. Debt-to-Income',
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
  'pct_bal_grt': {
    desc: 'Percent Current Balance > Origination Balance',
    nick: 'Per. Balance > Origination',
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
        range: META[loa].ranges[p],
        stats: {
          // min: META[loa].min[k]
        },
        ...JSON.parse(JSON.stringify(PROPS[p]))
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

const INTRO = `
<p>Welcome to the 2022 Millennial Student Debt map. This map visualizes institutional, demographic, and economic statistics at the State, County, and Zip-level. <i>All dollar amounts are 2022-inflation adjusted.</i></p>
<p>Zoom in to locate a particular area or use the buttons on the top-left corner to view non-contiguous US states and territories. At the Zip-level, you can also type in your desired zip (try your home zip code!) to locate its area. As you hover over the map, various statistics and rankings for the geographical area will populate on the right hand side of the map. Use the drop down menu in the legend in the bottom left corner to toggle between different display variables. Hover over the legend attribute bar to highlight areas on the map that correspond to a particular statistical measurement.</p>`;

export default {
  maps: {
    county: {
      LOA: 'county',
      MAP_ID: 'jfift.msd_county__2022_11-2',
      INFO: INTRO,
      PLACE_NAME: 'county',
      PLACE_NAME_PLURAL: 'counties',
      MIN_ZOOM: 4,
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 5,
        NO_TERRITORIES: false,
        NO_PLACE_SELECTOR: true,
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
      MAP_ID: 'jfift.msd_zcta__2022_11-2',
      INFO: INTRO,
      PLACE_NAME: 'zip',
      PLACE_NAME_PLURAL: 'zips',
      MIN_ZOOM: 6,
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 5,
        NO_TERRITORIES: false,
        NO_PLACE_SELECTOR: false,
      },
      PROPS: PROPS_FOR_LOA['zcta'],
      INITIAL_STATE: {
        cat: INITIAL_CAT,
        props: [PROPS_FOR_LOA['zcta'][INITIAL_KEY]]
      },
      ...SHARED_CONFIG
    },

    state: {
      LOA: 'state',
      MAP_ID: 'jfift.msd_state__2022_11-2',
      INFO: INTRO,
      PLACE_NAME: 'state',
      PLACE_NAME_PLURAL: 'states',
      MIN_ZOOM: 2,
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 2,
        NO_TERRITORIES: false,
        NO_PLACE_SELECTOR: true,
      },
      PROPS: PROPS_FOR_LOA['state'],
      INITIAL_STATE: {
        cat: INITIAL_CAT,
        props: [PROPS_FOR_LOA['state'][INITIAL_KEY]]
      },
      ...SHARED_CONFIG
    },
  },

  MAPBOX_TOKEN
};
