#!/bin/bash

# Clean up
# rm {zctas,schools,msd}.mbtiles
rm msd.mbtiles

# Generate ZCTA tiles
tippecanoe -o msd.mbtiles -P -z12 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --simplify-only-low-zooms --no-tiny-polygon-reduction --accumulate-attribute=zipcode:comma zctas.geojson

# Generate school tiles
# tippecanoe -o schools.mbtiles -r1 --generate-ids schools.geojson

# Merge tilesets
# tile-join -o msd.mbtiles zctas.mbtiles schools.mbtiles