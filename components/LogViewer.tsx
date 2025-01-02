// src/components/LogViewer.tsx
import React from "react";

interface LogViewerProps {
  logs: string[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "8px",
        height: "150px",
        overflowY: "auto",
        background: "#f9f9f9",
      }}
    >
      {logs.map((line, idx) => (
        <div key={idx} style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
          {line}
        </div>
      ))}
    </div>
  );
};
