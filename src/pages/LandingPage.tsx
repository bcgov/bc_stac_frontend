import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stac_url, fetchSTACCatalog, fetchSTACCollections } from "../utils/stacUtils";
import CopyUrlComponent from "../components/CopyUrlComponent";
import "./LandingPage.scss";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-CA");
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<any | null>(null);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    const loadCatalogAndCollections = async () => {
      try {
        const { data } = await fetchSTACCatalog();
        console.log("STAC Catalog:", data);
        setCatalog(data);

        const collectionsData = await fetchSTACCollections();
        console.log("STAC Collections:", collectionsData);
        setCollections(collectionsData.collections || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadCatalogAndCollections();
  }, []);

  const collectionCards = collections
    ? Object.entries(collections).map(([key, collection]: [string, any]) => {
        const itemsLink = collection.links.find((link: any) => link.rel === 'items');
        const href = `/map?collectionID=${encodeURIComponent(collection ? collection.id : null)}`;

        const handleNavigate = () => {
          navigate(`/map?collectionID=${collection.id}`);
        };

        if (href) {
          return (
            <div 
              onClick={handleNavigate} 
              className="card" 
              key={collection.id}
            >
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
            </div>
          );
        }

        return null;
      })
    : null;

  return (
    <div className="home-container">
      <div className="summary-container">
        <div>
          <img src="https://raw.githubusercontent.com/MichaelDykesBC/michaeldykesbc.github.io/refs/heads/master/docs/assets/lidar_image.png"></img>
        </div>
        <div className="info-section">
          <h1>GeoBC SpatioTemporal Asset Catalog (STAC) Demo</h1>
          <p>This application is a proof of concept developed by GeoBC staff to explore the use of open-source tools for managing and visualizing a SpatioTemporal Asset Catalog (STAC). It demonstrates how STAC data can be efficiently cataloged, searched, and displayed using modern web mapping technologies.</p>
          <p>The goal is to assess the potential of STAC in supporting geospatial data management within the BC Government, with a focus on scalability, accessibility, and interoperability.</p>
          <div className="button-container">
            <a className="link-button" href="https://stacspec.org/" target="_blank">Learn more about STAC</a>
            <a id="pantry-link" href="https://github.com/bcgov/bc_stac_frontend" target="_blank">
            <svg height="18" aria-hidden="true" viewBox="0 0 24 24" version="1.1" data-view-component="true">
                <path fill="#fff" d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"></path>
            </svg>
            bcgov/bc_stac_frontend
            </a>
            <a id="pantry-link" href="https://github.com/bcgov/bc-stac" target="_blank">
            <svg height="18" aria-hidden="true" viewBox="0 0 24 24" version="1.1" data-view-component="true">
                <path fill="#fff" d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"></path>
            </svg>
            bcgov/bc-stac
            </a>
          </div>
        </div>
      </div>
      <div className="card-row">
        <div className="card-row-header">
          <div>
            <h2>Available Collections</h2>
            <p>Click a card below to view the STAC Collection:</p>
          </div>
          <CopyUrlComponent url={stac_url} title="Catalog URL:" />
        </div>
        <div className="card-container">
          {collectionCards}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;