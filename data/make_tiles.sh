#!/bin/bash

# Clean up
for path in zctas/*.geojson; do
    f=${path##*/}
    output="tiles/${f%.*}.mbtiles"
    rm "$output"

    # Generate ZCTA tiles
    tippecanoe -o "$output" -P -z12 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --simplify-only-low-zooms --no-tiny-polygon-reduction --accumulate-attribute=zipcode:comma -D 11 $path
done

# # Merge tilesets
# tile-join -o msd.mbtiles zctas.mbtiles schools.mbtiles