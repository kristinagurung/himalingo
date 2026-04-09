"use client";

import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setTargetLanguage,
  setMode,
  addMessage,
  updateLastMessage,
  setMessages,
  setIsChatting,
  setCurrentChatId,
  loginUser,
  resetChat,
} from "../appSlice";
import ReactMarkdown from "react-markdown";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import SearchBox from "../components/SearchBox";
import Suggestions from "../components/Suggestions";
import LoginPopup from "../components/LoginPopup";
import { FaCopy, FaVolumeUp, FaCheck } from "react-icons/fa";
import { useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const dispatch  = useDispatch();

  // ── Read everything from Redux store ──────────────────────────────────────
  const targetLanguage  = useSelector(s => s.app.targetLanguage);
  const mode            = useSelector(s => s.app.mode);
  const messages        = useSelector(s => s.app.messages);
  const isChatting      = useSelector(s => s.app.isChatting);
  const currentChatId   = useSelector(s => s.app.currentChatId);
  const loggedIn        = useSelector(s => s.app.loggedIn);
  const userEmail       = useSelector(s => s.app.userEmail);

  // ── Local UI state (not needed in Redux) ──────────────────────────────────
  const [mounted, setMounted]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loginOpen, setLoginOpen]   = useState(false);
  const [history, setHistory]       = useState([]);
  const [copiedText, setCopiedText] = useState(null);

  const scrollRef = useRef(null);

  // ── On mount: check localStorage for saved login ──────────────────────────
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    if (token && email) {
      dispatch(loginUser({ email }));
      fetchHistory(email);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ── History ───────────────────────────────────────────────────────────────
  const fetchHistory = async (emailToFetch) => {
    const email = emailToFetch || userEmail;
    if (!email || !apiUrl) return;
    try {
      const response = await fetch(`${apiUrl}/history?email=${email}&t=${Date.now()}`);
      const data = await response.json();
      if (data.success) setHistory(data.history);
    } catch (err) { console.error("History fetch failed", err); }
  };

  const saveChatToHistory = async (currentMessages, chatIdToUse) => {
    if (!loggedIn || !userEmail || currentMessages.length === 0 || !apiUrl) return;
    try {
      const id = chatIdToUse || currentChatId;
      const firstUserMsg = currentMessages.find(m => m.role === "user")?.content || "New Chat";
      const title = firstUserMsg.length > 35 ? firstUserMsg.substring(0, 35) + "..." : firstUserMsg;
      await fetch(`${apiUrl}/history/save-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: id, email: userEmail, firstQuery: title,
          finalResult: JSON.stringify(currentMessages), mode,
        }),
      });
      fetchHistory(userEmail);
    } catch (err) { console.error("Save failed", err); }
  };

  const handleDeleteItem = async (e, chatId) => {
    if (!loggedIn || !userEmail || !apiUrl) return;
    try {
      const res = await fetch(`${apiUrl}/history/session/${chatId}?email=${userEmail}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (currentChatId === chatId) handleNewChat();
        fetchHistory(userEmail);
      }
    } catch (err) { console.error("Delete failed", err); }
  };

  const handleTogglePin = async (e, chatId) => {
    if (!loggedIn || !userEmail || !apiUrl) return;
    try {
      const res = await fetch(`${apiUrl}/history/session/${chatId}/pin?email=${userEmail}`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) fetchHistory(userEmail);
    } catch (err) { console.error("Pin failed", err); }
  };

  const handleClearHistory = async () => {
    if (!loggedIn || !userEmail || !apiUrl) return;
    if (!window.confirm("Clear all history?")) return;
    try {
      await fetch(`${apiUrl}/history?email=${userEmail}`, { method: "DELETE" });
      setHistory([]);
      dispatch(resetChat());
    } catch (err) { console.error("Clear failed", err); }
  };

  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes("hi") || v.lang.includes("ne"));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  const handleNewChat = () => {
    dispatch(resetChat());
  };



  // ── MAIN SUBMIT ───────────────────────────────────────────────────────────
  const handleSearchSubmit = async (textFromInput, imageFile, selectedLangFromSuggestion) => {
    if (!textFromInput && !imageFile) return;
    if (!loggedIn) { setLoginOpen(true); return; }

    // Language — Redux store is always up to date, no stale state problem
    const resolvedLang = "Bhutia";

    // If suggestion click brought a new language, update store
    if (selectedLangFromSuggestion) {
      dispatch(setTargetLanguage(selectedLangFromSuggestion));
    }

    // Mode
    let resolvedMode = mode;
    if (selectedLangFromSuggestion) {
      const isTranslate = textFromInput?.toLowerCase().includes("translate") || mode === "translate";
      resolvedMode = isTranslate ? "translate" : "chat";
      dispatch(setMode(resolvedMode));
    }

    console.log(`[Submit] mode=${resolvedMode} lang=${resolvedLang} text="${textFromInput}"`);

    dispatch(setIsChatting(true));
    const chatId = currentChatId || `chat_${Date.now()}`;
    if (!currentChatId) dispatch(setCurrentChatId(chatId));

    let imagePreview = null;
    if (imageFile instanceof File) {
      try { imagePreview = URL.createObjectURL(imageFile); } catch { imagePreview = null; }
    }

    // Add user message + placeholder to Redux
    dispatch(addMessage({ role: "user", content: textFromInput || "", imagePreview }));
    dispatch(addMessage({ role: "ai", content: "Thinking...", typing: true }));

    try {
      const formData = new FormData();
      formData.append("text", textFromInput || "");
    formData.append("targetLanguage", "Bhutia");
      formData.append("history", JSON.stringify(messages.filter(m => !m.typing)));
      if (imageFile instanceof File) formData.append("image", imageFile);

      const endpoint = resolvedMode === "chat" ? "/chat" : "/translate";
      const response = await fetch(`${apiUrl}${endpoint}`, { method: "POST", body: formData });
      const data     = await response.json();
      const aiResponse = resolvedMode === "chat" ? data.response : data.translated;

      // Replace placeholder with real response
      dispatch(updateLastMessage({ role: "ai", content: aiResponse || "Sorry, no response.", typing: false }));

      // Save to history
      const updatedMessages = [
        ...messages.filter(m => !m.typing),
        { role: "user", content: textFromInput || "" },
        { role: "ai",   content: aiResponse || "" },
      ];
      saveChatToHistory(updatedMessages, chatId);

    } catch (err) {
      console.error("[Submit] error:", err.message);
      dispatch(updateLastMessage({ role: "ai", content: "Connection error. Please try again.", typing: false }));
    }
  };

  if (!mounted) return null;

  return (
    <div className="container">
      <Head><title>Himalingo</title></Head>

      <Sidebar
        isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        loggedIn={loggedIn} userEmail={userEmail} onNewChat={handleNewChat}
        history={history} onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteItem} onTogglePin={handleTogglePin}
        setLoginOpen={setLoginOpen}
        onSelectItem={(item) => {
          dispatch(setIsChatting(true));
          dispatch(setCurrentChatId(item.chatId));
          dispatch(setMode(item.mode || "chat"));
          try {
            const raw = item.translatedText.trim();
            const parsed = (raw.startsWith("[") || raw.startsWith("{"))
              ? JSON.parse(raw)
              : [{ role: "user", content: item.originalText }, { role: "ai", content: item.translatedText }];
            dispatch(setMessages(parsed));
          } catch {
            dispatch(setMessages([{ role: "user", content: item.originalText }, { role: "ai", content: item.translatedText }]));
          }
        }}
      />

      <main className="main">
        <div className={isChatting ? "chat-viewport" : "landing-view"} ref={scrollRef}>
          {!isChatting ? (
            <div className="landing-content">
              <h1 className="logo">Himalingo</h1>
              <div className="landing-input-wrapper">
                <SearchBox isLoggedIn={loggedIn} onSubmit={handleSearchSubmit} mode={mode} effectiveMode={mode} onFocus={() => setLoginOpen(true)} />
                <Suggestions
                  onSelect={handleSearchSubmit}
                  setMode={(m) => dispatch(setMode(m))}
                  currentMode={mode}
                  isChatting={false}
                />
              </div>
            </div>
          ) : (
            <div className="chat-content">
              {messages.map((msg, index) => (
                <div key={index} className={`msg-row ${msg.role === "user" ? "u-row" : "a-row"}`}>
                  {msg.role === "ai" && <div className="ai-av">✨</div>}
                  <div className={msg.role === "user" ? "u-bubble" : "a-bubble"}>
                    {msg.imagePreview && <img src={msg.imagePreview} alt="upload" className="msg-img" />}
                    {msg.typing
                      ? <div className="dots"><span></span><span></span><span></span></div>
                      : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                    {msg.role === "ai" && !msg.typing && (
                      <div className="action-buttons">
                        <button className="action-btn" onClick={() => speakText(msg.content)} title="Listen"><FaVolumeUp /></button>
                        <button className="action-btn" onClick={() => copyToClipboard(msg.content)} title="Copy">
                          {copiedText === msg.content ? <FaCheck style={{ color: "#10b981" }} /> : <FaCopy />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isChatting && (
          <div className="input-area-fixed">
            <div className="search-wrapper">
              <SearchBox isLoggedIn={loggedIn} onSubmit={handleSearchSubmit} mode={mode} effectiveMode={mode} onFocus={() => setLoginOpen(true)} />
              <p className="disclaimer">Himalingo may provide inaccurate info.</p>
            </div>
          </div>
        )}

        {loginOpen && (
          <LoginPopup
            onLoginSuccess={() => {
              dispatch(loginUser({ email: localStorage.getItem("userEmail") }));
              setLoginOpen(false);
              fetchHistory();
            }}
            onClose={() => setLoginOpen(false)}
          />
        )}
      </main>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Lepcha&family=Tibetan+Machine+Uni&family=Noto+Sans+Limbu&display=swap');
        .container { display: flex; height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .main { flex: 1; display: flex; flex-direction: column; margin-left: ${sidebarOpen ? "260px" : "72px"}; transition: 0.3s ease; position: relative; overflow: hidden; }
        .landing-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; }
        .chat-viewport { flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding-top: 20px; }
        .landing-content { display: flex; flex-direction: column; align-items: center; width: 100%; }
        .landing-input-wrapper { width: 100%; max-width: 700px; padding: 0 20px; }
        .chat-content { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 24px; padding: 40px 20px 180px 20px; }
        .msg-row { display: flex; gap: 12px; width: 100%; }
        .u-row { justify-content: flex-end; }
        .a-row { justify-content: flex-start; }
        .u-bubble { background: #667eea; color: white; padding: 14px 20px; border-radius: 22px 6px 22px 22px; max-width: 75%; font-size: 16px; box-shadow: 0 4px 15px rgba(102,126,234,0.3); }
        .a-bubble { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); padding: 16px 20px; border-radius: 6px 22px 22px 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); color: #1f2937; }
        .input-area-fixed { position: absolute; bottom: 0; width: 100%; background: linear-gradient(transparent, #f5f7fa 50%); padding: 20px; display: flex; justify-content: center; }
        .search-wrapper { width: 100%; max-width: 720px; }
        .logo { font-size: 3.5rem; font-weight: 900; color: #1f2937; margin-bottom: 30px; }
        .disclaimer { font-size: 11px; color: #6b7280; text-align: center; margin-top: 10px; }
        .msg-img { max-width: 100%; border-radius: 10px; margin-bottom: 8px; }
        .dots span { width: 6px; height: 6px; background: #6b7280; border-radius: 50%; display: inline-block; animation: bounce 1.4s infinite; margin-right: 3px; }
        .dots span:nth-child(2) { animation-delay: 0.2s; }
        .dots span:nth-child(3) { animation-delay: 0.4s; }
        .ai-av { width: 32px; height: 32px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); flex-shrink: 0; }
        .action-buttons { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.08); }
        .action-btn { background: rgba(102,126,234,0.1); border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 14px; color: #667eea; transition: all 0.2s; }
        .action-btn:hover { background: rgba(102,126,234,0.2); transform: translateY(-1px); }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
}