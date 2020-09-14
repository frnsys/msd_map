#!/bin/bash

# Clean up
for dir in gen/tile_data/*/; do
    loa=$(basename $dir)
    for path in "$dir"/*.geojson; do
        f=${path##*/}
        output="gen/tiles/${loa}__${f%.*}.mbtiles"
        rm "$output"
        tippecanoe -l "data" -o "$output" -P -z12 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders -S 10  --accumulate-attribute=loa_key:comma -D 11 $path
    done
done