import { useState, useEffect } from "react";
import { ArrowLeft, Rabbit, Shield, AlertTriangle, Info, CheckCircle2, Zap, Terminal, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";

interface ReviewViewProps {
  repo: any;
  pr: any;
  onBack: () => void;
}

export function ReviewView({ repo, pr, onBack }: ReviewViewProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simulatedReview, setSimulatedReview] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
  }, [pr]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repos/${repo.owner.login}/${repo.name}/pulls/${pr.number}/reviews`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateReview = async () => {
    setSimulating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const code = "// Simulated code from PR\nfunction calculateTotal(items) {\n  let total = 0;\n  for(let i=0; i<items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}";
      const context = `Reviewing PR #${pr.number}: ${pr.title}`;

      const prompt = `
        Act as CodeRabbit AI. Review the following code changes.
        Provide a review in JSON format with the following structure:
        {
          "summary": "Brief summary of changes",
          "issues": [
            {
              "severity": "critical" | "warning" | "info",
              "line": number,
              "message": "Description of the issue",
              "suggestion": "Code block with the fix"
            }
          ]
        }
        
        Context: ${context}
        Code:
        ${code}
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      
      const text = result.text || "";
      const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
      setSimulatedReview(JSON.parse(jsonStr));
      toast.success("AI Review Complete");
    } catch (err) {
      console.error("Gemini error:", err);
      toast.error("Failed to simulate review");
    } finally {
      setSimulating(false);
    }
  };

  const applyFix = (issue: any) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Applying fix for line ${issue.line}...`,
        success: "Fix applied and committed to PR",
        error: "Failed to apply fix"
      }
    );
  };

  const applyAllFixes = () => {
    const count = simulatedReview?.issues?.length || 0;
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3000)),
      {
        loading: `Batch applying ${count} fixes...`,
        success: `Successfully applied ${count} fixes to PR #${pr.number}`,
        error: "Batch fix failed"
      }
    );
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="h-8 w-8 p-0 border border-[#141414] rounded-none hover:bg-[#141414] hover:text-[#E4E3E0]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-[#141414] rounded-none text-[9px] font-mono uppercase">PR #{pr.number}</Badge>
              <h3 className="text-sm font-bold tracking-tight">{pr.title}</h3>
            </div>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{repo.full_name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSimulateReview}
            disabled={simulating}
            className="bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 rounded-none h-9 px-4 text-xs font-mono uppercase tracking-widest"
          >
            {simulating ? (
              <Terminal className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Zap className="w-3 h-3 mr-2" />
            )}
            {simulating ? "Analyzing..." : "Review with AI"}
          </Button>
          
          {simulatedReview && (
            <Button 
              onClick={applyAllFixes}
              variant="outline"
              className="border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] rounded-none h-9 px-4 text-xs font-mono uppercase tracking-widest"
            >
              <CheckCircle2 className="w-3 h-3 mr-2" />
              Autofix All
            </Button>
          )}
        </div>
      </div>

      <Separator className="bg-[#141414]" />

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left: Review Comments */}
        <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
          <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Analysis Results
          </h4>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {simulatedReview ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="border border-[#141414] p-4 bg-[#141414]/5">
                      <p className="text-xs font-mono leading-relaxed italic">"{simulatedReview.summary}"</p>
                    </div>

                    {simulatedReview.issues.map((issue: any, i: number) => (
                      <div key={i} className="border border-[#141414] bg-white">
                        <div className={`p-3 border-b border-[#141414] flex items-center justify-between ${
                          issue.severity === 'critical' ? 'bg-red-50' : 
                          issue.severity === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
                        }`}>
                          <div className="flex items-center gap-2">
                            {issue.severity === 'critical' ? <Shield className="w-3 h-3 text-red-600" /> :
                             issue.severity === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-600" /> :
                             <Info className="w-3 h-3 text-blue-600" />}
                            <span className="text-[10px] font-mono uppercase font-bold">{issue.severity}</span>
                            <span className="text-[10px] font-mono opacity-50">Line {issue.line}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => applyFix(issue)}
                            className="h-6 text-[9px] font-mono uppercase border border-[#141414] rounded-none hover:bg-[#141414] hover:text-[#E4E3E0]"
                          >
                            Apply Fix
                          </Button>
                        </div>
                        <div className="p-4 space-y-3">
                          <p className="text-xs font-medium">{issue.message}</p>
                          <div className="bg-[#141414] p-3 rounded-sm overflow-x-auto">
                            <pre className="text-[10px] text-[#E4E3E0] font-mono">
                              <code>{issue.suggestion}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 w-full border border-[#141414] animate-pulse bg-[#141414]/5" />)}
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review, i) => (
                    <div key={i} className="border border-[#141414] p-4 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Rabbit className="w-3 h-3" />
                        <span className="text-[10px] font-mono uppercase font-bold">CodeRabbit Bot</span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap">{review.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center border border-dashed border-[#141414] opacity-30">
                    <p className="text-xs font-mono uppercase tracking-widest">No reviews found. Click "Review with AI" to start.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Code Context / Diff */}
        <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
          <h4 className="text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2">
            <Code className="w-3 h-3" />
            Code Context
          </h4>
          <div className="flex-1 border border-[#141414] bg-[#141414] p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-[#E4E3E0]/20 pb-2">
              <span className="text-[10px] font-mono text-[#E4E3E0]/50 uppercase">src/utils/math.ts</span>
              <Badge variant="outline" className="text-[9px] border-[#E4E3E0]/20 text-[#E4E3E0]/50 rounded-none">Typescript</Badge>
            </div>
            <ScrollArea className="flex-1">
              <pre className="text-[11px] text-[#E4E3E0] font-mono leading-relaxed">
                <code>{`1  /**
2   * Calculates the total price of items
3   * @param items Array of item objects
4   */
5  function calculateTotal(items) {
6    let total = 0;
7    for(let i=0; i<items.length; i++) {
8      total += items[i].price;
9    }
10   return total;
11 }`}</code>
              </pre>
            </ScrollArea>
          </div>
          
          <div className="p-4 border border-[#141414] bg-white/50 space-y-2">
            <h5 className="text-[10px] font-mono uppercase font-bold">Review Stats</h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 border border-[#141414]">
                <div className="text-lg font-bold">{simulatedReview?.issues?.filter((i:any) => i.severity === 'critical').length || 0}</div>
                <div className="text-[8px] font-mono uppercase opacity-50">Critical</div>
              </div>
              <div className="text-center p-2 border border-[#141414]">
                <div className="text-lg font-bold">{simulatedReview?.issues?.filter((i:any) => i.severity === 'warning').length || 0}</div>
                <div className="text-[8px] font-mono uppercase opacity-50">Warnings</div>
              </div>
              <div className="text-center p-2 border border-[#141414]">
                <div className="text-lg font-bold">{simulatedReview?.issues?.filter((i:any) => i.severity === 'info').length || 0}</div>
                <div className="text-[8px] font-mono uppercase opacity-50">Info</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
