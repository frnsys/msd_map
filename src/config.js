import color from './color';
import config from '../config';
import data from '../data/msd_meta.json';

const BBOXES = data.bboxes;
const RANGES = data.ranges;
const MAPBOX_TOKEN = config.MAPBOX_TOKEN;

const colors = {
  // 'SCI': ['#fffef5', '#fc9fa3'],
  // 'average_tuition': ['#f2f2fc', '#9fa3fc'],
  'SCI': ['#fc949a', '#f7020e'],
  'average_tuition': ['#a9bdfc', '#023ff7'],
  'n': ['#f5fff8', '#32a852'],
  'HD01_S001': ['#fff8d6', '#ffd721'],
  'EFTOTAL_overall': ['#ffedff', '#c65cff']
};
const COLORS = Object.keys(colors).reduce((acc, prop) => {
  acc[prop] = colors[prop].map((h) => color.hexToRGB(h));
  return acc;
}, {});

const DESCS = {
  'SCI': 'School Concentration Index',
  'average_tuition': 'Average Tuition',
  'n': 'Number of School Zones',
  'HD01_S001': 'Population Estimate',
  'EFTOTAL_overall': 'Enrollment Seats'
};

const SOURCE = 'msd';
const SOURCE_LAYER = 'msd';
const FOCUS_COLOR = '#f9ca74';
const INITIAL_PROPS = ['SCI', 'average_tuition'];

export default {
  INITIAL_PROPS,
  COLORS, DESCS, RANGES,
  BBOXES, FOCUS_COLOR,
  SOURCE, SOURCE_LAYER,
  MAPBOX_TOKEN
};
