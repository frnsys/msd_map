import config from './config';

function bivariate(propA, propB) {
  // where COLOR_RANGES[property] = [[r,g,b], [r,g,b]] and r,g,b are in [0,1]
  let ranges = {
    a: config.RANGES[propA],
    b: config.RANGES[propB],
  };
  let colors = {
    a: config.COLORS[propA],
    b: config.COLORS[propB],
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

function range(property) {
  return [
    'case',

    // If feature-state is set to focus
    ['boolean', ['feature-state', 'focus'], false],
      ['feature-state', 'fillColor'],

    // If the property value is 0
    ['==', ['get', property], 0],
      '#262626',

    // Otherwise, interpolate color
    ['interpolate', ['linear'], ['get', property],
      config.RANGES[property][0], color.colorToRGB(config.COLORS[property][0]), config.RANGES[property][1], color.colorToRGB(config.COLORS[property][1])
    ]
  ];
}

export default {
  bivariate, range
};
