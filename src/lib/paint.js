import color from './color';

// Mapbox seems to turn 'null'
// values into 0, so we can
// specify a different value that
// we're using in the geojson to represent null.
const NULL_VALUE = 0;

function stopToValue(stop, range) {
  return range[0] + (range[1] - range[0]) * stop;
}

function gradientToStyle(gradient, range, idx) {
  return Object.keys(gradient)
    .map((stop) => parseFloat(stop))
    .sort()
    .reduce((acc, stop) => {
      acc.push(stopToValue(stop, range));
      if (idx) {
        acc.push(gradient[stop][idx]);
      } else {
        acc.push(color.colorToRGB(gradient[stop]))
      }
      return acc;
    }, []);
}

class Painter {
  constructor(ranges, colors) {
    this.ranges = ranges;
    this.colors = colors;
  }

  bivariate(propA, propB) {
    // where COLOR_RANGES[property] = [[r,g,b], [r,g,b]] and r,g,b are in [0,1]
    let ranges = {
      a: this.ranges[propA],
      b: this.ranges[propB],
    };
    let colors = {
      a: this.colors[propA],
      b: this.colors[propB],
    };
    return [
      'case',

        // If feature-state is set to focus
        ['boolean', ['feature-state', 'focus'], false],
          this.colors['FOCUS'],

        // If either property is null
        ['==', ['get', propA], NULL_VALUE],
          this.colors['EMPTY'],

        ['==', ['get', propB], NULL_VALUE],
          this.colors['EMPTY'],

        ['concat',
          'rgb(',

          // r
          ['*',
            ['interpolate', ['linear'], ['get', propA]].concat(gradientToStyle(colors.a, ranges.a, 0)),
            ['interpolate', ['linear'], ['get', propB]].concat(gradientToStyle(colors.b, ranges.b, 0)),
            255
          ],

          ',',

          // g
          ['*',
            ['interpolate', ['linear'], ['get', propA]].concat(gradientToStyle(colors.a, ranges.a, 1)),
            ['interpolate', ['linear'], ['get', propB]].concat(gradientToStyle(colors.b, ranges.b, 1)),
            255
          ],

          ',',

          // b
          ['*',
            ['interpolate', ['linear'], ['get', propA]].concat(gradientToStyle(colors.a, ranges.a, 2)),
            ['interpolate', ['linear'], ['get', propB]].concat(gradientToStyle(colors.b, ranges.b, 2)),
            255
          ],

          ')'
      ]
    ]
  }

  range(prop) {
    return [
      'case',

      // If feature-state is set to focus
      ['boolean', ['feature-state', 'focus'], false],
        this.colors['FOCUS'],

      // If the property value is null
      ['==', ['get', prop], NULL_VALUE],
        this.colors['EMPTY'],

      // Otherwise, interpolate color
      ['interpolate', ['linear'], ['get', prop]].concat(gradientToStyle(this.colors[prop], this.ranges[prop]))
    ];
  }
}

export default Painter;
