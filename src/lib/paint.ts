import color from './color';

// Mapbox seems to turn 'null'
// values into 0, so we can
// specify a different value that
// we're using in the geojson to represent null.
const NULL_VALUE: null = null;

function stopToValue(stop: number, range: NumRange) {
  return range[0] + (range[1] - range[0]) * stop;
}

function gradientToStyle(gradient: Gradient, range: NumRange, idx?: number) {
  return Object.keys(gradient)
    .map((stop) => parseFloat(stop))
    .sort()
    .reduce((acc, stop) => {
      acc.push(stopToValue(stop, range));
      if (idx !== undefined) {
        acc.push(color.hexToRGB(gradient[stop])[idx]);
      } else {
        acc.push(gradient[stop]);
      }
      return acc;
    }, []);
}

class Painter {
  colors: Colors;
  nullValue: any;

  constructor(colors: Colors, nullValue?: any) {
    this.colors = colors;
    this.nullValue = nullValue || NULL_VALUE;
  }

  bivariate(propA: Prop, propB: Prop) {
    let ranges = {
      a: propA.range,
      b: propB.range,
    };
    let colors = {
      a: propA.color,
      b: propB.color,
    };
    return [
      'case',

        // If feature-state is set to focus
        ['boolean', ['feature-state', 'focus'], false],
          this.colors.focus,

        // If either property is null
        ['==', ['get', propA.key], this.nullValue],
          this.colors.null,

        ['==', ['get', propB.key], this.nullValue],
          this.colors.null,

        ['concat',
          'rgb(',

          // r
          ['*',
            ['interpolate', ['linear'], ['get', propA.key]].concat(gradientToStyle(colors.a, ranges.a, 0)),
            ['interpolate', ['linear'], ['get', propB.key]].concat(gradientToStyle(colors.b, ranges.b, 0)),
            255
          ],

          ',',

          // g
          ['*',
            ['interpolate', ['linear'], ['get', propA.key]].concat(gradientToStyle(colors.a, ranges.a, 1)),
            ['interpolate', ['linear'], ['get', propB.key]].concat(gradientToStyle(colors.b, ranges.b, 1)),
            255
          ],

          ',',

          // b
          ['*',
            ['interpolate', ['linear'], ['get', propA.key]].concat(gradientToStyle(colors.a, ranges.a, 2)),
            ['interpolate', ['linear'], ['get', propB.key]].concat(gradientToStyle(colors.b, ranges.b, 2)),
            255
          ],

          ')'
      ]
    ]
  }

  range(prop: Prop) {
    return [
      'case',

      // If feature-state is set to focus
      ['boolean', ['feature-state', 'focus'], false],
        this.colors.focus,

      // If the property value is null
      ['==', ['get', prop.key], this.nullValue],
        prop.nullColor || this.colors.null,

      // Otherwise, interpolate color
      ['interpolate', ['linear'], ['get', prop.key]].concat(gradientToStyle(prop.color, prop.range))
    ];
  }
}

export default Painter;
