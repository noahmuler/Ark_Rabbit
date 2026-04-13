import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRList } from "./PRList";
import { ReviewView } from "./ReviewView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, GitPullRequest, Code2, History, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Dashboard() {
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      setRepos(data);
      if (data.length > 0) setSelectedRepo(data[0]);
    } catch (err) {
      console.error("Failed to fetch repos", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
      {/* Sidebar: Repositories */}
      <aside className="col-span-3 border border-[#141414] flex flex-col bg-white/50">
        <div className="p-4 border-b border-[#141414] bg-[#141414] text-[#E4E3E0]">
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold">Repositories</h3>
        </div>
        <div className="p-3 border-b border-[#141414]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-3 h-3 opacity-50" />
            <Input 
              placeholder="Filter repos..." 
              className="pl-7 h-8 text-xs border-[#141414] rounded-none bg-transparent focus-visible:ring-0"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {repos.map((repo) => (
            <div 
              key={repo.id}
              onClick={() => {
                setSelectedRepo(repo);
                setSelectedPR(null);
              }}
              className={`p-4 border-b border-[#141414] cursor-pointer transition-colors ${
                selectedRepo?.id === repo.id ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="w-3 h-3" />
                <span className="text-xs font-bold truncate">{repo.name}</span>
              </div>
              <p className="text-[10px] opacity-60 truncate font-mono">{repo.full_name}</p>
            </div>
          ))}
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <div className="col-span-9 flex flex-col gap-6 overflow-hidden">
        <Tabs defaultValue="pulls" className="w-full h-full flex flex-col">
          <TabsList className="bg-transparent border-b border-[#141414] rounded-none p-0 h-10 w-full justify-start gap-8">
            <TabsTrigger 
              value="pulls" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#141414] data-[state=active]:bg-transparent px-0 text-xs font-mono uppercase tracking-widest"
            >
              <GitPullRequest className="w-3 h-3 mr-2" />
              Pull Requests
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#141414] data-[state=active]:bg-transparent px-0 text-xs font-mono uppercase tracking-widest"
            >
              <History className="w-3 h-3 mr-2" />
              Review History
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#141414] data-[state=active]:bg-transparent px-0 text-xs font-mono uppercase tracking-widest ml-auto"
            >
              <Settings className="w-3 h-3 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pulls" className="flex-1 mt-6 overflow-hidden">
            {!selectedPR ? (
              <PRList 
                repo={selectedRepo} 
                onSelectPR={setSelectedPR} 
              />
            ) : (
              <ReviewView 
                repo={selectedRepo} 
                pr={selectedPR} 
                onBack={() => setSelectedPR(null)} 
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-1 mt-6">
            <div className="border border-[#141414] p-12 text-center bg-white/50">
              <History className="w-8 h-8 mx-auto mb-4 opacity-20" />
              <h3 className="text-sm font-bold uppercase mb-2">No Review History</h3>
              <p className="text-xs opacity-50 font-mono">Reviews you perform will appear here for auditing.</p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-6">
            <Card className="border-[#141414] rounded-none shadow-none bg-white/50">
              <CardHeader className="border-b border-[#141414]">
                <CardTitle className="text-sm uppercase tracking-widest">Integration Settings</CardTitle>
                <CardDescription className="text-xs font-mono">Configure how RabbitReview interacts with CodeRabbit and GitHub.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest font-bold">CodeRabbit API Key</label>
                  <Input type="password" placeholder="cr_..." className="border-[#141414] rounded-none h-10 font-mono text-xs" />
                  <p className="text-[10px] opacity-50 italic">Required for triggering reviews on private repositories.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest font-bold">Auto-Fix Strategy</label>
                  <select className="w-full h-10 border border-[#141414] bg-transparent px-3 text-xs font-mono outline-none">
                    <option>Batch Fix (Commit all suggestions)</option>
                    <option>Interactive (Review each fix)</option>
                    <option>Draft PR (Create new PR with fixes)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
