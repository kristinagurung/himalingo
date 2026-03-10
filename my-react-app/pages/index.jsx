"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown"; 
import Head from "next/head"; 
import Sidebar from "./components/Sidebar";
import SearchBox from "./components/SearchBox";
import Suggestions from "./components/Suggestions";
import LoginPopup from "./components/LoginPopup";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [history, setHistory] = useState([]);
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const [mode, setMode] = useState("translate"); 
  const [targetLanguage, setTargetLanguage] = useState("Nepali");
  
  const [showStatus, setShowStatus] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  const scrollRef = useRef(null);
``
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    if (token && email) {
      setLoggedIn(true);
      setUserEmail(email);
      fetchHistory(email);
    }
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 2000);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchHistory = async (emailToFetch) => {
    const email = emailToFetch || userEmail;
    if (!email) return;
    try {
      const response = await fetch(`http://localhost:3002/history?email=${email}&t=${Date.now()}`);
      const data = await response.json();
      if (data.success) setHistory(data.history);
    } catch (err) { console.error("History fetch failed", err); }
  };

  const saveChatToHistory = async (currentMessages, chatIdToUse) => {
    if (!loggedIn || !userEmail || currentMessages.length === 0) return;
    
    try {
      const id = chatIdToUse || currentChatId;
      const firstUserMsg = currentMessages.find(m => m.role === "user")?.content || "New Chat";
      const title = firstUserMsg.length > 35 ? firstUserMsg.substring(0, 35) + "..." : firstUserMsg;
      
      await fetch("http://localhost:3002/history/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chatId: id, 
          email: userEmail, 
          firstQuery: title, 
          finalResult: JSON.stringify(currentMessages), 
          mode 
        }),
      });
      fetchHistory(userEmail);
    } catch (err) { console.error("Save failed", err); }
  };

  const handleDeleteChat = async (e, chatId) => {
    if (!loggedIn || !userEmail) return;
    if (!window.confirm("Delete this conversation?")) return;
    
    try {
      const response = await fetch(`http://localhost:3002/history/session/${chatId}?email=${userEmail}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        if (currentChatId === chatId) {
          handleNewChat();
        }
        fetchHistory(userEmail);
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const handleClearHistory = async () => {
    if (!loggedIn || !userEmail) return;
    if (!window.confirm("Are you sure you want to clear all history?")) return;
    try {
      await fetch(`http://localhost:3002/history?email=${userEmail}`, { method: "DELETE" });
      setHistory([]);
      handleNewChat();
    } catch (err) { console.error("Failed to clear history", err); }
  };

  const handleNewChat = () => {
    setIsChatting(false);
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleSearchSubmit = async (textFromInput, imageFile, selectedLangFromSuggestion) => {
    if (!textFromInput && !imageFile) return;
    if (!loggedIn) { setLoginOpen(true); return; }
    
    // UPDATE: If a language is passed, we MUST be in translate mode
    let activeMode = mode;
    if (selectedLangFromSuggestion) {
      setTargetLanguage(selectedLangFromSuggestion);
      setMode("translate"); // Force translate mode for RAG
      activeMode = "translate";
    }

    setIsChatting(true);
    const chatId = currentChatId || `chat_${Date.now()}`;
    if (!currentChatId) setCurrentChatId(chatId);

    const imagePreview = imageFile ? URL.createObjectURL(imageFile) : null;
    const userMsg = { role: "user", content: textFromInput || "", imagePreview };
    const botPlaceholder = { role: "ai", content: "Thinking...", typing: true };
    
    const updatedMessagesWithUser = [...messages, userMsg];
    setMessages([...updatedMessagesWithUser, botPlaceholder]);

    saveChatToHistory(updatedMessagesWithUser, chatId);
    
    try {
      const formData = new FormData();
      // Keep prompt clean for translation accuracy
      formData.append("text", textFromInput || "");
      
      const finalLang = selectedLangFromSuggestion || targetLanguage;
      formData.append("targetLanguage", finalLang);
      
      formData.append("history", JSON.stringify(messages));
      if (imageFile) formData.append("image", imageFile);
      
      // Use the activeMode determined above
      const endpoint = activeMode === "chat" ? "/chat" : "/translate";
      const response = await fetch(`http://localhost:3002${endpoint}`, { 
        method: "POST", 
        body: formData 
      });
      
      const data = await response.json();
      const aiResponse = activeMode === "chat" ? data.response : data.translated;
      
      setMessages(prev => {
        const finalMessages = [...prev];
        finalMessages[finalMessages.length - 1] = { 
          role: "ai",
          content: aiResponse || "I couldn't generate a response.", 
          typing: false 
        };
        saveChatToHistory(finalMessages, chatId);
        return finalMessages;
      });
    } catch (err) {
      console.error("Submission error:", err);
      setMessages(prev => {
        const errorMsgs = [...prev];
        errorMsgs[errorMsgs.length - 1] = { role: "ai", content: "Error: Connection failed.", typing: false };
        return errorMsgs;
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="container">
      <Head>
        <title>Himalingo</title>
        <link rel="icon" href="data:," />
      </Head>

      <Sidebar 
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        loggedIn={loggedIn}
        userEmail={userEmail}
        onNewChat={handleNewChat} 
        history={history} 
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteChat}
        setLoginOpen={setLoginOpen}
        onSelectItem={(item) => { 
          setIsChatting(true); 
          setCurrentChatId(item.chatId);
          try {
            const raw = item.translatedText.trim();
            const parsed = (raw.startsWith("[") || raw.startsWith("{")) ? JSON.parse(raw) : [{role:"user", content: item.originalText}, {role:"ai", content: item.translatedText}];
            setMessages(parsed);
          } catch (e) { setMessages([{role:"user", content: item.originalText}, {role:"ai", content: item.translatedText}]); }
        }}
      />

      <main className="main">
        <div className={isChatting ? "chat-viewport" : "landing-view"} ref={scrollRef}>
          {!isChatting ? (
            <div className="landing-content">
              <h1 className="logo">Himalingo</h1>
              {showStatus && <div className="status-bar">Welcome Back!</div>}
              <div className="landing-input-wrapper">
                <SearchBox isLoggedIn={loggedIn} onSubmit={handleSearchSubmit} mode={mode} onFocus={() => setLoginOpen(true)} />
                <Suggestions onSelect={handleSearchSubmit} setMode={setMode} currentMode={mode} isChatting={false} />
              </div>
            </div>
          ) : (
            <div className="chat-content">
              {messages.map((msg, index) => (
                <div key={index} className={`msg-row ${msg.role === 'user' ? 'u-row' : 'a-row'}`}>
                  {msg.role === "ai" && <div className="ai-av">✨</div>}
                  <div className={msg.role === "user" ? "u-bubble" : "a-bubble"}>
                    {msg.imagePreview && <img src={msg.imagePreview} alt="upload" className="msg-img" />}
                    {msg.typing ? <div className="dots"><span></span><span></span><span></span></div> : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isChatting && (
          <div className="input-area-fixed">
            <div className="search-wrapper">
              <SearchBox isLoggedIn={loggedIn} onSubmit={handleSearchSubmit} mode={mode} onFocus={() => setLoginOpen(true)} />
              <p className="disclaimer">Himalingo may provide inaccurate info.</p>
            </div>
          </div>
        )}

        {loginOpen && <LoginPopup onLoginSuccess={() => { setLoggedIn(true); setLoginOpen(false); fetchHistory(); }} onClose={() => setLoginOpen(false)} />}
      </main>

      <style jsx>{`
        .container { display: flex; height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .main { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          margin-left: ${sidebarOpen ? '260px' : '72px'}; 
          transition: 0.3s ease; 
          position: relative;
        }
        .landing-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; }
        .chat-viewport { flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding-top: 20px; }
        .landing-content { display: flex; flex-direction: column; align-items: center; width: 100%; }
        .landing-input-wrapper { width: 100%; max-width: 700px; padding: 0 20px; }
        .chat-content { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 24px; padding: 40px 20px 180px 20px; }
        .msg-row { display: flex; gap: 12px; width: 100%; }
        .u-row { justify-content: flex-end; }
        .a-row { justify-content: flex-start; }
        .u-bubble { 
          background: #667eea; color: white; padding: 14px 20px; border-radius: 22px 6px 22px 22px; 
          max-width: 75%; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); 
        }
        .a-bubble { 
          background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); 
          padding: 16px 20px; border-radius: 6px 22px 22px 22px; 
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); 
          color: #1f2937;
        }
        .input-area-fixed { position: absolute; bottom: 0; width: 100%; background: linear-gradient(transparent, #f5f7fa 50%); padding: 20px; display: flex; justify-content: center; }
        .search-wrapper { width: 100%; max-width: 720px; }
        .logo { font-size: 3.5rem; font-weight: 900; color: #1f2937; margin-bottom: 30px; }
        .status-bar { padding: 6px 15px; background: rgba(255,255,255,0.6); border-radius: 20px; font-size: 13px; margin-bottom: 20px; }
        .disclaimer { font-size: 11px; color: #6b7280; text-align: center; margin-top: 10px; }
        .msg-img { max-width: 100%; border-radius: 10px; margin-bottom: 8px; }
        .dots span { width: 6px; height: 6px; background: #6b7280; border-radius: 50%; display: inline-block; animation: bounce 1.4s infinite; margin-right: 3px; }
        .ai-av { width: 32px; height: 32px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
}