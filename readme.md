# Data

Data processing code, source files, and generated files go into `data/`.

Outputs that are used directly in the frontend should be symlinked to `assets/data/`.

## Sources

- Download ZCTA GeoJSON data from: <https://geo.nyu.edu/catalog/harvard-tg10uszcta5>
    - And backup shapefile (for ZCTAs not present in the GeoJSON) from: <https://catalog.data.gov/dataset/tiger-line-shapefile-2017-2010-nation-u-s-2010-census-5-digit-zip-code-tabulation-area-zcta5-na>

## Data generation

### School data

```
# data/schools/
python reverse_geocode.py
python check_coords.py
python makeschools.py
```

### Map geometry data

```
# data/
python process_data.py
bash make_tiles.sh
```

# Running

```
npm start
```
