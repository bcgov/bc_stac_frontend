import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import STACMap from "../components/STACMap";
import CopyUrlComponent from "../components/CopyUrlComponent";
import { fetchSTACCollections, fetchSTACItems } from "../utils/stacUtils";
import { polygonStyle, selectionStyle } from "../utils/mapUtils";
import FilterComponent from "../components/FilterComponent";
import InfoPanel from "../components/InfoPanel";
import { Feature } from "geojson";
import "./MapPage.scss";

interface CollectionData {
  title: string;
  description?: string;
  id: string;
}

const App: React.FC = () => {
  const [stacLayer, setStacLayer] = useState<L.Layer | null>(null);
  const [stacBounds, setStacBounds] = useState<L.LatLngBounds | null>(null);
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [collectionUrl, setCollectionUrl] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<Feature>>(new Set());

  const mapRef = useRef<L.Map | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const collection = urlParams.get("collectionID") || "STAC Browser";

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const { collectionData, collectionUrl } = await fetchSTACCollections(collection);
        setCollectionData(collectionData);
        setCollectionUrl(collectionUrl);

        await fetchSTACItems(collection);

      } catch (error) {
        console.error("Error loading STAC features:", error);
      }
    };

    loadFeatures();
  }, [collection]);

  const filterLayerByDate = (layer: L.Layer, startDate: string, endDate: string) => {
    clearSelectedFeatures(); // Clear selected features
    if (layer instanceof L.LayerGroup) {
      layer.eachLayer((featureLayer: L.Layer) => {
        if (featureLayer instanceof L.Polygon) {
          const feature = featureLayer.feature as GeoJSON.Feature<GeoJSON.Geometry, { [name: string]: any }>;

          if (feature && feature.properties?.datetime) {
            const featureDate = new Date(feature.properties.datetime);
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (featureDate >= start && featureDate <= end) {
              // Enable interactions
              featureLayer.options.interactive = true;

              featureLayer.off("click").on("click", (e: L.LeafletMouseEvent) => {
                setSelectedFeatures((prevSelected) => {
                  const newSelected = new Set(prevSelected);
                  const feature = featureLayer.feature as Feature;
                  if (newSelected.has(feature)) {
                    newSelected.delete(feature);
                    featureLayer.setStyle(polygonStyle); // Restore original
                  } else {
                    newSelected.add(feature);
                    featureLayer.setStyle(selectionStyle); // Selection style
                  }
                  return newSelected;
                });
              });

            } else {
               const deactivatedStyle = {
                color: "#8A8A8A",
                weight: 1,
                opacity: 1,
                fillColor: "#ADADAD",
                fillOpacity: 0.6,
              };

              // Apply disabled symbology
              featureLayer.setStyle(deactivatedStyle);

              // Disable interactions but keep event listeners
              featureLayer.options.interactive = false;

              featureLayer.off("click").on("click", (e: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(e);
                console.log("Feature is disabled and cannot be selected.");
              });

              // Prevent Leaflet Draw edits
              featureLayer.on("pm:enable", (e) => {
                e.target.disableEdit();
              });

              featureLayer.on("pm:dragstart", (e) => {
                L.DomEvent.stopPropagation(e);
              });

              // Remove from selected features using setState
              setSelectedFeatures((prevSelected) => {
                const newSelected = new Set(prevSelected);
                const feature = featureLayer.feature as Feature;
                if (feature) {
                  newSelected.delete(feature);
                }
                return newSelected;
              });
            }
          }
        }
      });
    }
  };

  const resetDateFilter = () => {
    if (stacLayer instanceof L.LayerGroup) {
      clearSelectedFeatures(); // Clear selected features
      stacLayer.eachLayer((featureLayer: L.Layer) => {
        (featureLayer as L.Path).setStyle(polygonStyle);
        if (featureLayer instanceof L.Polygon) {
          featureLayer.options.interactive = true;
          featureLayer.off("click").on("click", (e: L.LeafletMouseEvent) => {
            setSelectedFeatures((prevSelected) => {
              const newSelected = new Set(prevSelected);
              const feature = featureLayer.feature as Feature;
              if (newSelected.has(feature)) {
                newSelected.delete(feature);
                featureLayer.setStyle(polygonStyle); // Restore original
              } else {
                newSelected.add(feature);
                featureLayer.setStyle(selectionStyle); // Selection style
              }
              return newSelected;
            });
          });
        }
      });
    }
  };

  const clearSelectedFeatures = () => {
    setSelectedFeatures(new Set()); // Clear the selected features
  
    if (stacLayer instanceof L.LayerGroup) {
      stacLayer.eachLayer((featureLayer: L.Layer) => {
        if (featureLayer instanceof L.Polygon) {
          featureLayer.setStyle(polygonStyle); // Reset to default style
        }
      });
    }
  };

  return (
    <div id="map-page-container">
      <div id="app-header">
        <a id="home-button" href="/">Home</a>
        <h1>Collection: {collectionData?.title}</h1>
        <CopyUrlComponent url={collectionUrl || ""} title="Collection URL:" />
      </div>
      <div id="app-container">

        <FilterComponent
          onFilterChange={(startDate: string, endDate: string) => {
            if (stacLayer) {
              filterLayerByDate(stacLayer, startDate, endDate);
            }
          }}
          onResetFilter={() => {
            resetDateFilter();
          }}
        />

        <div id="map-container">
          <STACMap
            stacCollectionID={collection || ""}
            setStacBounds={setStacBounds}
            mapRef={mapRef}
            setStacLayer={setStacLayer}
            setSelectedFeatures={setSelectedFeatures}
          />
        </div>

        <InfoPanel 
          selectedFeatures={selectedFeatures}
          map={mapRef.current} 
        />

      </div>
    </div>
  );
};

export default App;
