#!/bin/bash

# Clean up
# rm {zctas,schools,msd}.mbtiles
rm msd.mbtiles

# Generate ZCTA tiles
tippecanoe -o msd.mbtiles -z12 --coalesce-smallest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --no-line-simplification --accumulate-attribute=zipcode:comma zctas.geojson

# Generate school tiles
# tippecanoe -o schools.mbtiles -r1 --generate-ids schools.geojson

# Merge tilesets
# tile-join -o msd.mbtiles zctas.mbtiles schools.mbtiles