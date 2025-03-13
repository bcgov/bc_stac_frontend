import './style.scss';

import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PageHeader, PageFooter } from "./components/BCGovComponents";
import LandingPage from "./pages/LandingPage";
import MapPage from "./pages/MapPage";

const appElement = document.getElementById("app"); 

if (appElement) {
  ReactDOM.createRoot(appElement).render(
    <Router>
      <PageHeader />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
      <PageFooter />
    </Router>
  );
}
