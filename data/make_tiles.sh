#!/bin/bash

# Clean up
for path in gen/zctas/*.geojson; do
    f=${path##*/}
    output="gen/tiles/${f%.*}.mbtiles"
    rm "$output"

    # Generate ZCTA tiles
    # tippecanoe -l "zctas" -o "$output" -P -z12 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders --simplify-only-low-zooms --no-tiny-polygon-reduction --accumulate-attribute=zipcode:comma -D 11 $path
    tippecanoe -l "zctas" -o "$output" -P -z12 --coalesce-densest-as-needed --hilbert --extend-zooms-if-still-dropping --generate-ids --detect-shared-borders -S 10  --accumulate-attribute=zipcode:comma -D 11 $path
done

# # Merge tilesets
# tile-join -o msd.mbtiles zctas.mbtiles schools.mbtiles