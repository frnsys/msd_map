Download zip code GeoJSON data from: <https://github.com/OpenDataDE/State-zip-code-GeoJSON>

loading large GeoJSON:
- <https://stackoverflow.com/questions/17626198/render-2500-geojson-polygons-onto-a-leaflet-map>
- <https://stackoverflow.com/questions/51014570/how-to-load-a-large-geojson-file-in-leaflet>
- <https://gis.stackexchange.com/questions/178876/speeding-up-large-geojsons-in-leaflet-maps>
- <https://blog.mapbox.com/rendering-big-geodata-on-the-fly-with-geojson-vt-4e4d2a5dd1f2>

---

```
python merge_geojson.py
bash make_tiles.sh

python data_to_json.py
```

Start server:

```
npm start
```

---

Experian data:
- 2009-2019
- 750,000 individuals (potentially more), different sample per year
- 18-35 y/o w/ active loans (or any active loans in the past 2 years)
    - loan kind, original loan amount, outstanding balance, repayment, repayment performance back 24 months

plus ACS data (income, demographics, etc)

- Heat map of school concentration
    - how to show tuition prices of schools (for each school) on top of that (column where height is tuition), as well as debt amounts (which will be aggregated)?
        - mapbox 3d support? expected around 4000 polys, need to limit at some zoom level
    - toggling between tuition as column height and debt level as column height
    - for heatmap see washington post lightning strike ma
    - a layer for each year
- generational
- two panes (2/3 map, 1/3 pane)

---

- Different zoom levels: <https://github.com/mapbox/tippecanoe#show-countries-at-low-zoom-levels-but-states-at-higher-zoom-levels>
- Heatmap: <https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/>
    - can be a geojson point source or a vector tile source
- Counties geojson: <https://eric.clst.org/tech/usgeojson/>
