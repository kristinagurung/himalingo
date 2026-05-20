import React from 'react';
import { MdTranslate } from "react-icons/md";

const EXAMPLES = [
  "Hello",
  "How are you?",
  "Thank you",
  "Good morning",
  "What is your name?",
  "I am fine",
];

function Suggestions({ onSelect, setMode, isChatting }) {
  if (isChatting) return null;

  const handleChip = (text) => {
    setMode("translate");
    onSelect(` '${text}'` , null, "");
  };

  return (
    <div className="suggestions-wrap">

      {/* Language badge */}
      <p className="chips-label">Try these examples</p>

      {/* Example chips */}
      <div className="chips-grid">
        {EXAMPLES.map((ex) => (
          <button key={ex} className="chip" onClick={() => handleChip(ex)}>
            {ex}
          </button>
        ))}
      </div>

      <style jsx>{`
        .suggestions-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 20px;
          width: 100%;
        }

        .chips-label {
          font-size: 13px;
          color: #9ca3af;
          margin-bottom: 12px;
        }

        .chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 600px;
        }

        .chip {
          padding: 8px 20px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .chip:hover {
          border-color: #667eea;
          color: #667eea;
          background: #f5f3ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102,126,234,0.15);
        }

        .chip:active {
          transform: scale(0.97);
        }

        @media (max-width: 768px) {
          .chips-grid {
            padding: 0 12px;
          }
        }
      `}</style>
    </div>
  );
}

export default Suggestions;
