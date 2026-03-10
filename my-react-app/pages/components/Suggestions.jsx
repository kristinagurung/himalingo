import React, { useState } from 'react';
import { MdTranslate } from "react-icons/md";
import { FaComments } from "react-icons/fa";

function Suggestions({ onSelect, setMode, currentMode, isChatting }) {
  // 1. Create a state to store the selected language
  const [selectedLang, setSelectedLang] = useState("Nepali");
  

  const suggestions = [
    {
      title: "Translate",
      desc: `Translate to ${selectedLang}`, // Dynamic description
      icon: <MdTranslate />,
      mode: "translate",
      prompt: `Translate 'Hello, how are you?' to ${selectedLang}`
    },
    {
      title: "Chat",
      desc: "Ask anything",
      icon: <FaComments />,
      mode: "chat",
      prompt: "Who is the king of Nepal?"
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
            // If the user clicks the card, we send the prompt with the current language
            onSelect(item.prompt, selectedLang); 
          }}
        >
          <div className="s-icon">{item.icon}</div>
          <div className="s-content">
            <div className="s-title">
              {item.title === "Translate" ? (
                <div className="lang-header" onClick={(e) => e.stopPropagation()}>
                  <span>Translate to</span>
                  {/* 2. ADD THE DROPDOWN HERE */}
                  <select 
                    className="lang-select"
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                  >
                    <option value="Nepali">Nepali</option>
                    <option value="bhutia">Bhutia</option>
                    <option value="Lepcha">Lepcha</option>
                  </select>
                </div>
              ) : (
                item.title
              )}
            </div>
            <p className="s-desc">{item.desc}</p>
          </div>
        </div>
      ))}

      <style jsx>{`
        .suggestions-grid {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 20px;
          width: 100%;
        }

        /* Dropdown Styling */
        .lang-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lang-select {
          background: #f1f3f7;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #4b5563;
          padding: 1px 4px;
          cursor: pointer;
          outline: none;
        }

        .suggestion-card.active .lang-select {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .suggestion-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          padding: 8px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1.5px solid transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 190px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .suggestion-card:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }

        .suggestion-card.active {
          background: #fff;
          border-color: #667eea;
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .suggestion-card.active .s-title {
          color: #667eea;
        }

        .suggestion-card.active .s-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .s-icon {
          font-size: 16px;
          background: #f1f3f7;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .s-title {
          font-size: 13px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          margin: 0;
          color: #374151;
        }

        .s-desc {
          font-size: 10px;
          color: #9ca3af;
          margin: 0;
        }

        @media (max-width: 480px) {
          .suggestions-grid {
            flex-direction: column;
            align-items: center;
          }
          .suggestion-card { width: 80%; }
        }
      `}</style>
    </div>
  );
}

export default Suggestions;