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
  R: 'ALL',
  Y: '2021'
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
const CATS = {
  R: {
    'ALL': 'All',
    'BLACK': 'Black',
    'WHITE': 'White',
    'NATVAM': 'Native Amer.',
    'ASIAN': 'Asian',
    'LATINO': 'Latino',
  },
  Y: { // Show academic year
    '2021': '2020-2021',
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

export default {
  maps: {
    county: {
      LOA: 'county',
      MAP_ID: 'jfift.msd_county__2022_08-1',
      INFO: 'TODO',
      PLACE_NAME: 'county',
      PLACE_NAME_PLURAL: 'counties',
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 5,
        NO_TERRITORIES: false,
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
      MAP_ID: 'jfift.msd_zcta__2022_08-1',
      INFO: '<p>Welcome to the Millennial Student Debt map visualized at the <span class="smallcaps">ZCTA</span>-level. This map displays institutional, demographic, and financial variables sortable by academic year and in some cases, commuting distances and school type. <em style="color:#fff;">All dollar amounts are 2019-inflation adjusted.</em></p><p>Use the quick zoom buttons in the top left or type in your desired zip (try your home zip code!) to locate a particular area. Toggle different maps with the drop-downs and buttons; see the corresponding summary statistics on the gradient legend. Hover over the colorful statistical legend in the bottom left corner to highlight areas on the map that correspond to a particular statistical measurement. As you mouse over certain geographic areas, the schools within commuting distance of that zip will illuminate.</p>',
      PLACE_NAME: 'zip',
      PLACE_NAME_PLURAL: 'zips',
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 5,
        NO_TERRITORIES: false,
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
      MAP_ID: 'jfift.msd_state__2022_08-1',
      INFO: 'TODO',
      PLACE_NAME: 'state',
      PLACE_NAME_PLURAL: 'states',
      UI: {
        NO_DATA,
        PLACE_ID_LENGTH: 2,
        NO_TERRITORIES: false,
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
