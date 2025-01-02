// pages/index.tsx
import React from "react";
import { ABTestDashboard } from "@/components/ABTestDashboard";

export default function HomePage() {
  return (
    <div style={{ height: "100vh" }}>
      <h1>Home Page</h1>
      <ABTestDashboard />
    </div>
  );
}
