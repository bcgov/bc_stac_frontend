import React, { useState } from "react";
import "./CopyUrlComponent.scss";

interface CopyUrlComponentProps {
  url: string;
  title: string;
}

const CopyUrlComponent: React.FC<CopyUrlComponentProps> = ({ title, url }) => {
  const [copied, setCopied] = useState(false);
  const titlestr = title || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="copy-url-container">
      <label htmlFor="url-input">{titlestr}</label>
      <input type="text" value={url} readOnly className="url-input" />
      <button onClick={handleCopy} className={`copy-btn ${copied ? "copied" : ""}`}>
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};

export default CopyUrlComponent;
