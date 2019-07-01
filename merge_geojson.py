import json
from glob import glob
from tqdm import tqdm

merged = {
    'type': 'FeatureCollection',
    'features': []
}

for f in tqdm(glob('zipcodes/*.json')):
    gj = json.load(open(f))
    merged['features'] += gj['features']

with open('zipcodes.geojson', 'w') as f:
    json.dump(merged, f)