import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";

import { ChatControls } from "./ChatControls";
import { LogViewer } from "./LogViewer";

const ThreeDGraph = dynamic(() => import("./ThreeDGraph"), {
  ssr: false,
});

interface Node3D {
  id: string;
  x: number;
  y: number;
  z: number;
  label: string;
  color: string;
}

export const ABTestDashboard: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [graphNodes, setGraphNodes] = useState<Node3D[]>([]);
  const [graphEdges, setGraphEdges] = useState<{ from: string; to: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const nodeCounter = useRef<number>(0);

  // Add log lines
  const addLog = (line: string) => {
    setLogs((prev) => [...prev, line]);
  };

  // create a Node3D
  const addMessageNode = (content: string, color = "#555") => {
    const nodeId = `node-${nodeCounter.current++}`;
    const x = Math.random() * 4 - 2;
    const y = Math.random() * 4 - 2;
    const z = Math.random() * 4 - 2;
    setGraphNodes((prev) => [...prev, { id: nodeId, label: content, color, x, y, z }]);
    return nodeId;
  };

  // handle send
  const handleSendMessage = async (text: string) => {
    addLog(`User input: ${text}`);
    const userNodeId = addMessageNode(text, "#3a86ff");
    setIsRunning(true);

    try {
      const res = await fetch("/api/agent/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: text,
          threadId: "thread-123",
          isMentorEnabled: true,
        }),
      });
      if (!res.ok) throw new Error("AB test request failed.");

      const data = await res.json();
      const lastMsg = data.finalMessages[data.finalMessages.length - 1] || { text: "(no messages?)" };
      addLog(`System responded: ${lastMsg.text}`);

      // make a sphere for the system response
      const systemNodeId = addMessageNode(lastMsg.text, "#faa307");
      // connect them
      setGraphEdges((prev) => [...prev, { from: userNodeId, to: systemNodeId }]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        addLog(`Error: ${err.message}`);
      } else {
        addLog(`Error: ${String(err)}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // kill switch
  const handleKillSwitch = () => {
    addLog("Kill switch activated. Stopping orchestration...");
    setIsRunning(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
      <h2>A/B Test Dashboard</h2>

      <div style={{ border: "2px solid green", padding: "10px" }}>
        <ChatControls onSendMessage={handleSendMessage} onKillSwitch={handleKillSwitch} isRunning={isRunning} />
      </div>

      <div style={{ border: "2px solid blue", padding: "10px" }}>
        <LogViewer logs={logs} />
      </div>

      <div style={{ border: "2px solid red", padding: "10px" }}>
        <ThreeDGraph nodes={graphNodes} edges={graphEdges} />
      </div>
    </div>
  );
};
