import { useEffect, useState } from "react";
import TrinityChat from "./components/TrinityChat";
import { loadPDF } from "./rag/pdfLoader";
import { chunkText } from "./rag/chunk";
import { embedChunks } from "./rag/vectorStore";
import "./App.css";

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const text = await loadPDF();
        const chunks = chunkText(text);
        await embedChunks(chunks);
        setReady(true);
      } catch (err) {
        console.error("PDF loading failed", err);
        setReady(true);
      }
    };
    init();
  }, []);

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading-orb">🤖</div>
        <p className="loading-title">Trinity AI</p>
        <p className="loading-sub">⚡ Loading knowledge base...</p>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  return <TrinityChat />;
}

export default App;