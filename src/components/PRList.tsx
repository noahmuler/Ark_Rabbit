import { useState, useEffect } from "react";
import { GitPullRequest, User, Clock, MessageSquare, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface PRListProps {
  repo: any;
  onSelectPR: (pr: any) => void;
}

export function PRList({ repo, onSelectPR }: PRListProps) {
  const [pulls, setPulls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (repo) fetchPulls();
  }, [repo]);

  const fetchPulls = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repos/${repo.owner.login}/${repo.name}/pulls`);
      const data = await res.json();
      setPulls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch pulls", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full border border-[#141414] rounded-none bg-[#141414]/5" />
        ))}
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="h-full flex items-center justify-center border border-dashed border-[#141414] opacity-30">
        <p className="text-xs font-mono uppercase tracking-widest">Select a repository to view Pull Requests</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-4">
        {pulls.length === 0 ? (
          <div className="p-12 text-center border border-[#141414] bg-white/50">
            <GitPullRequest className="w-8 h-8 mx-auto mb-4 opacity-20" />
            <h3 className="text-sm font-bold uppercase mb-2">No Open Pull Requests</h3>
            <p className="text-xs opacity-50 font-mono">This repository has no active pull requests to review.</p>
          </div>
        ) : (
          pulls.map((pr) => (
            <div 
              key={pr.id}
              onClick={() => onSelectPR(pr)}
              className="group border border-[#141414] p-5 bg-white/50 hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-[#141414] group-hover:border-[#E4E3E0] rounded-none text-[9px] font-mono uppercase">
                    #{pr.number}
                  </Badge>
                  <h4 className="text-sm font-bold truncate tracking-tight">{pr.title}</h4>
                </div>
                
                <div className="flex items-center gap-4 text-[10px] font-mono opacity-60 group-hover:opacity-100">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{pr.user.login}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{pr.comments || 0} comments</span>
                  </div>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity ml-4" />
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
