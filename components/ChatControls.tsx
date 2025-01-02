import React, { useState } from "react";

interface ChatControlsProps {
  onSendMessage: (text: string) => void;
  onKillSwitch: () => void;
  isRunning: boolean;
}

export const ChatControls: React.FC<ChatControlsProps> = ({
  onSendMessage,
  onKillSwitch,
  isRunning,
}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <div style={{ background: "#eee", padding: "1rem" }}>
      <p>ChatControls area</p>
      <input
        style={{ flex: 1, padding: "6px", marginRight: "8px" }}
        type="text"
        value={message}
        placeholder="Type your question or instructions..."
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSend} disabled={!message.trim()}>
        Send
      </button>
      <button onClick={onKillSwitch} style={{ marginLeft: 8, backgroundColor: "red", color: "#fff" }}>
        {isRunning ? "Kill Switch" : "Stopped"}
      </button>
    </div>
  );
};
