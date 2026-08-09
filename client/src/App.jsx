import { useState } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";
const API = "https://" + "autonomous-ai-creator-server.onrender.com";

function App() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [agent, setAgent] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  async function createAgent(e) {
    e.preventDefault();

    if (!name.trim() || !domain.trim()) {
      setMessage("Please enter agent name and domain.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/agent/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
      
      persona: {
            name,
            domain,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create agent");
      }

      setAgent({
        id: data.agentId,
        name,
        domain,
      });

      setChatMessages([
        {
          role: "assistant",
          text: `Hi! I'm ${name}, your autonomous AI assistant. Ask me anything about ${domain} or any other topic.`,
        },
      ]);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendChat(e) {
    e?.preventDefault();

    if (!chatInput.trim() || !agent || chatLoading) {
      return;
    }

    const userMessage = chatInput.trim();

    setChatInput("");

    setChatMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setChatLoading(true);

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
      agentId: agent.id,
      persona: {
            name: agent.name,
            domain: agent.domain,
          },
          message: userMessage,
          memories: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI response");
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.text || "I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Sorry, something went wrong: ${error.message}`,
          error: true,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function publishNow() {
    if (!agent) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/agent/${agent.id}/publish-now`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Publishing failed");
      }

      if (data.published) {
        setMessage("New post published successfully.");
      } else {
        setMessage(data.message || "No topic cleared editorial judgment.");
      }

      await loadFeed();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadFeed() {
    if (!agent) return;

    try {
      const response = await fetch(
        `${API}/api/agent/feed?agentId=${agent.id}`
      );

      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function resetAgent() {
    setAgent(null);
    setPosts([]);
    setChatMessages([]);
    setMessage("");
    setName("");
    setDomain("");
  }

  return (
    <div className="app">
      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>

      <header className="header">
        <div className="brand">
          <div className="logo">
            âœ¦
          </div>

          <div>
            <h1>Autonomous Creator</h1>
            <p>AI-powered editorial agent</p>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          System Online
        </div>
      </header>

      <main className="container">
        {!agent ? (
          <section className="hero">
            <div className="hero-badge">
              <span>âœ¦</span>
              AUTONOMOUS AI SYSTEM
            </div>

            <h2>
              Create an AI agent that
              <span> thinks, selects & publishes.</span>
            </h2>

            <p className="hero-text">
              Your autonomous creator discovers live topics, evaluates them
              editorially, remembers previous coverage, and generates
              high-quality posts automatically.
            </p>

            <form className="create-card" onSubmit={createAgent}>
              <div className="card-header">
                <div>
                  <div className="mini-label">CONFIGURATION</div>
                  <h3>Create your agent</h3>
                  <p>Give your AI creator a persona and domain.</p>
                </div>

                <div className="sparkle">âœ¦</div>
              </div>

              <label>Agent Name</label>

              <input
                type="text"
                placeholder="e.g. AI Security Agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label>Domain</label>

              <input
                type="text"
                placeholder="e.g. Artificial Intelligence"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />

              <button type="submit" disabled={loading}>
                {loading ? (
                  "Creating Agent..."
                ) : (
                  <>
                    Create Autonomous Agent
                    <span>â†’</span>
                  </>
                )}
              </button>

              {message && <div className="message">{message}</div>}
            </form>

            <div className="feature-row">
              <div className="feature-card">
                <span>01</span>
                <strong>Discover</strong>
                <p>Find live topics</p>
              </div>

              <div className="feature-card">
                <span>02</span>
                <strong>Judge</strong>
                <p>Editorial selection</p>
              </div>

              <div className="feature-card">
                <span>03</span>
                <strong>Remember</strong>
                <p>Breeth-powered memory</p>
              </div>

              <div className="feature-card">
                <span>04</span>
                <strong>Publish</strong>
                <p>Generate automatically</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="dashboard">
            <div className="dashboard-top">
              <div>
                <div className="hero-badge">
                  <span>â—</span>
                  AUTONOMOUS AGENT
                </div>

                <h2>{agent.name}</h2>

                <p>
                  Domain:
                  <strong> {agent.domain}</strong>
                </p>
              </div>

              <div className="dashboard-actions">
                <button
                  className="reset-btn"
                  onClick={resetAgent}
                >
                  New Agent
                </button>

                <button
                  className="publish-btn"
                  onClick={publishNow}
                  disabled={loading}
                >
                  {loading ? "Publishing..." : "âœ¦ Publish Now"}
                </button>
              </div>
            </div>

            {message && (
              <div className="dashboard-message">
                <span>âœ“</span>
                {message}
              </div>
            )}

            <div className="stats">
              <div className="stat-card">
                <span>AGENT STATUS</span>
                <strong>
                  <i></i> Active
                </strong>
              </div>

              <div className="stat-card">
                <span>PUBLISHED POSTS</span>
                <strong>{posts.length}</strong>
              </div>

              <div className="stat-card">
                <span>MEMORY</span>
                <strong>Breeth âœ“</strong>
              </div>

              <div className="stat-card">
                <span>MODE</span>
                <strong>Autonomous</strong>
              </div>
            </div>

            {/* CHAT */}
            <section className="chat-section">
              <div className="chat-header">
                <div className="chat-title">
                  <div className="ai-icon">âœ¦</div>

                  <div>
                    <div className="mini-label">AI CONVERSATION</div>
                    <h3>Chat with {agent.name}</h3>
                    <p>
                      Your autonomous agent is ready to assist you.
                    </p>
                  </div>
                </div>

                <div className="chat-status">
                  <span className="status-dot"></span>
                  Gemini AI Online
                </div>
              </div>

              <div className="chat-box">
                {chatMessages.length === 0 ? (
                  <div className="chat-empty">
                    <div className="chat-icon">âœ¦</div>
                    <h3>Start a conversation</h3>
                    <p>
                      Ask your AI agent anything.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((chat, index) => (
                    <div
                      className={`chat-message ${
                        chat.role === "user"
                          ? "user-message"
                          : "ai-message"
                      }`}
                      key={index}
                    >
                      <div className="chat-avatar">
                        {chat.role === "user" ? "YOU" : "AI"}
                      </div>

                      <div
                        className={`chat-bubble ${
                          chat.error ? "error-bubble" : ""
                        }`}
                      >
                        <ReactMarkdown>{chat.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}

                {chatLoading && (
                  <div className="chat-message ai-message">
                    <div className="chat-avatar">AI</div>

                    <div className="chat-bubble">
                      <div className="typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form
                className="chat-input-area"
                onSubmit={sendChat}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) =>
                    setChatInput(e.target.value)
                  }
                  placeholder={`Ask ${agent.name} anything...`}
                  disabled={chatLoading}
                />

                <button
                  type="submit"
                  disabled={
                    chatLoading || !chatInput.trim()
                  }
                >
                  {chatLoading ? "..." : "Send â†’"}
                </button>
              </form>
            </section>

            {/* FEED */}

            <div className="feed-header">
              <div>
                <div className="mini-label">AUTONOMOUS OUTPUT</div>
                <h3>Creator Feed</h3>
                <p>
                  Posts selected and generated by your autonomous
                  agent.
                </p>
              </div>

              <button
                className="refresh-btn"
                onClick={loadFeed}
              >
                â†» Refresh
              </button>
            </div>

            <div className="feed">
              {posts.length === 0 ? (
                <div className="empty">
                  <div>âœ¦</div>
                  <h3>No posts yet</h3>
                  <p>
                    Click <strong>Publish Now</strong> to let your
                    agent find and publish its first topic.
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <article className="post" key={post.id}>
                    <div className="post-top">
                      <span className="post-label">
                        AI GENERATED
                      </span>

                      <time>
                        {new Date(
                          post.createdAt
                        ).toLocaleString()}
                      </time>
                    </div>

                    <h3>{post.topic}</h3>

                    <p className="post-text">
                      {post.text}
                    </p>

                    <div className="rationale">
                      <strong>
                        Editorial reasoning
                      </strong>

                      <p>{post.rationale}</p>
                    </div>

                    {post.sources?.length > 0 && (
                      <div className="sources">
                        <strong>Sources</strong>

                        {post.sources.map(
                          (source, index) => (
                            <a
                              href={source}
                              target="_blank"
                              rel="noreferrer"
                              key={index}
                            >
                              {source}
                            </a>
                          )
                        )}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>âœ¦</span>
        Autonomous AI Creator
        <span>â€¢</span>
        Hackathon Project
      </footer>
    </div>
  );
}

export default App;













