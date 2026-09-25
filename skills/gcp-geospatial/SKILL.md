---
name: gcp-geospatial
description: >-
  Use this skill when developing geospatial pipelines, Earth Engine raster analytics,
  AlphaEarth satellite embeddings, BigQuery GIS, and Google Maps integrations.
---

# Geospatial Analytics, Earth Engine & BigQuery GIS Runbook

## 🎯 Domain Scope & Activation Triggers
Activate this skill whenever:
- Executing spatial analytics, geofencing, and polygon joins on petabyte datasets with **BigQuery GIS**.
- Processing planetary-scale multi-spectral satellite rasters using **Google Earth Engine** and BigQuery integration.
- Performing visual satellite imagery similarity search using **AlphaEarth Foundations Satellite Embeddings** and Vector SQL.
- Visualizing spatial distribution patterns and logistics delivery zones with Google Maps Platform and Google Earth layers.

---

## 🚫 Critical Anti-Patterns & Architecture Traps

> [!CAUTION]
> **Anti-Pattern 1: Unclustered Spatial Joins Forcing Cartesian Cross-Products [04.26, 08.25]**
> Executing spatial join predicates (`ST_CONTAINS`, `ST_INTERSECTS`, `ST_DWITHIN`) on unclustered BigQuery tables forces BigQuery to evaluate an $O(N \times M)$ Cartesian cross-product, causing severe slot starvation and catastrophic query failure.
> - **Mandatory Standard**: Always cluster spatial tables on their `GEOGRAPHY` column (`CLUSTER BY geom_col`). BigQuery automatically maps clustered geography into spherical S2 cells, allowing the query engine to prune unintersected spatial tiles before evaluating complex polygons.
> *Cites: [Mapping a smarter future with BigQuery and Google Earth AI models and datasets](./references/articles.md) and [A new way to use Earth Engine: Raster analytics and map visualization in BigQuery](./references/articles.md)*

> [!CAUTION]
> **Anti-Pattern 2: Exfiltrating Multi-Terabyte Satellite Rasters to Compute VMs [08.25, 04.26]**
> Downloading raw multi-spectral satellite imagery (Sentinel-2, Landsat-8) to Compute Engine VMs or local storage for NDVI or spectral index computation introduces massive egress costs, disk saturation, and processing bottlenecks.
> - **Mandatory Standard**: Execute raster computations in-situ using the **Google Earth Engine API** or the native **Earth Engine BigQuery Connector**. Run computations on Google's planetary infrastructure and materialize only aggregate zonal statistics into BigQuery.
> *Cites: [A new way to use Earth Engine: Raster analytics and map visualization in BigQuery](./references/articles.md) and [Mapping a smarter future with BigQuery and Google Earth AI models and datasets](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 3: Flat Planar Euclidean Distance Approximation on Geographic Coordinates [09.25, 08.25]**
> Treating latitude and longitude as Cartesian coordinates $(X, Y)$ and computing distances via Euclidean geometry ($\sqrt{\Delta x^2 + \Delta y^2}$) produces up to 40%+ calculation distortion at non-equatorial latitudes.
> - **Standard Protocol**: Utilize BigQuery GIS native `GEOGRAPHY` data types. Functions such as `ST_DISTANCE(point_a, point_b)` compute geodesic distance across the true WGS 84 reference ellipsoid in meters.
> *Cites: [New in Google Earth: Advanced Data Layers to Power Your Professional Projects](./references/articles.md) and [A new way to use Earth Engine: Raster analytics and map visualization in BigQuery](./references/articles.md)*

> [!WARNING]
> **Anti-Pattern 4: Relying Exclusively on Metadata Tags for Satellite Image Discovery [03.26, 12.25]**
> Filtering satellite observations solely through text metadata (e.g. cloud cover %, tile index, acquisition timestamp) fails to detect actual visual features such as illegal deforestation, new construction, or agricultural drought stress.
> - **Standard Protocol**: Leverage **AlphaEarth Foundations Satellite Embeddings**. AlphaEarth encodes satellite image tiles into high-dimensional visual embeddings stored directly in BigQuery, enabling `VECTOR_SEARCH` to find visually and environmentally similar terrain instantly.
> *Cites: [Embedding Vector Search and Beyond with Big Query, Earth Engine, and AlphaEarth Foundations Satellite Embeddings](./references/articles.md) and [AlphaEarth Foundations Satellite Embeddings: Now Available on Google Cloud Storage](./references/articles.md)*

---

## ⚖️ Architecture Decision Matrices

### 1. Geospatial Processing Framework Decision Matrix [04.26, 08.25]
| Workload Type | Recommended Platform | Primary Data Type | Typical Processing Latency |
| :--- | :--- | :--- | :--- |
| **Vector Geometry (Points, Polygons, Lines)** | BigQuery GIS | `GEOGRAPHY` (WGS 84) | Seconds (Petabyte scale) |
| **Multi-Spectral Satellite Imagery (Rasters)** | Google Earth Engine | `ee.Image`, `ee.ImageCollection` | Real-time map tiles / batch export |
| **Semantic Terrain Search** | BigQuery Vector Search + AlphaEarth | `ARRAY<FLOAT64>` embeddings | Sub-second IVF search |
| **Micro-Navigation & Geocoding** | Google Maps Platform APIs | JSON / REST Web Services | Sub-100ms |
*Cites: [Mapping a smarter future with BigQuery and Google Earth AI models and datasets](./references/articles.md) and [A new way to use Earth Engine: Raster analytics and map visualization in BigQuery](./references/articles.md)*

---

### 2. Spatial Indexing & Partitioning Strategy Matrix [04.26, 03.26]
| Indexing Strategy | Native BigQuery Support | Mathematical Basis | Best Suited For |
| :--- | :--- | :--- | :--- |
| **S2 Cell Spatial Clustering** | Native (`CLUSTER BY geom`) | Hilbert curve on cube projection | Large-scale spatial joins, point-in-polygon |
| **H3 Hexagonal Binning** | UDF / Mathematical H3 | Discrete global hexagonal grid | Equal-area spatial aggregation, dynamic pricing |
| **Bounding Box (BBOX) Prefilter** | Native (`ST_DWITHIN`) | Cartesian envelope pruning | Fast proximity queries and geofencing |
| **Partition by Date + Cluster by Geom** | Native (`PARTITION BY DATE(ts)`) | Temporal + S2 spatial hierarchy | Telematics, fleet tracking, IoT delivery feeds |
*Cites: [Mapping a smarter future with BigQuery and Google Earth AI models and datasets](./references/articles.md) and [Embedding Vector Search and Beyond with Big Query, Earth Engine, and AlphaEarth Foundations Satellite Embeddings](./references/articles.md)*

---

## 🛠️ Production Blueprints

### Blueprint 1: BigQuery GIS Spatial Clustering & ST_CONTAINS Join (SQL) [04.26, 08.25]
Execute a high-performance spatial join to associate fleet delivery orders with metropolitan delivery zones:
```sql
-- Step 1: Create spatially clustered orders table
CREATE OR REPLACE TABLE `my_project.logistics.orders`
PARTITION BY DATE(order_timestamp)
CLUSTER BY delivery_location
AS
SELECT
  order_id,
  order_timestamp,
  ST_GEOGPOINT(longitude, latitude) AS delivery_location,
  order_amount
FROM `my_project.raw_ingestion.orders_feed`;

-- Step 2: High-speed spatial join utilizing S2 cell pruning
SELECT
  orders.order_id,
  zones.zone_name,
  ST_DISTANCE(orders.delivery_location, zones.zone_center) AS distance_to_center_meters
FROM `my_project.logistics.orders` AS orders
JOIN `my_project.logistics.delivery_zones` AS zones
  ON ST_CONTAINS(zones.polygon_boundary, orders.delivery_location)
WHERE orders.order_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY);
```
*Cites: [Mapping a smarter future with BigQuery and Google Earth AI models and datasets](./references/articles.md) and [A new way to use Earth Engine: Raster analytics and map visualization in BigQuery](./references/articles.md)*

---

### Blueprint 2: AlphaEarth Satellite Embedding Vector Search in BigQuery (SQL) [03.26, 12.25]
Perform semantic satellite imagery search to locate terrain patches matching a target reference site:
```sql
SELECT
  base.tile_id,
  base.acquisition_date,
  base.coordinates,
  distance
FROM VECTOR_SEARCH(
  TABLE `my_project.satellite_analytics.alphaearth_embeddings`,
  'embedding',
  (
    SELECT embedding 
    FROM `my_project.satellite_analytics.alphaearth_embeddings`
    WHERE tile_id = 'TARGET_DEFORESTATION_HOTSPOT_001'
  ),
  top_k => 25,
  distance_type => 'COSINE'
);
```
*Cites: [Embedding Vector Search and Beyond with Big Query, Earth Engine, and AlphaEarth Foundations Satellite Embeddings](./references/articles.md) and [AlphaEarth Foundations Satellite Embeddings: Now Available on Google Cloud Storage](./references/articles.md)*

---

### Blueprint 3: Earth Engine Raster NDVI Analytics with BigQuery Export (Python) [08.25]
Compute Normalized Difference Vegetation Index (NDVI) across Sentinel-2 surface reflectance and export zonal averages:
```python
import ee

ee.Initialize()

def compute_zonal_vegetation(roi_polygon_coords: list) -> ee.FeatureCollection:
    """Computes median NDVI over Sentinel-2 imagery for a specified Region of Interest."""
    roi = ee.Geometry.Polygon(roi_polygon_coords)
    
    # Load cloud-masked Sentinel-2 Surface Reflectance
    s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(roi)
          .filterDate('2026-06-01', '2026-08-31')
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)))
    
    # Calculate NDVI = (NIR - RED) / (NIR + RED) = (B8 - B4) / (B8 + B4)
    def add_ndvi(image):
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        return image.addBands(ndvi)
        
    median_composite = s2.map(add_ndvi).median()
    
    # Extract zonal stats over ROI
    stats = median_composite.select('NDVI').reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=roi,
        scale=10,
        maxPixels=1e9
    )
    return stats
```
*Cites: [A new way to use Earth Engine: Raster analytics and map visualization in BigQuery](./references/articles.md)*

---

### Blueprint 4: High-Throughput Geofence Alerting Pipeline with ST_DWITHIN (SQL) [04.26, 09.25]
Detect fleet vehicles approaching restricted perimeter zones within a 500-meter buffer:
```sql
SELECT
  v.vehicle_id,
  v.last_ping_time,
  p.perimeter_name,
  ST_DISTANCE(v.current_point, p.boundary_geom) AS distance_meters
FROM `my_project.telematics.live_vehicle_pings` AS v
CROSS JOIN `my_project.security.restricted_perimeters` AS p
WHERE ST_DWITHIN(v.current_point, p.boundary_geom, 500)
  AND v.last_ping_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE);
```
*Cites: [Mapping a smarter future with BigQuery and Google Earth AI models and datasets](./references/articles.md) and [New in Google Earth: Advanced Data Layers to Power Your Professional Projects](./references/articles.md)*

---

## ⏱️ Chronological Evolution (2025–2026)
- **[04.26]**: Google Earth AI models and datasets natively accessible inside BigQuery.
- **[03.26]**: AlphaEarth Foundations satellite embeddings integrated with BigQuery Vector Search.
- **[12.25]**: AlphaEarth Foundations satellite embeddings released on Cloud Storage.
- **[09.25]**: Google Earth professional advanced data layers released for commercial GIS analysis.
- **[08.25]**: Earth Engine raster analytics and direct map visualization launched for BigQuery.

---

## 📚 Reference Vaults & Portability Standard
* **Active Post-Cutoff Delta Knowledge Vault (2025–2026)**:  
  👉 [Active Delta Articles Vault](./references/articles.md)
* **Historical & Evergreen Geospatial Masterclasses Vault (<= 2024)**:  
  👉 [Historical & Evergreen Archive Vault](./references/archive.md)
