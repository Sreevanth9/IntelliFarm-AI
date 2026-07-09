import styles from "./InputSection.module.css";
import { sendChatData } from "../../store/chat-action";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  SendHorizontal,
  X,
  Plus,
  Mic,
  MicOff,
  Paperclip,
  Camera,
  Image,
  FileText,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { chatAction } from "../../store/chat";

const InputSection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [userInput, setUserInput] = useState("");
  const previousChat = useSelector((state) => state.chat.previousChat);
  const chatHistoryId = useSelector((state) => state.chat.chatHistoryId);
  const suggestPrompt = useSelector((state) => state.chat.suggestPrompt);

  // Redesign states
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef(null);
  const uploadMenuRef = useRef(null);

  // Close upload menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target)) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInputHandler = (e) => {
    setUserInput(e.target.value);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowUploadMenu(false);
  };

  const fileChangeHandler = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      setUploadedFile({
        name: file.name,
        type: file.type,
        base64: base64Data.split(",")[1], // extract just the base64 string
        preview: base64Data, // keep full data URL for preview rendering
      });

      // Automatically prepopulate search term based on upload type
      if (file.type.startsWith("image/")) {
        setUserInput("Diagnose this crop disease");
        toast.success("Crop image uploaded successfully!");
      } else {
        setUserInput("Analyze this soil report PDF");
        toast.success("Soil report uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFileHandler = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Voice Speech Recognition
  const startSpeechHandler = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulation
      setIsListening(true);
      toast.loading("Simulating voice recognition...", { id: "voice" });
      setTimeout(() => {
        setIsListening(false);
        setUserInput("How to prepare organic pesticide for paddy fields?");
        toast.dismiss("voice");
        toast.success("Simulated voice search input added!");
      }, 2000);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      toast.loading("Listening to your voice...", { id: "voice" });
    };

    rec.onerror = (e) => {
      console.error(e);
      setIsListening(false);
      toast.dismiss("voice");
      toast.error("Voice input error. Please try again.");
    };

    rec.onend = () => {
      setIsListening(false);
      toast.dismiss("voice");
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setUserInput(transcript);
      toast.success("Voice capture successful!");
    };

    rec.start();
  };

  const sendPrompt = (promptText) => {
    const trimmedInput = promptText.trim();
    if (!trimmedInput) return;

    const savedMemory = localStorage.getItem("farmMemory");
    const farmMemory = savedMemory ? JSON.parse(savedMemory) : null;

    dispatch(
      sendChatData({
        user: trimmedInput,
        gemini: "",
        isLoader: "yes",
        previousChat,
        chatHistoryId,
        image: uploadedFile && uploadedFile.type.startsWith("image/") ? uploadedFile.preview : null,
        farmMemory: farmMemory,
      })
    );
    setUserInput("");
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    navigate("/assistant/app");
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    sendPrompt(userInput);
  };

  useEffect(() => {
    const promptText = suggestPrompt.trim();
    if (promptText.length > 0) {
      dispatch(chatAction.suggestPromptHandler({ prompt: "" }));
      sendPrompt(promptText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestPrompt]);

  return (
    <div className={styles["input-main"]}>
      {/* Upload Preview Chip */}
      {uploadedFile && (
        <div className={styles["upload-preview-container"]}>
          <div className={styles["upload-preview-chip"]}>
            {uploadedFile.type.startsWith("image/") ? (
              <img
                src={uploadedFile.preview}
                alt="Upload Preview"
                className={styles["preview-thumbnail"]}
              />
            ) : (
              <FileText className={styles["preview-pdf-icon"]} size={18} />
            )}
            <div className={styles["upload-preview-details"]}>
              <span className={styles["preview-filename"]}>{uploadedFile.name}</span>
              <span className={styles["preview-status"]}>
                <Check size={12} /> Uploaded Successfully
              </span>
            </div>
            <button
              type="button"
              className={styles["remove-preview-btn"]}
              onClick={removeFileHandler}
              title="Remove File"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={onSubmitHandler}>
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={fileChangeHandler}
          accept="image/*,application/pdf"
        />

        {/* Left "+" Menu Toggle */}
        <div className={styles["left-menu-container"]} ref={uploadMenuRef}>
          <button
            type="button"
            className={`${styles["menu-toggle-btn"]} ${showUploadMenu ? styles["menu-active"] : ""}`}
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            title="Upload Files"
          >
            <Plus size={18} />
          </button>

          {showUploadMenu && (
            <div className={styles["upload-dropdown-menu"]}>
              <button
                type="button"
                onClick={triggerFileSelect}
                className={styles["menu-item"]}
              >
                <Image size={14} /> Upload Image
              </button>
              <button
                type="button"
                onClick={triggerFileSelect}
                className={styles["menu-item"]}
              >
                <Camera size={14} /> Camera Capture
              </button>
              <button
                type="button"
                onClick={triggerFileSelect}
                className={styles["menu-item"]}
              >
                <FileText size={14} /> Soil Report PDF
              </button>
            </div>
          )}
        </div>

        {/* Main Inputs */}
        <input
          onChange={userInputHandler}
          autoComplete="off"
          type="text"
          placeholder="Ask farming questions, crop advice, weather guidance..."
          name="prompt"
          value={userInput}
          className={styles["text-input"]}
        />

        {/* Right Action Icons Group */}
        <div className={styles["right-actions-group"]}>
          {userInput && (
            <button
              className={styles["clear-button"]}
              type="button"
              aria-label="Clear message"
              onClick={() => setUserInput("")}
            >
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            className={`${styles["action-btn"]} ${isListening ? styles["pulse-mic"] : ""}`}
            onClick={startSpeechHandler}
            title="Voice input"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <button
            type="button"
            className={styles["action-btn"]}
            onClick={triggerFileSelect}
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>

          <button
            type="button"
            className={styles["action-btn"]}
            onClick={triggerFileSelect}
            title="Take a crop photo"
          >
            <Camera size={16} />
          </button>

          <button type="submit" className={styles["submit-btn"]}>
            <SendHorizontal size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputSection;
