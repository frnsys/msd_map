import color from './color';
import config from '../config';
import data from '../data/meta.json';

const BBOXES = data.bboxes;
const RANGES = data.ranges;
const MAPBOX_TOKEN = config.MAPBOX_TOKEN;

const SOURCE = 'zctas';
const SOURCE_LAYER = 'zctas';
const SCHOOLS_SOURCE = 'schools';

const colors = {
  'SCI': ['#fc949a', '#f7020e'],
  'avg_grosscost': ['#a9bdfc', '#023ff7'],
  'schools': ['#f5fff8', '#32a852'],
  'population_total': ['#fff8d6', '#ffd721'],
  'UNDUPUG': ['#ffedff', '#c65cff']
};
const COLORS = Object.keys(colors).reduce((acc, prop) => {
  acc[prop] = colors[prop].map((h) => color.hexToRGB(h));
  return acc;
}, {});
const FOCUS_COLOR = '#f9ca74';
const SCHOOL_FOCUS_COLORS = {
  'fill': '#67A2FD',
  'stroke': '#1f70ed'
};

const CATS = {
  'allschools': 'All',
  'public': 'Public',
  'privnot4prof': 'Private, not-for-profit',
  'priv4prof': 'Private, for-profit',
  'bachelor': 'Bachelor Degree',
  'associate': 'Associate Degree',
  'belowassociate': 'Below Associate Degree'
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

const INITIAL_CAT = 'allschools';
const INITIAL_PROPS = ['SCI', 'avg_grosscost'].map((p) => {
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
  INITIAL_PROPS,
  INITIAL_CAT,
  CATS, HAS_CATS,
  SHORT_NAMES,
  COLORS, DESCS, RANGES,
  BBOXES, FOCUS_COLOR,
  SOURCE, SOURCE_LAYER,
  SCHOOLS_SOURCE,
  SCHOOL_FOCUS_COLORS,
  MAPBOX_TOKEN
};
