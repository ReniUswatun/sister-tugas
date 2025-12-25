import { useState } from "react";
import { Lock, LogIn } from "lucide-react";

interface LoginProps {
  onAuthSuccess: () => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const [publicKey, setPublicKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_key: publicKey }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Authorization success:", data);
        onAuthSuccess();
      } else {
        setError("Invalid group public key. Try 'chat123'");
      }
    } catch (err) {
      setError("Connection failed. Make sure backend is running on port 5000");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-[#0d1117] to-[#161b22] text-[#e6edf3]">
      <div className="m-auto w-full max-w-md">
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="rounded-full bg-green-500/20 p-3">
              <Lock size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">P2P Group Chat</h1>
            <p className="text-sm text-gray-400">
              Enter public key to access group
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-md border border-red-500/50 bg-red-900/20 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Group Public Key
              </label>
              <input
                type="password"
                placeholder="Enter group public key..."
                className="w-full rounded-md border border-[#30363d] bg-[#0d1117] p-3 text-sm transition focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                disabled={loading}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Hint: Try "chat123" for demo access
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !publicKey}
              className="w-full rounded-md bg-green-600 p-3 font-semibold transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <LogIn size={18} />
              {loading ? "Authenticating..." : "Enter Group Chat"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-[#30363d] pt-4 text-center">
            <p className="text-xs text-gray-500">
              🔒 All messages encrypted with RSA-2048
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
