import React, { useState, useEffect } from 'react';
import { MdTranslate } from "react-icons/md";
import { FaComments } from "react-icons/fa";

function Suggestions({ onSelect, setMode, currentMode, isChatting, onLanguageChange }) {
  const selectedLang = "Bhutia བཻ་ཏི་ཨ་";
  
  

  const suggestions = [
    {
      title: "Translate to Bhutia",
      desc: `English to Bhutia བཻ་ཏི་ཨ་`,
      icon: <MdTranslate />,
      mode: "translate",
      getPrompt: () => `Translate 'Hello, how are you?' to Bhutia`,
      defaultActive: true
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
          className={`suggestion-card ${currentMode === item.mode || (item.defaultActive && !currentMode) ? 'active' : ''}`}
          onClick={() => {
            setMode(item.mode);
            if (item.mode === 'translate') {
              const promptText = item.getPrompt();
              onSelect(promptText, null, selectedLang);
            } else if (item.mode === 'chat') {
              onSelect("", null, null);
            }
          }}
        >
          <div className="s-icon">{item.icon}</div>
          <div className="s-content">
            <div className="s-title">
              {item.title}
            </div>
            <p className="s-desc">{item.desc}</p>
          </div>
        </div>
      ))}
      <style jsx>{`
        .suggestions-grid { 
          display: flex; 
          justify-content: center; 
          gap: 16px; 
          margin-top: 24px; 
          width: 100%; 
          flex-wrap: wrap;
        }
        
        .suggestion-card { 
          background: #fff; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
          padding: 10px; 
          border-radius: 20px; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          min-width: 250px; 
          flex: 1;
          max-width: 20px;
          border: 3px solid transparent; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .suggestion-card:nth-child(1) {
          order: -1;
        }
        
        .suggestion-card:hover { 
          transform: translateY(-6px) scale(1.02); 
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.25); 
          border-color: #667eea; 
        }
        
        .suggestion-card:active {
          transform: scale(0.98);
        }
        
        .suggestion-card.active { 
          border-color: #667eea; 
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.3); 
        }
        
        .s-icon {
          width: 40px;
          height: 42px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 15px;
          flex-shrink: 0;
        }
        
        .s-content {
          flex: 1;
        }
        
        .s-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .lang-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .lang-header span {
          white-space: nowrap;
        }
        
        .lang-select {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 6px 12px;
          font-size: 14px;
          color: #1f2937;
          cursor: pointer;
          min-width: 100px;
          transition: all 0.2s ease;
        }
        
        .lang-select:hover,
        .lang-select:focus {
          background: white;
          border-color: #667eea;
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .s-desc { 
          font-size: 13px; 
          color: #6b7280; 
          margin: 0; 
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .suggestions-grid {
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .suggestion-card { 
            width: 90%; 
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Suggestions;
