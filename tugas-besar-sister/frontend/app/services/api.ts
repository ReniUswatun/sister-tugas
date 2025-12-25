import axios from "axios";

// Support connecting to different peer ports
export const createChatService = (
  baseUrl: string = "http://localhost:5000"
) => {
  const API_BASE = `${baseUrl}/api`;

  return {
    verifyKey: (publicKey: string) =>
      axios.post(`${API_BASE}/verify-key`, { public_key: publicKey }),

    getPeers: () => axios.get(`${API_BASE}/peers`),

    getMessages: (decrypt: boolean = true) =>
      axios.get(`${API_BASE}/messages`, { params: { decrypt } }),

    sendMessage: (message: string) =>
      axios.post(`${API_BASE}/send`, { message }),

    getPeerInfo: () => axios.get(`${API_BASE}/peer-info`),

    health: () => axios.get(`${API_BASE}/health`),
  };
};

// Get default base URL - must be called from client only
function getDefaultBaseUrl() {
  if (typeof window === "undefined") {
    throw new Error("getDefaultBaseUrl must be called from client-side");
  }

  // First check VITE_API_BASE environment variable (for Docker internal communication)
  const envBase = import.meta.env.VITE_API_BASE;
  if (envBase && envBase.includes("peer-")) {
    console.log("Docker mode: Using VITE_API_BASE:", envBase);
    return envBase;
  }

  // Host mode - map frontend port to localhost backend port
  const frontendPort = window.location.port;
  const portMap: Record<string, string> = {
    "5000": "5003", // Alice frontend -> Alice backend
    "5001": "5004", // Bob frontend -> Bob backend
    "5002": "5005", // Charlie frontend -> Charlie backend
    "5173": "5003", // Dev mode default to Alice
  };

  const backendPort = portMap[frontendPort] || "5003";
  const url = `http://localhost:${backendPort}`;
  console.log(
    "Host mode: Mapped frontend port",
    frontendPort,
    "to backend port",
    backendPort
  );
  return url;
}

let chatService: ReturnType<typeof createChatService> | null = null;

export function getChatService() {
  if (!chatService) {
    chatService = createChatService(getDefaultBaseUrl());
  }
  return chatService;
}
