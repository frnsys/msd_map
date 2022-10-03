import App from '@/ui/App';
import React from 'react';
import config from './config';
import { createRoot } from 'react-dom/client';

mapboxgl.accessToken = config.MAPBOX_TOKEN;

const root = createRoot(document.querySelector('.map-tool'));
root.render(<App maps={config.maps} />);
