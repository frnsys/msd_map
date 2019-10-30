import color from './color';

// Mapbox seems to turn 'null'
// values into 0, so we can
// specify a different value that
// we're using in the geojson to represent null.
const NULL_VALUE = 0;

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
      ['interpolate', ['linear'], ['get', prop],
        this.ranges[prop][0], color.colorToRGB(this.colors[prop][0]), this.ranges[prop][1], color.colorToRGB(this.colors[prop][1])
      ]
    ];
  }
}

export default Painter;
