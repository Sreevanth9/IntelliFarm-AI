import React, { useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { CopilotProvider } from "../context/CopilotContext";
import HistorySidebar from "../components/Copilot/HistorySidebar";
import ChatWindow from "../components/Copilot/ChatWindow";
import "../components/Copilot/Copilot.css";

const CopilotPage: React.FC = () => {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Spryzen AI";
    return () => {
      document.title = originalTitle;
    };
  }, []);

  return (
    <CopilotProvider>
      <MainLayout eyebrow="" title="" subtitle="">
        <div
          className="copilot-layout"
          style={{
            height: "calc(100vh - 120px)",
            minHeight: "500px",
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
