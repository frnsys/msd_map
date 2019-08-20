#!/bin/bash

rm msd.mbtiles
tippecanoe -o msd.mbtiles -zg --coalesce-densest-as-needed --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --no-line-simplification msd.geojson