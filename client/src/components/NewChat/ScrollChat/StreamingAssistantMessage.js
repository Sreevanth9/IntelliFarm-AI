import DOMPurify from "dompurify";
import { useState, useEffect } from "react";
import "./ScrollChatModule.css";

const StreamingAssistantMessage = (props) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < props?.content?.length) {
        // Advance to the next space
        let nextSpace = props.content.indexOf(" ", index + 1);
        if (nextSpace === -1) {
          nextSpace = props.content.length;
        }

        // Tag-safe adjustment: if slice ends inside an HTML tag, advance to the end of the tag
        let slice = props.content.substring(0, nextSpace);
        let openCount = (slice.match(/</g) || []).length;
        let closeCount = (slice.match(/>/g) || []).length;

        if (openCount > closeCount) {
          let closeIndex = props.content.indexOf(">", nextSpace);
          if (closeIndex !== -1) {
            nextSpace = closeIndex + 1;
          }
        }

        index = nextSpace;
        setCurrentIndex(index);
      } else {
        clearInterval(interval);
      }
    }, 45); // 45ms per word chunk

    return () => clearInterval(interval);
  }, [props?.content]);

  return (
    <div className="stream-container">
      <p
        className="assistant-response"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(props?.content?.slice(0, currentIndex)),
        }}
      ></p>
    </div>
  );
};

export default StreamingAssistantMessage;
