#!/bin/bash

for path in gen/tile_data/*.geojson; do
    f=${path##*/}
    output="gen/tiles/${f%.*}.mbtiles"
    rm "$output"
    tippecanoe -l "data" -o "$output" -P -z10 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders -S 10 --accumulate-attribute=id:comma -D 11 $path
done