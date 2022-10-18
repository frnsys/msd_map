import json
import fiona
import pandas as pd
from tqdm import tqdm
from shapely import geometry

try:
    zctaToState = json.load(open('src/zctaToState.json'))
except:
    zctaToState = {}

shp = list(fiona.open('src/zctaToState/states/cb_2018_us_state_500k.shp'))
df = pd.read_csv('src/zctaToState/2021_Gaz_zcta_national.txt', dtype={'GEOID': str}, delimiter='\t')
for i, row in tqdm(df.iterrows(), total=len(df)):
    zcta = row.GEOID
    if zcta in zctaToState: continue
    point = geometry.Point(row.INTPTLONG, row.INTPTLAT) # longitude, latitude

    ok = False
    dists = {}
    for feat in shp:
        shape = geometry.shape(feat['geometry'])
        state = feat['properties']['STUSPS']
        if shape.contains(point):
            zctaToState[zcta] = state
            ok = True
            break
        else:
            dists[state] = shape.distance(point)
    if not ok:
        cands = [(k, d) for k, d in dists.items() if d < 0.5]
        if not cands:
            import ipdb; ipdb.set_trace()
        zctaToState[zcta] = min(cands, key=lambda c: c[1])[0]

with open('src/zctaToState.json', 'w') as f:
    json.dump(zctaToState, f)