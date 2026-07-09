import DOMPurify from "dompurify";
import { useEffect } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import "./ScrollChatModule.css";

const StaticAssistantMessage = (props) => {
  useEffect(() => {
    hljs.highlightAll();
  }, [props.content]);

  return (
    <p
      className="assistant-response"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(props?.content),
      }}
    ></p>
  );
};

export default StaticAssistantMessage;
