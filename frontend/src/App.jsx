import React, { useEffect, useState } from "react";
import {
  fetchEmails,
  loadMockInbox,
  loadPrompts,
  processEmail,
  agentQuery,
  createDraft,
  listPrompts,
} from "./api";

export default function App() {
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [emailBody, setEmailBody] = useState("");
  const [output, setOutput] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [promptChoice, setPromptChoice] = useState("");
  const [question, setQuestion] = useState("");

  async function refreshEmails() {
    const e = await fetchEmails();
    setEmails(Array.isArray(e) ? e : (e.emails || []));

  }

  useEffect(() => {
    refreshEmails();
    async function loadP() {
      const ps = await listPrompts();
      setPrompts(ps);
    }
    loadP();
  }, []);

  async function handleLoadMock() {
    const r = await loadMockInbox();
    setOutput(JSON.stringify(r, null, 2));
    await refreshEmails();
  }

  async function handleLoadPrompts() {
    await loadPrompts();
    const ps = await listPrompts();
    setPrompts(ps);
    setOutput("Prompts loaded");
  }

  async function handleSelect(id) {
    setSelected(id);
    const e = emails.find((x) => x.id === id);
    setEmailBody(e ? `${e.sender}\n${e.subject}\n\n${e.body}` : "");
  }

  async function handleProcess() {
    if (!selected) return setOutput("Select email");
    const res = await processEmail(selected);
    setOutput(JSON.stringify(res, null, 2));
    await refreshEmails();
  }

  async function handleAgent() {
    if (!selected) return setOutput("Select email");
    const payload = {
      email_id: selected,
      prompt_name: promptChoice || null,
      user_query: question,
    };
    const res = await agentQuery(payload);
    setOutput(JSON.stringify(res, null, 2));
  }

  async function handleCreateDraft() {
    if (!selected) return setOutput("Select email");
    const payload = {
      email_id: selected,
      subject: "Draft: " + selected,
      body: "Draft body",
      metadata_json: "{}",
    };
    const res = await createDraft(payload);
    setOutput(JSON.stringify(res, null, 2));
  }

  return (
    <div className="app-shell">
      
      {/* LEFT PANEL — INBOX */}
      <div className="inbox">
        <h3>Inbox</h3>
        <div className="controls">
          <button onClick={handleLoadMock}>Load Mock Inbox</button>
          <button 
  onClick={async ()=>{
    await fetch("http://127.0.0.1:8000/reset_all", {method:"POST"});
    setOutput("All data reset");
    refreshEmails();
  }} 
  style={{marginLeft:8, background:"#ff4444", color:"#fff"}}
>
  Reset All
</button>

          <button onClick={handleLoadPrompts}>Load Prompts</button>
          <button onClick={refreshEmails}>Refresh</button>
        </div>

        <ul>
  {emails.map(e => (
    <li key={e.id} style={{ margin: "8px 0", display:"flex", alignItems:"center" }}>
      
      {/* DELETE BUTTON */}
      <button 
        style={{
          marginRight: 10,
          color: "white",
          background: "#d9534f",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          padding: "2px 6px",
        }}
        onClick={async () => {
          await fetch(`http://127.0.0.1:8000/delete_email/${e.id}`, { method: "DELETE" });
          await refreshEmails();
        }}
      >
        ✖
      </button>

      {/* EMAIL SELECT LINK */}
      <a 
        href="#" 
        onClick={(ev) => { ev.preventDefault(); handleSelect(e.id); }}
        style={{ textDecoration: "none" }}
      >
        {e.id} — {e.sender} — {e.subject}
      </a>
    </li>
  ))}
</ul>

      </div>

      {/* CENTER PANEL — EMAIL VIEWER */}
      <div className="viewer">
        <h3>Email Viewer</h3>

        <div className="card">
          <pre>{emailBody}</pre>
        </div>

        <div className="actions">
          <button className="primary" onClick={handleProcess}>
            Process Email
          </button>
          <button onClick={handleCreateDraft}>Save Draft</button>
        </div>
      </div>

      {/* RIGHT PANEL — AGENT */}
      <div className="agent">
        <h3>Agent Chat</h3>

        <div className="panel">
          <label>Prompt</label>
          <select
            value={promptChoice}
            onChange={(e) => setPromptChoice(e.target.value)}
          >
            <option value="">(none)</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 10 }}>
            <label>Question</label>
            <textarea
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="controls">
            <button className="primary" onClick={handleAgent}>
              Run Agent
            </button>
          </div>

          <h4 style={{ marginTop: 20 }}>Output</h4>
          <div className="output">
            <pre>{output}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
