#!/bin/bash

# Clean up
rm {zctas,schools,msd}.mbtiles

# Generate ZCTA tiles
tippecanoe -o zctas.mbtiles -zg --coalesce-densest-as-needed --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --no-line-simplification zctas.geojson

# Only show schools at zoom levels 4 and higher
# https://github.com/mapbox/tippecanoe#zoom-levels
# tippecanoe -o schools.mbtiles -zg -r1 --generate-ids -Z4 schools.geojson
tippecanoe -o schools.mbtiles -zg --generate-ids schools.geojson

# Merge tilesets
tile-join -o msd.mbtiles zctas.mbtiles schools.mbtiles