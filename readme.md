# Data

Data processing code, source files, and generated files go into `data/`.

Outputs that are used directly in the frontend should be symlinked to `assets/data/`.

## Releases

Each major release and subsequent updates should be tagged.

That way each new release can remove files that were only relevant to the previous release, while preserving them in version control in a way that can easily be recovered.

## Sources

Run `data/src/download.sh` to download the publicly available source data.

## Data generation

### School data

```
# data/
python process_schools.py
```

### Generating tiles

```
# data/
python process_data.py <level of analysis>
# example: python process_data.py zcta

bash make_tiles.sh
```

### Upload tileset

```
# As of 8/18/2022,
# this still requires Python <3.8
# pip install mapboxcli

export MAPBOX_ACCESS_TOKEN=MY_TOKEN
mapbox upload USERNAME.msd_LOA__YEAR_MONTH-VERSION zcta.mbtiles
```

# Running

```
npm start
```
