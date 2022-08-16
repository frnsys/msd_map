# Data

Data processing code, source files, and generated files go into `data/`.

Outputs that are used directly in the frontend should be symlinked to `assets/data/`.

## Sources

Run `data/src/download.sh` to download the publicly available source data.

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
python process_data.py <level of analysis>
# example: python process_data.py zcta

bash make_tiles.sh
```

# Running

```
npm start
```
