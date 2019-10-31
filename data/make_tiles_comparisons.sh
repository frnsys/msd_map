#!/bin/bash

# Generate ZCTA tiles
tippecanoe -o msd_comparison_30.mbtiles -P -z12 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --simplify-only-low-zooms --no-tiny-polygon-reduction --accumulate-attribute=zipcode:comma -l zctas comparison_30.geojson

tippecanoe -o msd_comparison_45.mbtiles -P -z12 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --simplify-only-low-zooms --no-tiny-polygon-reduction --accumulate-attribute=zipcode:comma -l zctas comparison_45.geojson

tippecanoe -o msd_comparison_60.mbtiles -P -z12 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --simplify-only-low-zooms --no-tiny-polygon-reduction --accumulate-attribute=zipcode:comma -l zctas comparison_60.geojson