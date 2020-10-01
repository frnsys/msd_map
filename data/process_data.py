"""Merges zipcode/congressional district geojson data
and also merges in other zipcode/congressional district data.

Note: occurences of "." in a column name
are replaced w/ "_"
"""

import os
import sys
import math
import ftfy
import json
import fiona
import numpy as np
import pandas as pd
from tqdm import tqdm
from itertools import product
from collections import defaultdict
from shapely.geometry import shape, mapping

# For plotting shapes
# import geopandas as gpd
# import matplotlib.pyplot as plt
# gpd.GeoSeries(shape(f['geometry'])).plot()
# plt.show()

# loa = Level of analysis
LOA = sys.argv[1] # 'ZCTA' OR 'CD'

# For CD, need to change the column names in CD_Level.45.min.csv:
# %s/AVG_LOCAL_//
# %s/MED_STU_BAL/STU_TOT_BAL

if LOA == 'ZCTA':
    AREA_LEVEL_PATH = 'src/zips/ZipLevel.{I}.csv'
    ZONE_LEVEL_PATH = 'src/school_zones/{Y}.{I}.Schoolzones.SCI.csv'
    SHAPES_PATH = 'src/zctas/tl_2017_us_zcta510.shp'
    CSV_LOA_FIELD = 'ZCTA'
    ZONE_LOA_FIELD = 'ZCTA5CE10'
    SHAPE_LOA_FIELD = 'ZCTA5CE10'
    LOA_FIELD_DIGITS = 5
    REF_GEOJSON = 'src/zipcodes.geojson'
elif LOA == 'CD':
    AREA_LEVEL_PATH = 'src/congressional_districts/CD_Level.{I}.csv'
    ZONE_LEVEL_PATH = 'src/congressional_districts/zones/{Y}.{I}.Schoolzones.CD.csv'
    SHAPES_PATH = 'src/congressional_districts/shapes/tl_2018_us_cd116.shp'
    CSV_LOA_FIELD = 'CONG_DIST'
    ZONE_LOA_FIELD = 'CONG_DIST'
    SHAPE_LOA_FIELD = 'GEOID'
    LOA_FIELD_DIGITS = 4
    REF_GEOJSON = 'src/congressional_districts/shapes/cds.geojson'

SCHOOL_FIELDS = [
    'MAPNAME',
    'INSTNM',
    'ICLEVEL',
    'CONTROL',
    'UNDUPUG',
    'ENROLLED',
    'AVGNETPRICE',
    'TUFEYR3' # sticker price
]

# ISO A2
COUNTRIES = ['US', 'PR', 'AS', 'GU', 'MP', 'VI']
STATES = ['Alaska', 'Hawaii']

# New zip-level data has different
# field names. Correct them here
KEY_FIXES = {
    'con_1': 'public',
    'con_2': 'privnot4prof',
    'con_3': 'priv4prof',
    'lev_1': 'bachelor',
    'lev_2': 'associate',
    'lev_3': 'belowassociate',
}
KEY_FIXES_MAP = {v: k for k, v in KEY_FIXES.items()}

CATEGORIES = {
    'S': [
        'allschools',
        'public',
        'privnot4prof',
        'priv4prof',
        'bachelor',
        'associate',
        'belowassociate'
    ],
    'I': [
        '30min',
        '45min',
        '60min'
    ],
    'Y': [
        '2009',
        '2010',
        '2011',
        '2012',
        '2013',
        '2014',
        '2015',
        '2016',
        '2017',
        '2018',
        '2019',
    ]
}
if LOA == 'CD':
    CATEGORIES['I'] = ['45min']


# Make separate maps on these keys
# MAPS_BY = ['I']

# False is a special value to create just one map for everything
# Sometimes this is better if the bulk of the filesize is due to the geometry and not the properties
MAPS_BY = False

# What gets included in the geojson features,
# try to include only that will be used to color tiles
FEAT_FIELDS = {
    'SCI': ['S', 'I', 'Y'],

    # average net price across all income brackets for schools in zone
    'AVGNP': ['S', 'I', 'Y'],

    'MEDIANINCOME': ['Y'],
    'STU_TOT_BAL': ['Y']
}

# These are queried separately when a feature is focused on,
# instead of being part of the feature itself
QUERY_FIELDS = {
    'n': ['S', 'I', 'Y'],

    # average published tuition + fees for schools in zone
    'AVGTF': ['S', 'I', 'Y'],

    # average total price for students living on campus for schools in zone
    # 'AVGCINSON': ['S', 'I', 'Y'],

    # average total price for students living off campus (not with family) for schools in zone
    # 'AVGCINSOFF': ['S', 'I', 'Y'],

    # average total price for students living off campus with family for schools in zone
    # 'AVGCINSFAM': ['S', 'I', 'Y'],

    # average net price for low income students (fam income < 30k) for schools in zone
    # 'AVGNPI30': ['S', 'I', 'Y'],

    'MEDIANINCOME': ['Y'],
}
if LOA == 'ZCTA':
    QUERY_FIELDS['ENROLLED'] = ['S', 'I', 'Y']
    QUERY_FIELDS['SINGLEZCTAPOP'] = ['Y']
    QUERY_FIELDS['ZCTAZONEPOP'] = ['Y']
elif LOA == 'CD':
    QUERY_FIELDS['CDPOP'] = ['Y']

# Use these instead of the actual data max
# To deal with outliers squashing the visual data range
RANGE_MINS = {
    'AVGNP': 5000,
    'STU_TOT_BAL': 10000,
    'MEDIANINCOME': 10000,
}
RANGE_MAXS = {
    'AVGNP': 20000,
    'STU_TOT_BAL': 25000,
    'MEDIANINCOME': 40000,
}

# Keep only non-varying properties
# for school geojson
SCHOOL_GEOJSON_PROPS = [
    'id',
    'MAPNAME',
    'INSTNM', 'ZIP',

    # Needed for proper coloring of school points
    'ICLEVEL', 'CONTROL',
]

def keysForCats(cats, fixed=None, k=None):
    fixed = fixed or {}
    tags = sorted(cats)
    opts = [[fixed[t]] if t in fixed else CATEGORIES[t] for t in tags]
    keys = [
        '.'.join('{}:{}'.format(t, c) for t, c in zip(tags, p))
        for p in product(*opts)
    ]
    if k:
        return ['{}.{}'.format(k, key) for key in keys]
    else:
        return keys

def keyForCat(cat, k=None):
    tags = '.'.join(['{}:{}'.format(c, cat[c]) for c in sorted(cat.keys())])
    if k:
        if tags:
            return '{}.{}'.format(k, tags)
        else:
            return k
    else:
        return tags

def catsForKey(key):
    parts = key.split('.')
    if ':' not in parts[0]:
        k = parts.pop(0)
    else:
        k = None
    parts = [p.split(':') for p in parts]
    return {p[0]: p[1] for p in parts}, k

def subKey(key, drop):
    cats, k = catsForKey(key)
    keep = {k: v for k, v in cats.items() if k not in drop}
    return keyForCat(keep, k=k)


loa_keys = set()
data = defaultdict(dict)
query_data = defaultdict(dict)
field_data = defaultdict(lambda: defaultdict(list))
for i in CATEGORIES['I']:
    df_all = pd.read_csv(AREA_LEVEL_PATH.format(I=i))
    groups = df_all.groupby('YEAR')
    for y in CATEGORIES['Y']:
        cat = {'Y': y, 'I': i}
        df = groups.get_group(int(y))
        df = df.where(pd.notnull(df), None)
        for row in tqdm(df.itertuples(), total=len(df), desc='{Y}/{I} {loa}'.format(**cat, loa=LOA)):
            row_data = dict(row._asdict())
            if row_data[CSV_LOA_FIELD] is None or math.isnan(row_data[CSV_LOA_FIELD]): continue
            loa_key = str(int(row_data[CSV_LOA_FIELD])).zfill(LOA_FIELD_DIGITS)
            loa_keys.add(loa_key)

            for datadict, fields in [(data, FEAT_FIELDS), (query_data, QUERY_FIELDS)]:
                for k, cats in fields.items():
                    # LOA year-level stats
                    if cats == ['Y']:
                        key = keyForCat({'Y': y}, k)
                        val = row_data[k]
                        datadict[loa_key][key] = val
                        field_data[k][key].append(val)

                    elif 'I' not in cats: continue
                    elif 'S' in cats:
                        for s in CATEGORIES['S']:
                            s_ = KEY_FIXES_MAP.get(s, s)
                            key = keyForCat({'Y': y, 'I': i, 'S': s}, k)
                            val = row_data['{}_{}'.format(k, s_)]
                            datadict[loa_key][key] = val
                            field_data[k][key].append(val)

                            # if k == 'AVGNP' and val is not None and val > 75000:
                            #     print(f'{zipcode} y={y},i={i},s={s} -> {val}')
                    else:
                        key = keyForCat({t: cat[t] for t in cats}, k)
                        datadict[loa_key][key] = row_data[k]
                        field_data[k][key].append(val)

# Compute ranges
meta = {}
meta['ranges'] = {}
for k in FEAT_FIELDS.keys():
    vals = []
    # Get min/max across all categories
    for K, vs in field_data[k].items():
        vs = [v for v in vs if v is not None]
        if vs:
            vals.append(float(min(vs)))
            vals.append(float(max(vs)))

    mn = RANGE_MINS.get(k, min(vals))
    mx = RANGE_MAXS.get(k, max(vals))
    meta['ranges'][k] = (mn, mx)

# import ipdb; ipdb.set_trace()

# Compute summary statistics (within categories)
# To keep file size smaller, just using min
# for s in ['mean', 'median', 'min', 'max']:
for s in ['min']:
    meta[s] = {}
    for k, cats in FEAT_FIELDS.items():
        for key in keysForCats(cats):
            key = '{}.{}'.format(k, key)
            vals = [v for v in field_data[k][key] if v is not None]
            try:
                meta[s][key] = float(getattr(np, s)(vals))
            except ValueError:
                # Probably missing that year's data
                meta[s][key] = None


# School-level data
# Associate schools with LOAs and load school data
# TODO how to do this with minimal redundancy
schools_by_year = defaultdict(dict)
schools_geojson = {
    'type': 'FeatureCollection',
    'features': []
}
data_by_key_loa = defaultdict(lambda: defaultdict(lambda: {'schools': []}))

# School-level
school_feats = {}
all_years = pd.read_csv('src/Master_SchoolList.csv',
        encoding='ISO-8859-1',
        dtype={'YEAR': str, 'ZIP': str})

# Mapbox does not allow string feature ids,
# so we have to convert these to uints
# <https://github.com/mapbox/mapbox-gl-js/issues/2716>
schoolidx_to_featid = {}
for i, key in enumerate(all_years.groupby(['UNITID', 'ADDR', 'MAPNAME']).groups.keys()):
    schoolkey = '__'.join(str(k) for k in key)
    schoolidx_to_featid[schoolkey] = i

all_years = all_years.groupby('YEAR')
reverse_geocode_lookup = json.load(open('gen/reverse_geocode_lookup.json'))
coordinate_corrections = json.load(open('gen/coordinate_corrections.json'))
for y in CATEGORIES['Y']:
    # TODO these are overwriting each year atm
    df = all_years.get_group(y)
    df = df.where((pd.notnull(df)), None)
    for row in tqdm(df.itertuples(), total=len(df), desc='{} School List'.format(y)):
        row_data = dict(row._asdict())
        schoolkey = '__'.join(str(v) if v is not None else 'nan' for v in [row_data[k] for k in ['UNITID', 'ADDR', 'MAPNAME']])
        id = schoolidx_to_featid[schoolkey]
        fixed_coords = coordinate_corrections.get(schoolkey, {})

        # Get zipcode into proper format
        zipcode = row_data['ZIP']
        zipcode = zipcode.split('-')[0] # drop the -XXXX part of zip
        if len(zipcode) < 5:
            zipcode = str(int(zipcode)).zfill(5)

        schools_by_year[id][y] = {k: row_data[k] for k in SCHOOL_FIELDS}
        schools_by_year[id][y]['ZIP'] = zipcode
        schools_by_year[id][y]['id'] = id

        if id not in school_feats:
            props = {k: schools_by_year[id][y][k] for k in SCHOOL_GEOJSON_PROPS}
            props['years'] = []

            # Get corrected coordinates, if any
            coord_key = '{}_{}'.format(row_data['LATITUDE'], row_data['LONGITUD'])
            coords = fixed_coords.get(coord_key, {
                'lat': row_data['LATITUDE'],
                'lng': row_data['LONGITUD']
            })
            school_feats[id] = {
                'id': id,
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': (coords['lng'], coords['lat']),
                },
                'properties': props
            }
        school_feats[id]['properties']['years'].append(y)

    for i in CATEGORIES['I']:
        cat = {'Y': y, 'I': i}
        key = keyForCat(cat)
        fname = ZONE_LEVEL_PATH.format(**cat)
        try:
            df = pd.read_csv(fname, encoding='ISO-8859-1')
        except FileNotFoundError:
            print('Missing {}'.format(fname))
            continue
        for row in tqdm(df.itertuples(), total=len(df), desc='{Y}/{I} School Zones'.format(**cat)):
            row_data = dict(row._asdict())
            if row_data[ZONE_LOA_FIELD] is None or math.isnan(row_data[ZONE_LOA_FIELD]): continue
            loa_key = str(int(row_data[ZONE_LOA_FIELD])).zfill(LOA_FIELD_DIGITS)
            if not isinstance(row_data['ADDR'], str):
                lat, lng = row_data['LATITUDE'], row_data['LONGITUD']
                row_data['ADDR'] = reverse_geocode_lookup['{},{}'.format(lat, lng)]
            # Use ftfy to fix encoding issues (double encoded utf8, I believe)
            schoolkey = '__'.join(ftfy.fix_text(str(v)) if v is not None else 'nan' for v in [row_data[k] for k in ['UNITID', 'ADDR', 'MAPNAME']])
            id = schoolidx_to_featid[schoolkey]
            data_by_key_loa[key][loa_key]['schools'].append(id)

        # Zip level data
        key_map = {}
        for k, cats in QUERY_FIELDS.items():
            for fullkey in keysForCats(cats, fixed=cat, k=k):
                subkey = subKey(fullkey, drop=cat)
                key_map[fullkey] = subkey
        for loa_key in tqdm(loa_keys, desc='{Y}/{I} {loa} Data'.format(**cat, loa=LOA)):
            for fullkey, subkey in key_map.items():
                data_by_key_loa[key][loa_key][subkey] = query_data[loa_key][fullkey]

for school in school_feats.values():
    school['properties']['years'] = ','.join(school['properties']['years'])
    schools_geojson['features'].append(school)

# Get missing features to fill in
ref_geojson = json.load(open(REF_GEOJSON))
for f in ref_geojson['features']:
    loa_key = f['properties'][SHAPE_LOA_FIELD]
    try:
        loa_keys.remove(loa_key)
    except KeyError:
        continue

# Region bounding boxes
countries = fiona.open('src/countries/ne_10m_admin_0_countries.shp')
region_bboxes = {}
MAINLAND_SHAPE = None
for country in countries:
    props = country['properties']
    iso = props['ISO_A2']
    if iso not in COUNTRIES:
        continue
    if iso == 'US':
        shp = max(shape(country['geometry']), key=lambda s: s.area)
        region_bboxes['Mainland'] = shp.bounds
        MAINLAND_SHAPE = shp
    else:
        bbox = shape(country['geometry']).bounds
        region_bboxes[props['NAME']] = bbox

for state in STATES:
    feat = json.load(open('src/states/{}.geojson'.format(state.lower())))
    bbox = shape(feat['geometry']).bounds
    region_bboxes[state] = bbox

# Data source is incorrect about Alaska and American Samoa, set it manually
region_bboxes['Alaska'] = [-207.4133546365765, 50.796925749084465, -104.93451956255066, 71.79270027924889]
region_bboxes['American Samoa'] = [-171.84922996050645, -14.93534547358692, -168.25721358668446, -13.663497668009555]

NON_MAINLAND_STATES = ['72', '78', '60', '66', '69', '02', '15']
REMOVE_LAKES_FROM = ['55', '26'] # WI, MI
LAKES = [shape(s['geometry']) for s in fiona.open('src/lakes/ne_10m_lakes.shp')]

# Build geojson
bboxes = {}
if MAPS_BY:
    map_keys = keysForCats(MAPS_BY)
else:
    map_keys = ['ALL']
for key in map_keys:
    # Figure out what data keys we use for this map
    if key != 'ALL':
        keys = []
        cat, _ = catsForKey(key)
        for k, cats in FEAT_FIELDS.items():
            keys += keysForCats(cats, fixed=cat, k=k)
    else:
        keys = None

    geojson = []
    for f in tqdm(ref_geojson['features'], desc='Geojson for {}'.format(key)):
        f = {**f}
        if 'id' in f:
            del f['id']

        # Trim districts to state land boundaries
        if LOA == 'CD':
            statefp = f['properties']['STATEFP']
            if statefp in REMOVE_LAKES_FROM:
                for lake in LAKES:
                    if shape(f['geometry']).intersects(lake):
                        f['geometry'] = mapping(shape(f['geometry']).difference(lake))

        loa_key = f['properties'][SHAPE_LOA_FIELD]

        # Only keep non-null values
        f['properties'] = {k: v for k, v in data[loa_key].items() if v is not None}

        # Drop extraneous properties
        if keys is not None:
            f['properties'] = {subKey(k, drop=cat): f['properties'][k] for k in keys}

        # Keep STATEFP
        if LOA == 'CD':
            f['properties']['STATEFP'] = statefp

        f['properties']['loa_key'] = loa_key

        bboxes[loa_key] = shape(f['geometry']).bounds
        geojson.append(f)

    # Fill in leftover zctas
    if loa_keys:
        for f in tqdm(fiona.open(SHAPES_PATH), desc='Filling missing {}s'.format(LOA)):
            loa_key = f['properties'][SHAPE_LOA_FIELD]
            if loa_key not in loa_keys: continue

            # Trim districts to state land boundaries
            if LOA == 'CD':
                statefp = f['properties']['STATEFP']
                if statefp in REMOVE_LAKES_FROM:
                    for lake in LAKES:
                        if shape(f['geometry']).intersects(lake):
                            f['geometry'] = mapping(shape(f['geometry']).difference(lake))

            # Only keep non-null values
            f['properties'] = {k: v for k, v in data[loa_key].items() if v is not None}

            # Keep STATEFP
            if LOA == 'CD':
                f['properties']['STATEFP'] = statefp

            if 'id' in f:
                del f['id']
            f['properties']['loa_key'] = loa_key

            bboxes[loa_key] = shape(f['geometry']).bounds
            geojson.append(f)

    if not os.path.exists('gen/tile_data/{}'.format(LOA)):
        os.makedirs('gen/tile_data/{}'.format(LOA))
    with open('gen/tile_data/{}/{}.geojson'.format(LOA, key), 'w') as f:
        # Write one feature per line, so tippecanoe can process in parallel
        f.write('\n'.join(json.dumps(feat) for feat in geojson))



print('Saving files...')

# Common to all LOA
with open('gen/regions.json', 'w') as f:
    json.dump(region_bboxes, f)

with open('gen/schools.geojson', 'w') as f:
    json.dump(schools_geojson, f)

if not os.path.exists('gen/schools'):
    os.makedirs('gen/schools')
for id, school in schools_by_year.items():
    school['id'] = id
    with open('gen/schools/{}.json'.format(id), 'w') as f:
        json.dump(school, f)

# LOA specific
if not os.path.exists('gen/{}'.format(LOA)):
    os.makedirs('gen/{}'.format(LOA))

with open('gen/{}/meta.json'.format(LOA), 'w') as f:
    json.dump(meta, f)

bboxes_dir = 'gen/{}/bboxes'.format(LOA)
if not os.path.exists(bboxes_dir):
    os.makedirs(bboxes_dir)
for zip, bbox in bboxes.items():
    with open('{}/{}.json'.format(bboxes_dir, zip), 'w') as f:
        json.dump(bbox, f)

loa_path = 'gen/{}/by_cat'.format(LOA)
if not os.path.exists(loa_path):
    os.makedirs(loa_path)
for key, schools_by_loa in data_by_key_loa.items():
    for loa_key, schools in schools_by_loa.items():
        path = '{}/{}'.format(loa_path, key)
        if not os.path.exists(path):
            os.makedirs(path)
        with open('{}/{}.json'.format(path, loa_key), 'w') as f:
                json.dump(schools, f)

# with open('gen/{}/data.json'.format(LOA), 'w') as f:
#     json.dump(data, f)

print('Done')