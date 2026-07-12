import React from "react";
import MainLayout from "../layouts/MainLayout";
import { CopilotProvider } from "../context/CopilotContext";
import HistorySidebar from "../components/Copilot/HistorySidebar";
import ChatWindow from "../components/Copilot/ChatWindow";
import "../components/Copilot/Copilot.css";

const CopilotPage: React.FC = () => {
  return (
    <CopilotProvider>
      <MainLayout
        eyebrow="IntelliFarm Copilot v2"
        title="Copilot Assistant"
        subtitle="Real-time agronomist advice, local weather windows, crop disease identification, and market mandi values."
      >
        <div
          className="copilot-layout"
          style={{
            height: "calc(100vh - 220px)",
            minHeight: "550px",
            borderRadius: "16px",
            border: "1px solid var(--copilot-border)",
            boxShadow: "var(--copilot-shadow)"
          }}
        >
          <HistorySidebar />
          <ChatWindow />
        </div>
      </MainLayout>
    </CopilotProvider>
  );
};

export default CopilotPage;
