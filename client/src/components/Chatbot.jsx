import chatbotLogo from "../assets/chatbot-logo.png";

const Chatbot = () => {
  return (
    <section className="ag-chatbot">
      <img src={chatbotLogo} alt="AI Farming Assistant" />
      <div>
        <h3>AI Farming Assistant</h3>
        <p>
          Ask about crops, fertilizer, irrigation, pest prevention, soil care,
          and weather guidance.
        </p>
        <div className="ag-suggestion-row">
          <span>Best crops for summer</span>
          <span>Fertilizer for paddy</span>
          <span>Irrigation tips</span>
        </div>
      </div>
    </section>
  );
};

export default Chatbot;
