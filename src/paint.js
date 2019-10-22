import util from './util';
import color from './color';
import config from './config';

function bivariate(propA, propB) {
  // where COLOR_RANGES[property] = [[r,g,b], [r,g,b]] and r,g,b are in [0,1]
  let propA_ = util.propNoCat(propA);
  let propB_ = util.propNoCat(propB);
  let ranges = {
    a: config.RANGES[propA_],
    b: config.RANGES[propB_],
  };
  let colors = {
    a: config.COLORS[propA_],
    b: config.COLORS[propB_],
  };
  return [
    'case',

      // If feature-state is set to focus
      ['boolean', ['feature-state', 'focus'], false],
        ['feature-state', 'fillColor'],

      ['concat',
        'rgb(',

        // r
        ['*',
          ['interpolate', ['linear'], ['get', propA],
            ranges.a[0], colors.a[0][0], ranges.a[1], colors.a[1][0]],

          ['interpolate', ['linear'], ['get', propB],
            ranges.b[0], colors.b[0][0], ranges.b[1], colors.b[1][0]],

          255
        ],

        ',',

        // g
        ['*',
          ['interpolate', ['linear'], ['get', propA],
            ranges.a[0], colors.a[0][1], ranges.a[1], colors.a[1][1]],

          ['interpolate', ['linear'], ['get', propB],
            ranges.b[0], colors.b[0][1], ranges.b[1], colors.b[1][1]],

          255
        ],

        ',',

        // b
        ['*',
          ['interpolate', ['linear'], ['get', propA],
            ranges.a[0], colors.a[0][2], ranges.a[1], colors.a[1][2]],

          ['interpolate', ['linear'], ['get', propB],
            ranges.b[0], colors.b[0][2], ranges.b[1], colors.b[1][2]],

          255
        ],

        ')'
    ]
  ]
}

function range(prop) {
  let prop_ = util.propNoCat(prop);
  return [
    'case',

    // If feature-state is set to focus
    ['boolean', ['feature-state', 'focus'], false],
      ['feature-state', 'fillColor'],

    // If the property value is 0
    ['==', ['get', prop], 0],
      '#262626',

    // Otherwise, interpolate color
    ['interpolate', ['linear'], ['get', prop],
      config.RANGES[prop_][0], color.colorToRGB(config.COLORS[prop_][0]), config.RANGES[prop_][1], color.colorToRGB(config.COLORS[prop_][1])
    ]
  ];
}

export default {
  bivariate, range
};
