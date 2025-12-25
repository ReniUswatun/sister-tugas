import { useState, useEffect, useRef } from "react";
import { getChatService } from "../services/api";
import { Send, Users, LogOut } from "lucide-react";

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPeerInfo, setCurrentPeerInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize from localStorage on component mount
  useEffect(() => {
    const savedPublicKey = localStorage.getItem("publicKey");
    const savedLoginState = localStorage.getItem("isLoggedIn");

    if (savedPublicKey && savedLoginState === "true") {
      setPublicKey(savedPublicKey);
      setIsLoggedIn(true);
    }
  }, []);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time polling untuk messages dan peers
  useEffect(() => {
    if (!isLoggedIn) return; // Jangan polling jika belum login

    const fetchData = async () => {
      try {
        const chatService = getChatService();
        // Get current peer info
        const peerRes = await chatService.getPeerInfo();
        setCurrentPeerInfo(peerRes.data);

        // Get all peers in group
        const peersRes = await chatService.getPeers();
        setPeers(peersRes.data);

        // Get all messages (auto-decrypted)
        const messagesRes = await chatService.getMessages(true);
        setMessages(messagesRes.data);

        setConnectionStatus("connected");
      } catch (err) {
        console.error("Error fetching data:", err);
        setConnectionStatus("disconnected");
      }
    };

    // Initial fetch immediately
    fetchData();

    // Poll every 2 seconds for real-time updates
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey.trim()) {
      alert("Please enter public key");
      return;
    }

    setLoginLoading(true);
    try {
      // Verifikasi public key dengan mengirim ke backend
      const chatService = getChatService();
      const response = await chatService.verifyKey(publicKey);

      if (response.data.status === "authorized") {
        // Save session to localStorage
        localStorage.setItem("publicKey", publicKey);
        localStorage.setItem("isLoggedIn", "true");

        setIsLoggedIn(true);
      } else {
        alert("Invalid public key");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to join group chat");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    // Reset state
    setIsLoggedIn(false);
    setPublicKey("");
    setMessages([]);
    setPeers([]);
    setCurrentPeerInfo(null);

    // Clear localStorage
    localStorage.removeItem("publicKey");
    localStorage.removeItem("isLoggedIn");

    // Call parent logout
    onLogout();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      alert("Message cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const chatService = getChatService();
      const response = await chatService.sendMessage(message);
      console.log("Message sent:", response.data);
      setMessage(""); // Clear input immediately

      // Refresh messages immediately after sending
      setTimeout(async () => {
        try {
          const messagesRes = await chatService.getMessages(true);
          setMessages(messagesRes.data);
        } catch (err) {
          console.error("Error refreshing messages:", err);
        }
      }, 100); // Small delay to ensure message is processed
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isLoggedIn ? (
        // LOGIN SCREEN
        <div className="flex h-screen items-center justify-center bg-[#0d1117] text-[#e6edf3] font-sans">
          <div className="w-96 p-8 rounded-lg border border-[#30363d] bg-[#161b22]">
            <h1 className="text-2xl font-bold mb-2 text-green-500">
              Group Chat
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              Enter public key to join the group
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Public Key
                </label>
                <input
                  type="password"
                  placeholder="Enter group public key (e.g., chat123)"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  disabled={loginLoading}
                  className="w-full bg-[#0d1117] border border-[#30363d] p-3 rounded text-sm focus:border-green-600 focus:outline-none disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading || !publicKey.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 p-3 rounded-md font-semibold transition">
                {loginLoading ? "Joining..." : "Join Group"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        // CHAT SCREEN
        <div className="flex h-screen bg-[#0d1117] text-[#e6edf3] font-sans">
          {/* Sidebar - Peer List */}
          <aside className="w-64 bg-[#161b22] border-r border-[#30363d] p-5 flex flex-col">
            <div className="flex items-center gap-2 text-green-500 font-bold mb-6">
              <Users size={20} />
              <span>GROUP CHAT</span>
            </div>

            {/* Current Peer Info */}
            {currentPeerInfo && (
              <div className="mb-6 p-3 rounded-md bg-green-900/20 border border-green-600/50">
                <div className="text-xs text-gray-400 mb-1">YOU ARE</div>
                <div className="font-bold text-green-400">
                  {currentPeerInfo.peer_name}
                </div>
                <div className="text-xs text-gray-500">
                  @ localhost:{currentPeerInfo.peer_port}
                </div>
              </div>
            )}

            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users size={16} /> Active Peers ({peers.length})
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {peers.map((peer) => (
                <div
                  key={peer.port}
                  className="p-3 rounded-md border border-[#30363d] hover:bg-gray-800/50 transition">
                  <div className="font-bold text-sm">{peer.name}</div>
                  <div className="text-xs text-gray-500">
                    localhost:{peer.port}
                  </div>
                </div>
              ))}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 p-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2">
              <LogOut size={16} />
              Exit Group
            </button>
          </aside>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col">
            {/* Header */}
            <header className="p-4 border-b border-[#30363d] flex justify-between items-center bg-[#161b22]">
              <h2 className="font-bold text-lg">Group Chat Room</h2>
              <div className="text-xs flex items-center gap-2 text-green-500">
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"}`}></div>
                {connectionStatus === "connected"
                  ? "E2E RSA Encrypted"
                  : "Disconnected"}
              </div>
            </header>

            {/* Messages Display */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col-reverse space-y-reverse space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_me ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] p-3 rounded-xl border ${
                      msg.is_me
                        ? "bg-green-700 border-none"
                        : "bg-[#161b22] border-[#30363d]"
                    }`}>
                    {/* Sender Info */}
                    <div className="text-[10px] opacity-70 mb-1 font-semibold">
                      {msg.sender_display}
                      {msg.encrypted && <span className="ml-1">🔒</span>}
                    </div>

                    {/* Message Text */}
                    <p className="text-sm break-all">
                      {msg.text || "[Failed to decrypt message]"}
                    </p>

                    {/* Timestamp */}
                    <div className="text-[9px] text-right mt-1 opacity-40">
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {messages.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8">
                  No messages yet. Start the conversation!
                </div>
              )}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-[#30363d] bg-[#161b22] flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-[#0d1117] border border-[#30363d] p-2 rounded text-sm focus:border-green-600 focus:outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                title="Send message (Encrypted)"
                aria-label="Send message"
                className="bg-green-600 p-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1">
                <Send size={20} />
                <span className="sr-only">Send</span>
              </button>
            </form>
          </main>
        </div>
      )}
    </>
  );
}
