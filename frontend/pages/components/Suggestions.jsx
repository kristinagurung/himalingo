import React, { useState } from 'react';
import { MdTranslate } from "react-icons/md";
import { FaComments } from "react-icons/fa";

function Suggestions({ onSelect, setMode, currentMode, isChatting, onLanguageChange }) {
  const [selectedLang, setSelectedLang] = useState("Nepali");

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
    if (onLanguageChange) onLanguageChange(newLang); // Tell Home.js immediately
  };

  const suggestions = [
    {
      title: "Translate",
      desc: `English to ${selectedLang}`,
      icon: <MdTranslate />,
      mode: "translate",
      getPrompt: () => `Translate 'Hello, how are you?' to ${selectedLang}`
    },
    {
      title: "Chat",
      desc: "Ask anything",
      icon: <FaComments />,
      mode: "chat",
      prompt: "Hello!"
    }
  ];

  if (isChatting) return null;

  return (
    <div className="suggestions-grid">
      {suggestions.map((item, index) => (
        <div 
          key={index} 
          className={`suggestion-card ${currentMode === item.mode ? 'active' : ''}`}
          onClick={() => {
            setMode(item.mode);
            const promptText = typeof item.getPrompt === 'function' ? item.getPrompt() : item.prompt;
            const languageValue = item.mode === "translate" ? selectedLang : null;
            onSelect(promptText, null, languageValue); 
          }}
        >
          <div className="s-icon">{item.icon}</div>
          <div className="s-content">
            <div className="s-title">
              {item.title === "Translate" ? (
                <div className="lang-header" onClick={(e) => e.stopPropagation()}>
                  <span>Translate to </span>
                  <select className="lang-select" value={selectedLang} onChange={handleLangChange}>
                    <option value="Nepali">Nepali</option>
                    <option value="Bhutia">Bhutia</option>
                    <option value="Lepcha">Lepcha</option>
                    <option value="Limbu">Limbu</option>
                    <option value="Magar">Magar</option>
                    <option value="Rai">Rai</option>
                  </select>
                </div>
              ) : <span>{item.title}</span>}
            </div>
            <p className="s-desc">{item.desc}</p>
          </div>
        </div>
      ))}
      <style jsx>{`
        .suggestions-grid { display: flex; justify-content: center; gap: 12px; margin-top: 20px; width: 100%; }
        .suggestion-card { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(8px); padding: 12px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; min-width: 220px; border: 1px solid transparent; transition: 0.2s; }
        .suggestion-card:hover { transform: translateY(-2px); background: #fff; }
        .suggestion-card.active { border-color: #667eea; background: #fff; }
        .lang-select { background: #667eea; color: white; border: none; border-radius: 4px; padding: 2px 4px; font-size: 12px; cursor: pointer; }
        .s-icon { font-size: 20px; color: #667eea; }
        .s-title { font-weight: bold; font-size: 14px; }
        .s-desc { font-size: 11px; color: #6b7280; margin: 0; }
      `}</style>
    </div>
  );
}

export default Suggestions;