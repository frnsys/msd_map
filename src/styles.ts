const defaultPlaces = {
  'fill-color': '#000000', // will be replaced on map initialization

  // Fade-out feature outlines at low zooms
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

export default {defaultPlaces};
