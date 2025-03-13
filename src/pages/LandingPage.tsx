import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllSTACCollections } from "../utils/stacUtils";
import "./LandingPage.scss";

const LandingPage = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await fetchAllSTACCollections();
        setCollections(data.collections || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadCollections();
  }, []);

  // Iterate through collections and generate links
  const collectionCards = collections
    ? Object.entries(collections).map(([key, collection]: [string, any]) => {
        // Find the 'items' link
        const itemsLink = collection.links.find((link: any) => link.rel === 'items');
        // Use the href of the 'items' link if it exists, otherwise don't return anything
        const href = `/map?collectionID=${encodeURIComponent(collection ? collection.id : null)}`;

        const handleNavigate = () => {
          navigate(`/map?collectionID=${collection.id}`);
        };

        // Only return the card if href exists
        if (href) {
          return (
            <div 
              onClick={handleNavigate} 
              className="card" 
              key={collection.id}
            >
              <h3>{collection.title}</h3>
              <p>{collection.description}</p>
              <p>{collection.extent.temporal.interval[0][0]}</p>
              {/* Add more content from the collection if needed */}
            </div>
          );
        }

        // Return nothing if href is not found
        return null;
      })
    : null;

  return (
    <div className="home-container">
      <div className="info-section">
        <h1>STAC Browser</h1>
        <p>Welcome to the SpatioTemporal Asset Catalog (STAC) Browser. Click on a collection to view its items.</p>
        <p>Click on a collection to view its items.</p>
      </div>
      <div className="card-container">
        {collectionCards}
      </div>
    </div>
  );
};

export default LandingPage;