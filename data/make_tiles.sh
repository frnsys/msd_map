#!/bin/bash

# Clean up
# rm {zctas,schools,msd}.mbtiles
rm msd.mbtiles

# Generate ZCTA tiles
# tippecanoe -o zctas.mbtiles -zg --coalesce-densest-as-needed --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --no-line-simplification zctas.geojson
# tippecanoe -o msd.mbtiles -zg --coalesce-densest-as-needed --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --no-line-simplification zctas.geojson
tippecanoe -o msd.mbtiles -z14 --coalesce-smallest-as-needed --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --no-line-simplification zctas.geojson

# Generate school tiles
# tippecanoe -o schools.mbtiles -r1 --generate-ids schools.geojson

# Merge tilesets
# tile-join -o msd.mbtiles zctas.mbtiles schools.mbtiles