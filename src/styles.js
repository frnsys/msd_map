const allSchools = {
  'circle-opacity': [
    'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
      'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.2,
      1.0
    ]
  ],
  'circle-stroke-opacity': [
    'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
      'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.2,
      1.0
    ]
  ]
};

function filteredSchools(condition) {
  return {
    'circle-opacity': [
      'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
        'case',
          ['!=', ['get', condition[0]], condition[1]],
            0.0,
          ['boolean', ['feature-state', 'mute'], false],
            0.2,
          1.0
      ]
    ],
    'circle-stroke-opacity': [
      'interpolate', ['linear'], ['zoom'], 3, 0.0, 7, [
        'case',
          ['!=', ['get', condition[0]], condition[1]],
            0.0,
          ['boolean', ['feature-state', 'mute'], false],
            0.2,
          1.0
      ]
    ]
  };
}

const defaultSchools = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'], 5, 1, 10, 5
  ],
  'circle-color': [
    'case',

    ['boolean', ['feature-state', 'focus'], false],
      '#67A2FD',

    ['==', ['get', 'CONTROL'], 1],
      '#33C377',

    ['==', ['get', 'CONTROL'], 2],
      '#ffcc00',

    ['==', ['get', 'CONTROL'], 3],
      '#05a1ff',

    '#000000',
  ],
  'circle-stroke-color': [
    'case',

    ['boolean', ['feature-state', 'focus'], false],
      '#1f70ed',

    ['==', ['get', 'ICLEVEL'], 1],
      '#000000',

    ['==', ['get', 'ICLEVEL'], 2],
      '#888888',

    ['==', ['get', 'ICLEVEL'], 3],
      '#eeeeee',

    '#ff0000',
  ],
  'circle-stroke-width': [
    'interpolate', ['linear'], ['zoom'], 6, 0.0, 9, 3.0
  ],
  'circle-opacity': allSchools['circle-opacity'],
  'circle-stroke-opacity': allSchools['circle-stroke-opacity'],
};

const defaultZCTAs = {
  'fill-color': '#000000', // will be replaced on map initialization

  // Fade-out ZCTA outlines at low zooms
  'fill-outline-color': [
    'interpolate', ['linear'], ['zoom'], 5, 'rgba(0, 0, 0, 0)', 10, 'rgba(0,0,0,1)'
  ],

  'fill-opacity': [
    'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.2,
      1.0
  ]
};

export default {defaultZCTAs, allSchools, defaultSchools, filteredSchools};
