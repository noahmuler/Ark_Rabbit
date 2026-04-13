import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Dashboard } from "@/components/Dashboard";
import { Github, Rabbit, Terminal, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUser();
        toast.success("Successfully connected to GitHub");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch("/api/auth/url");
      const { url } = await res.json();
      window.open(url, "github_oauth", "width=600,height=700");
    } catch (err) {
      toast.error("Failed to initiate GitHub connection");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <Terminal className="animate-pulse w-8 h-8" />
          <span className="text-xs uppercase tracking-widest opacity-50">Initializing System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b border-[#141414] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#141414] p-2 rounded-sm">
            <Rabbit className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight uppercase">RabbitReview</h1>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">CodeRabbit Integration Hub v1.0.4</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 border border-[#141414] px-3 py-1.5 rounded-sm">
              <img src={user.avatar_url} alt={user.login} className="w-6 h-6 rounded-full border border-[#141414]" referrerPolicy="no-referrer" />
              <span className="text-xs font-mono font-medium">{user.login}</span>
            </div>
          ) : (
            <Button 
              onClick={handleConnect}
              variant="outline" 
              className="border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] rounded-none h-9 px-4 text-xs font-mono uppercase tracking-wider transition-all"
            >
              <Github className="w-4 h-4 mr-2" />
              Connect GitHub
            </Button>
          )}
        </div>
      </header>

      <main className="p-6">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto mt-20 text-center"
            >
              <h2 className="text-6xl font-bold tracking-tighter uppercase mb-6 italic font-serif">
                AI-Powered Code Reviews <br/>
                <span className="not-italic">Directly in your workflow</span>
              </h2>
              <p className="text-lg opacity-70 mb-12 max-w-2xl mx-auto">
                Connect your GitHub account to start reviewing code, checking for security issues, 
                and applying CodeRabbit suggestions with a single click.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: Zap, title: "Instant Review", desc: "Run deep analysis on any code snippet or PR instantly." },
                  { icon: Shield, title: "Security First", desc: "Detect vulnerabilities and security flaws before they merge." },
                  { icon: Terminal, title: "Agent Ready", desc: "Designed to work with Cursor, Claude Code, and Copilot." }
                ].map((feature, i) => (
                  <div key={i} className="border border-[#141414] p-6 text-left hover:bg-[#141414]/5 transition-colors">
                    <feature.icon className="w-6 h-6 mb-4" />
                    <h3 className="font-bold uppercase text-sm mb-2">{feature.title}</h3>
                    <p className="text-xs opacity-60 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleConnect}
                className="bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 rounded-none h-14 px-10 text-sm font-mono uppercase tracking-widest"
              >
                Get Started with GitHub
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-[#141414] bg-[#E4E3E0] px-6 py-2 flex justify-between items-center z-50">
        <div className="flex gap-4 text-[10px] font-mono opacity-50 uppercase tracking-widest">
          <span>System Status: Online</span>
          <span>API Latency: 42ms</span>
        </div>
        <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
          © 2026 RabbitReview Labs
        </div>
      </footer>
    </div>
  );
}
