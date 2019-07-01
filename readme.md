Download zip code GeoJSON data from: <https://github.com/OpenDataDE/State-zip-code-GeoJSON>

loading large GeoJSON:
- <https://stackoverflow.com/questions/17626198/render-2500-geojson-polygons-onto-a-leaflet-map>
- <https://stackoverflow.com/questions/51014570/how-to-load-a-large-geojson-file-in-leaflet>
- <https://gis.stackexchange.com/questions/178876/speeding-up-large-geojsons-in-leaflet-maps>
- <https://blog.mapbox.com/rendering-big-geodata-on-the-fly-with-geojson-vt-4e4d2a5dd1f2>

---

```
python merge_geojson.py
tippecanoe -o zipcodes.mbtiles -zg --coalesce-densest-as-needed --extend-zooms-if-still-dropping --generate-ids zipcodes.geojson

python data_to_json.py
```

Start server:

```
npm start
```
