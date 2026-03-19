import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/trinityChat.css";
import { askAI } from "../rag/askAI";

const QUESTIONS = [
  {
    id: 1,
    key: "vertical",
    question: "What industry or vertical is your business in?",
    type: "text"
  },
  {
    id: 2,
    key: "revenue",
    question: "What is your approximate yearly revenue?",
    type: "options",
    options: ["Under $100K", "$100K – $500K", "$500K – $1M", "$1M – $5M", "$5M+"]
  },
  {
    id: 3,
    key: "employees",
    question: "How many employees does your company have?",
    type: "options",
    options: ["1–10", "11–50", "51–200", "201–500", "500+"]
  },
  {
    id: 4,
    key: "challenge",
    question: "What challenge are you looking to solve with a consultant?",
    type: "text"
  },
  {
    id: 5,
    key: "package",
    question: "Which consulting package are you interested in?",
    type: "options",
    options: ["Starter – 1 session", "Growth – 3 sessions", "Pro – 6 sessions", "Enterprise – Custom"]
  },
  {
    id: 6,
    key: "book",
    question: "Are you ready to book your call with Trinity Agents?",
    type: "options",
    options: ["Yes, book my call now", "I have more questions"]
  }
];

const BOT_AVATAR = "🤖";
const USER_AVATAR = "👤";
const BOOKING_URL = "https://trinityagents.ai/en/booking";

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Message Types ─────────────────────────────────────────────────
// type: 'text' | 'question-options' | 'cta'

export default function TrinityChat() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      type: "text",
      text: "👋 Hi there! I'm **Trinity**, your AI business assistant.\n\nLet's get started with a few quick questions.",
      time: formatTime(),
    }
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState("questionnaire"); // 'questionnaire' | 'chat'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const hasStarted = useRef(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Initial load: show first question after brief delay
  useEffect(() => {
    if (messages.length === 1 && phase === "questionnaire" && !hasStarted.current) {
      hasStarted.current = true;
      askCurrentQuestion(0);
    }
  }, []);

  const addBotMessage = (msg) => {
    setMessages((m) => [...m, { role: "bot", time: formatTime(), ...msg }]);
  };

  const addUserMessage = (text) => {
    setMessages((m) => [...m, { role: "user", type: "text", text, time: formatTime() }]);
  };

  const askCurrentQuestion = async (index) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, 600));
    setTyping(false);
    
    const q = QUESTIONS[index];
    addBotMessage({
      type: "text",
      text: q.question
    });
    
    if (q.type === "options") {
      addBotMessage({
        type: "question-options",
        questionIndex: index,
        options: q.options
      });
    }
  };

  const handleAnswer = async (answerText) => {
    addUserMessage(answerText);
    const q = QUESTIONS[currentQuestionIndex];
    
    const newAnswers = { ...answers, [q.key]: answerText };
    setAnswers(newAnswers);
    
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);

    if (nextIndex < QUESTIONS.length) {
      await askCurrentQuestion(nextIndex);
    } else {
      // Questionnaire complete!
      completeQuestionnaire(answerText, newAnswers);
    }
  };

  const completeQuestionnaire = async (finalAnswer, allAnswers) => {
    setTyping(true);

    if (finalAnswer.includes("Yes")) {
      const summary = `I have completed the questionnaire and I'm ready to book.
My details:
Industry: ${allAnswers.vertical}
Revenue: ${allAnswers.revenue}
Employees: ${allAnswers.employees}
Challenge: ${allAnswers.challenge}
Package: ${allAnswers.package}

Please recommend the best consultant for me from the Available Experts list, including their Name, Description, and Price.`;
      
      const replyData = await askAI(summary);
      setTyping(false);
      
      if (replyData.recommendation && replyData.experts && replyData.experts.length > 0) {
        addBotMessage({ 
          type: "expert-recommendation", 
          text: replyData.text,
          experts: replyData.experts
        });
      } else {
        addBotMessage({ type: "text", text: replyData.text });
      }
    } else {
      setTyping(false);
      addBotMessage({
        type: "text",
        text: "No problem! What else would you like to know about our services or AI automations?"
      });
      setPhase("chat");
    }
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg) return;
    
    if (phase === "questionnaire") {
       const q = QUESTIONS[currentQuestionIndex];
       if (q && q.type === "text") {
         setInput("");
         handleAnswer(msg);
       }
       return;
    }

    // Chat Phase
    addUserMessage(msg);
    setInput("");
    setTyping(true);

    const reply = await askAI(msg);
    setTyping(false);
    addBotMessage({ type: "text", text: reply.text });
  };

  const handleAction = async (question) => {
    addUserMessage(question);
    setTyping(true);
    const responseData = await askAI("FAQ: " + question);
    setTyping(false);
    addBotMessage({ type: "text", text: responseData.text });
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const renderBold = (text) => {
    if (!text) return null;
    return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  };

  // ─── Render Message Content ────────────────────────────────────
  const renderMessage = (m, i) => {
    let messageContent;

    switch (m.type) {
      case "question-options":
        // Find out if this is the active question we are waiting on
        const isActive = phase === "questionnaire" && currentQuestionIndex === m.questionIndex;
        messageContent = (
          <div className="tc-quick-block">
            <div className="tc-quick-col">
              {m.options.map((opt, j) => (
                <motion.button
                  key={j}
                  className="tc-quick-pill"
                  onClick={() => {
                     if (isActive) handleAnswer(opt);
                  }}
                  disabled={!isActive}
                  whileHover={isActive ? { scale: 1.02 } : {}}
                  whileTap={isActive ? { scale: 0.97 } : {}}
                  style={{ opacity: isActive ? 1 : 0.6 }}
                >
                  {opt}
                </motion.button>
              ))}
            </div>
          </div>
        );
        break;

      case "cta":
        messageContent = (
          <motion.div className="tc-cta-card"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <p className="tc-cta-title">🚀 Ready to build your AI Agent?</p>
            <p className="tc-cta-sub">Let's discover a unique AI solution for your business — book a free strategy call with our team.</p>
            <motion.a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tc-cta-btn"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              📅 Book a Free Discovery Call
            </motion.a>
            <p className="tc-cta-hint">No commitment · 30 minutes · Real ROI analysis</p>
          </motion.div>
        );
        break;

      case "expert-recommendation":
        messageContent = (
          <div className="tc-bubble bot expert-recommendation-slider-container">
            <div className="expert-recommendation-intro">{renderBold(m.text)}</div>
            <div className="expert-slider-wrapper">
              <div className="expert-slider-track">
                {m.experts?.map((expert, idx) => (
                  <motion.div 
                    key={idx} 
                    className="expert-card-slide"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="expert-avatar-medium">
                      <img 
                        src={expert.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || "Expert")}&background=random&color=fff&size=120`} 
                        alt={expert.name} 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          if (!e.target.dataset.fallback) {
                            e.target.dataset.fallback = "true";
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || "Expert")}&background=random&color=fff&size=120`;
                          }
                        }}
                      />
                    </div>
                    <div className="expert-info-slide">
                      <p className="expert-name-slide">{expert.name}</p>
                      <p className="expert-price-tag-slide">${expert.price}</p>
                      <p className="expert-desc-slide">{expert.description}</p>
                      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="expert-select-btn">
                        Book Meeting
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );
        break;

      case "text":
      default:
        messageContent = (
          <motion.div className={`tc-bubble ${m.role}`} whileHover={{ scale: 1.01 }}>
            {renderBold(m.text)}
          </motion.div>
        );
        break;
    }

    return (
      <motion.div key={i} className={`tc-msg-row ${m.role}`}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {m.role === "bot" && <div className="tc-msg-avatar bot-av">{BOT_AVATAR}</div>}
        <div className="tc-msg-content">
          {messageContent}
          {m.type !== "question-options" && m.type !== "cta" && <div className={`tc-time ${m.role}`}>{m.time}</div>}
        </div>
        {m.role === "user" && <div className="tc-msg-avatar user-av">{USER_AVATAR}</div>}
      </motion.div>
    );
  };

  const isOptionQuestion = phase === "questionnaire" && QUESTIONS[currentQuestionIndex]?.type === "options";
  const placeholderText = isOptionQuestion ? "Please select an option above..." : "Type your message...";

  return (
    <div className="tc-shell">
      <motion.div className="tc-widget"
        initial={{ scale: 0.92, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}>

        {/* Header */}
        <div className="tc-header">
          <div className="tc-header-left">
            <div className="tc-avatar-ring">
              <div className="tc-bot-avatar">🤖</div>
              <span className="tc-online-dot" />
            </div>
            <div>
              <div className="tc-title">Trinity Agent ✨</div>
              <div className="tc-subtitle">🟢 Online · AI-Powered Assistant</div>
            </div>
          </div>
          <div className="tc-header-actions">
            <button className="tc-icon-btn" title="Minimize">⎯</button>
          </div>
        </div>

        {/* Body */}
        <div className="tc-body">
          <AnimatePresence>
            {messages.map((m, i) => renderMessage(m, i))}
          </AnimatePresence>

          {/* Typing */}
          <AnimatePresence>
            {typing && (
              <motion.div className="tc-msg-row bot"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="tc-msg-avatar bot-av">{BOT_AVATAR}</div>
                <div className="tc-typing"><span /><span /><span /></div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="tc-input-area">
          <div className="tc-input-box">
            <span className="tc-input-icon">💬</span>
            <input
              placeholder={placeholderText}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              className="tc-input"
              disabled={isOptionQuestion}
            />
            <motion.button className="tc-send-btn" onClick={send}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} disabled={!input.trim()}>
              🚀
            </motion.button>
          </div>
          <p className="tc-footer-hint">⚡ Powered by Trinity AI · Press Enter to send</p>
        </div>
      </motion.div>
    </div>
  );
}
