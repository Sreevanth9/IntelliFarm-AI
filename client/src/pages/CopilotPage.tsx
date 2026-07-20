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
      <MainLayout eyebrow="AI Agronomist" title="Spryzen AI" subtitle="Ask questions, diagnose crop issues, and receive live farm intelligence">
        <div className="copilot-layout">
          <HistorySidebar />
          <ChatWindow />
        </div>
      </MainLayout>
    </CopilotProvider>
  );
};

export default CopilotPage;
