import { useState, type ReactNode } from "react";







import {







  Bug,







  Network,







  Code2,







  Brain,







  Loader2,







  ShieldCheck,







  CheckCircle2,







  AlertTriangle,



  History as HistoryIcon,



  ArrowLeft,



  RefreshCw,







} from "lucide-react";















type Domain = "os" | "c_cpp" | "network";















interface StructuredAnalysis {







  problem: string;







  severity: "low" | "medium" | "high" | "critical" | string;







  rootCause: string;







  evidence: string;







  whyItHappened: string;







  suggestedFix: string;







  concept: string;







  examMode: ExamMode;







}















interface ExamMode {







  definition: string;







  whyItHappened: string;







  shortExamAnswer: string;







  vivaQuestions: string[];







}















interface EvidenceCheck {







  type: string;







  detected: boolean;







  details: string;







  explanation: string;







}















interface StructuredEvidence {







  analyzer: string;







  domain: string;







  checks: EvidenceCheck[];







}















interface DeadlockGraph {







  nodes: {







    id: string;







    type: "thread";







  }[];







  locks: {







    id: string;







    type: "lock";







  }[];







  edges: {







    from: string;







    to: string;







    type: "holds";







    order: number;







  }[];







  detected: boolean;







}















interface RaceGraph {







  variables: {







    id: string;







  }[];







  accesses: {







    thread: string;







    variable: string;







    type: "read" | "write";







  }[];







  detected: boolean;







}















interface NetworkGraph {







  source: string;







  destination: string;







  packets: {







    id: number;







    status: "success" | "lost";







    latency?: number;







  }[];







  detected: boolean;







}















interface AnalysisResponse {







  success: boolean;







  analysis: StructuredAnalysis;







  evidence?: string;







  structuredEvidence?: StructuredEvidence;







  deadlockGraph?: DeadlockGraph | null;







  raceGraph?: RaceGraph | null;







  networkGraph?: NetworkGraph | null;







}















interface HistorySession {



  id: string;



  domain: Domain;



  createdAt: string;



  updatedAt: string;



  analysis: StructuredAnalysis & {



    id: string;



    sessionId: string;



  };



}







const API_URL =



  import.meta.env.VITE_API_URL || "http://localhost:5000";







function App() {







  const [domain, setDomain] = useState<Domain>("os");







  const [code, setCode] = useState("");







  const [loading, setLoading] = useState(false);







  const [result, setResult] = useState<AnalysisResponse | null>(null);







  const [error, setError] = useState("");



  const [historyOpen, setHistoryOpen] = useState(false);



  const [historyLoading, setHistoryLoading] = useState(false);



  const [history, setHistory] = useState<HistorySession[]>([]);



  const [selectedHistory, setSelectedHistory] =



    useState<HistorySession | null>(null);



  const [historyError, setHistoryError] = useState("");















  const analyzeCode = async () => {







    if (!code.trim()) {







      setError("Please paste some code, logs, or an error first.");







      return;







    }















    setLoading(true);







    setError("");







    setResult(null);















    try {







      // Production-safe API configuration.







      //







      // Local development:







      // VITE_API_URL=http://localhost:5000







      //







      // Production:







      // VITE_API_URL=https://your-backend-domain.com







      const API_URL =







        import.meta.env.VITE_API_URL || "http://localhost:5000";















      const response = await fetch(`${API_URL}/api/analyze`, {







        method: "POST",







        headers: {







          "Content-Type": "application/json",







        },







        body: JSON.stringify({







          domain,







          code,







        }),







      });















      const data = await response.json();















      if (!response.ok) {







        throw new Error(data.error || "Something went wrong.");







      }















      setResult(data);







    } catch (err) {







      setError(







        err instanceof Error







          ? err.message







          : "Unable to connect to the backend."







      );







    } finally {







      setLoading(false);







    }







  };















  const loadHistory = async () => {



    setHistoryLoading(true);



    setHistoryError("");







    try {



      const response = await fetch(`${API_URL}/api/history`);



      const data = await response.json();







      if (!response.ok) {



        throw new Error(data.error || "Failed to load history.");



      }







      setHistory(data.sessions || []);



      setSelectedHistory(null);



    } catch (err) {



      setHistoryError(



        err instanceof Error



          ? err.message



          : "Unable to load analysis history."



      );



    } finally {



      setHistoryLoading(false);



    }



  };







  const openHistory = async () => {



    setHistoryOpen(true);



    await loadHistory();



  };







  const closeHistory = () => {



    setHistoryOpen(false);



    setSelectedHistory(null);



    setHistoryError("");



  };







  const domainLabel = (value: Domain) => {



    switch (value) {



      case "os":



        return "OS / Concurrency";



      case "c_cpp":



        return "C / C++";



      case "network":



        return "Networking";



    }



  };







  const severityClass = (severity: string) => {







    switch (severity.toLowerCase()) {







      case "critical":







        return "bg-red-500/10 text-red-400 border border-red-900/50";















      case "high":







        return "bg-orange-500/10 text-orange-400 border border-orange-900/50";















      case "medium":







        return "bg-yellow-500/10 text-yellow-400 border border-yellow-900/50";















      default:







        return "bg-blue-500/10 text-blue-400 border border-blue-900/50";







    }







  };















  return (







    <div className="min-h-screen bg-zinc-950 text-zinc-100">















      <header className="border-b border-zinc-800">







        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">







          <div className="flex items-center gap-3">







            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-xl">







              🦉







            </div>















            <div>







              <h1 className="text-lg font-bold">Night-Owl</h1>















              <p className="text-xs text-zinc-500">







                AI Systems Debugger







              </p>







            </div>







          </div>















          <div className="flex items-center gap-3">



            <button



              onClick={openHistory}



              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"



            >



              <HistoryIcon size={16} />



              History



            </button>







            <div className="flex items-center gap-2 text-xs text-emerald-400">



              <span className="h-2 w-2 rounded-full bg-emerald-400" />



              Backend Connected



            </div>



          </div>







        </div>







      </header>















      <main className="mx-auto max-w-7xl px-6 py-12">







        {historyOpen ? (



          <section className="mx-auto max-w-6xl">



            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">



              <div>



                <h2 className="text-3xl font-bold tracking-tight">Debug History</h2>



                <p className="mt-2 text-zinc-500">Review your previous Night-Owl analyses.</p>



              </div>



              <div className="flex items-center gap-3">



                <button onClick={loadHistory} disabled={historyLoading} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50">



                  <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} /> Refresh



                </button>



                <button onClick={closeHistory} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400">



                  <ArrowLeft size={16} /> Back to Analyzer



                </button>



              </div>



            </div>







            {historyError && <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{historyError}</div>}







            {historyLoading ? (



              <div className="flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-zinc-400">



                <Loader2 size={20} className="mr-3 animate-spin" /> Loading history...



              </div>



            ) : history.length === 0 ? (



              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">



                <HistoryIcon className="mx-auto mb-4 text-zinc-600" size={36} />



                <h3 className="text-lg font-semibold text-zinc-200">No analyses yet</h3>



                <p className="mt-2 text-sm text-zinc-500">Run your first debugging analysis and it will appear here.</p>



              </div>



            ) : (



              <div className="grid gap-6 lg:grid-cols-[360px_1fr]">



                <div className="space-y-3">



                  {history.map((session) => (



                    <button key={session.id} onClick={() => setSelectedHistory(session)} className={`w-full rounded-2xl border p-5 text-left transition ${selectedHistory?.id === session.id ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900"}`}>



                      <div className="flex items-start justify-between gap-3">



                        <div className="min-w-0">



                          <p className="truncate font-semibold text-zinc-100">{session.analysis.problem}</p>



                          <p className="mt-1 text-xs text-zinc-500">{domainLabel(session.domain)}</p>



                        </div>



                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${severityClass(session.analysis.severity)}`}>{session.analysis.severity}</span>



                      </div>



                      <p className="mt-4 text-xs text-zinc-600">{new Date(session.createdAt).toLocaleString()}</p>



                    </button>



                  ))}



                </div>







                <div>



                  {selectedHistory ? (



                    <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-6">



                      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">



                        <div>



                          <p className="text-xs uppercase tracking-wider text-zinc-500">{domainLabel(selectedHistory.domain)}</p>



                          <h3 className="mt-1 text-2xl font-bold text-zinc-100">{selectedHistory.analysis.problem}</h3>



                        </div>



                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${severityClass(selectedHistory.analysis.severity)}`}>{selectedHistory.analysis.severity}</span>



                      </div>



                      <div className="space-y-6">



                        <div><h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Root Cause</h4><p className="leading-7 text-zinc-300">{selectedHistory.analysis.rootCause}</p></div>



                        <div><h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Evidence</h4><p className="leading-7 text-zinc-300">{selectedHistory.analysis.evidence}</p></div>



                        <div><h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Why It Happened</h4><p className="leading-7 text-zinc-300">{selectedHistory.analysis.whyItHappened}</p></div>



                        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4"><h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">Suggested Fix</h4><p className="leading-7 text-zinc-300">{selectedHistory.analysis.suggestedFix}</p></div>



                        <div><h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Systems Concept</h4><p className="leading-7 text-zinc-300">{selectedHistory.analysis.concept}</p></div>



                        <div className="rounded-2xl border border-blue-900/50 bg-blue-950/10 p-5">



                          <h4 className="mb-4 font-semibold text-blue-400">Exam Mode</h4>



                          <div className="space-y-4">



                            <div><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Definition</p><p className="mt-1 leading-7 text-zinc-300">{selectedHistory.analysis.examMode.definition}</p></div>



                            <div><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Why It Happened</p><p className="mt-1 leading-7 text-zinc-300">{selectedHistory.analysis.examMode.whyItHappened}</p></div>



                            <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Short Exam Answer</p><p className="mt-1 leading-7 text-zinc-300">{selectedHistory.analysis.examMode.shortExamAnswer}</p></div>



                            <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Viva Questions</p><div className="space-y-2">{selectedHistory.analysis.examMode.vivaQuestions.map((question, index) => <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-300"><span className="mr-2 font-semibold text-blue-400">Q{index + 1}.</span>{question}</div>)}</div></div>



                          </div>



                        </div>



                        <p className="text-xs text-zinc-600">Saved {new Date(selectedHistory.createdAt).toLocaleString()} · Raw source code is not stored in history.</p>



                      </div>



                    </div>



                  ) : (



                    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">



                      <div><HistoryIcon className="mx-auto mb-4 text-zinc-600" size={36} /><h3 className="text-lg font-semibold text-zinc-200">Select an analysis</h3><p className="mt-2 text-sm text-zinc-500">Choose a session from the left to view its saved analysis.</p></div>



                    </div>



                  )}



                </div>



              </div>



            )}



          </section>



        ) : (



<>













        <section className="mx-auto max-w-4xl text-center">







          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400">







            <Brain size={16} />







            AI-powered systems debugging







          </div>















          <h2 className="text-5xl font-bold tracking-tight">







            Debug the systems.







            <br />







            <span className="text-amber-400">







              Understand the problem.







            </span>







          </h2>















          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">







            Analyze C/C++, operating system, concurrency, and networking







            problems with an AI agent that explains the root cause instead







            of simply giving you an answer.







          </p>







        </section>























        <section className="mx-auto mt-12 max-w-5xl">







          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">







            What are you debugging?







          </h3>















          <div className="grid gap-4 md:grid-cols-3">







            <DomainCard







              icon={<Bug size={22} />}







              title="OS / Concurrency"







              description="Deadlocks, race conditions, mutexes, semaphores and threads."







              selected={domain === "os"}







              onClick={() => setDomain("os")}







            />















            <DomainCard







              icon={<Code2 size={22} />}







              title="C / C++"







              description="Memory errors, crashes, undefined behavior and compiler errors."







              selected={domain === "c_cpp"}







              onClick={() => setDomain("c_cpp")}







            />















            <DomainCard







              icon={<Network size={22} />}







              title="Networking"







              description="TCP, routing, packets, OSPF and connectivity failures."







              selected={domain === "network"}







              onClick={() => setDomain("network")}







            />







          </div>







        </section>























        <section className="mx-auto mt-8 max-w-5xl">







          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">







            <label className="mb-3 block text-sm font-medium text-zinc-300">







              Paste your code, logs, or error







            </label>















            <textarea







              value={code}







              onChange={(e) => setCode(e.target.value)}







              placeholder={`Example:















std::mutex A, B;















void thread1() {







    A.lock();







    B.lock();







}















void thread2() {







    B.lock();







    A.lock();







}`}







              className="min-h-[300px] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-500"







            />















            {error && (







              <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">







                {error}







              </div>







            )}















            <div className="mt-4 flex justify-end">







              <button







                onClick={analyzeCode}







                disabled={loading}







                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"







              >







                {loading ? (







                  <>







                    <Loader2 size={18} className="animate-spin" />







                    Analyzing...







                  </>







                ) : (







                  <>







                    <Brain size={18} />







                    Analyze







                  </>







                )}







              </button>







            </div>







          </div>







        </section>























        {result && (







          <section className="mx-auto mt-8 max-w-5xl space-y-6">















            {result.structuredEvidence && (







              <div className="rounded-2xl border border-amber-900/50 bg-amber-950/10 p-6">







                <div className="mb-6 flex items-center gap-3">







                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">







                    <ShieldCheck size={21} />







                  </div>















                  <div>







                    <h3 className="font-semibold text-amber-400">







                      Deterministic Evidence







                    </h3>















                    <p className="text-sm text-zinc-500">







                      Verified by Night-Owl's analysis engine







                    </p>







                  </div>







                </div>















                <div className="space-y-4">







                  {result.structuredEvidence.checks.map(







                    (check, index) => (







                      <div







                        key={`${check.type}-${index}`}







                        className={`rounded-xl border p-5 ${







                          check.detected







                            ? "border-red-900/50 bg-red-950/10"







                            : "border-zinc-800 bg-zinc-950/50"







                        }`}







                      >







                        <div className="flex items-start gap-4">







                          <div







                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${







                              check.detected







                                ? "bg-red-500/10 text-red-400"







                                : "bg-emerald-500/10 text-emerald-400"







                            }`}







                          >







                            {check.detected ? (







                              <AlertTriangle size={19} />







                            ) : (







                              <CheckCircle2 size={19} />







                            )}







                          </div>















                          <div className="min-w-0 flex-1">







                            <div className="flex flex-wrap items-center justify-between gap-3">







                              <h4 className="font-semibold text-zinc-100">







                                {check.type}







                              </h4>















                              <span







                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${







                                  check.detected







                                    ? "bg-red-500/10 text-red-400"







                                    : "bg-emerald-500/10 text-emerald-400"







                                }`}







                              >







                                {check.detected







                                  ? "Detected"







                                  : "Not detected"}







                              </span>







                            </div>















                            <div className="mt-4">







                              <p className="text-sm font-medium text-zinc-400">







                                Evidence







                              </p>















                              <p className="mt-1 whitespace-pre-wrap font-mono text-sm leading-6 text-zinc-300">







                                {check.details}







                              </p>







                            </div>















                            <div className="mt-4">







                              <p className="text-sm font-medium text-zinc-400">







                                Analyzer Explanation







                              </p>















                              <p className="mt-1 text-sm leading-6 text-zinc-500">







                                {check.explanation}







                              </p>







                            </div>







                          </div>







                        </div>







                      </div>







                    )







                  )}







                </div>







              </div>







            )}























            {!result.structuredEvidence && result.evidence && (







              <div className="rounded-2xl border border-amber-900/50 bg-amber-950/10 p-6">







                <div className="mb-4 flex items-center gap-3">







                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">







                    <ShieldCheck size={21} />







                  </div>















                  <div>







                    <h3 className="font-semibold text-amber-400">







                      Deterministic Evidence







                    </h3>















                    <p className="text-sm text-zinc-500">







                      Evidence detected by Night-Owl's analysis engine







                    </p>







                  </div>







                </div>















                <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-zinc-950 p-5 font-mono text-sm leading-7 text-zinc-300">







                  {result.evidence}







                </pre>







              </div>







            )}























            {result.deadlockGraph?.detected && (







              <div className="rounded-2xl border border-red-900/50 bg-red-950/10 p-6">







                <div className="mb-6 flex items-center gap-3">







                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">







                    <Bug size={21} />







                  </div>















                  <div>







                    <h3 className="font-semibold text-red-400">







                      Deadlock Graph







                    </h3>















                    <p className="text-sm text-zinc-500">







                      Lock acquisition order detected by the analysis engine







                    </p>







                  </div>







                </div>















                <div className="grid gap-6 md:grid-cols-2">















                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">







                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                      Threads







                    </h4>















                    <div className="space-y-4">







                      {result.deadlockGraph.nodes.map((node) => {







                        const threadEdges = result.deadlockGraph!.edges







                          .filter((edge) => edge.from === node.id)







                          .sort((a, b) => a.order - b.order);















                        return (







                          <div







                            key={node.id}







                            className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"







                          >







                            <div className="font-semibold text-zinc-100">







                              {node.id}







                            </div>















                            <div className="mt-3 flex flex-wrap items-center gap-2">







                              {threadEdges.map((edge, index) => (







                                <div







                                  key={`${edge.from}-${edge.to}-${edge.order}`}







                                  className="flex items-center gap-2"







                                >







                                  <span className="rounded-lg border border-amber-900/50 bg-amber-500/10 px-3 py-2 font-mono text-sm text-amber-400">







                                    {edge.to}







                                  </span>















                                  {index < threadEdges.length - 1 && (







                                    <span className="text-zinc-600">







                                      →







                                    </span>







                                  )}







                                </div>







                              ))}







                            </div>







                          </div>







                        );







                      })}







                    </div>







                  </div>























                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">







                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                      Lock Dependencies







                    </h4>















                    <div className="space-y-3">







                      {result.deadlockGraph.edges.map((edge, index) => (







                        <div







                          key={`${edge.from}-${edge.to}-${index}`}







                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3"







                        >







                          <span className="font-mono text-sm text-zinc-300">







                            {edge.from}







                          </span>















                          <span className="text-red-400">







                            →







                          </span>















                          <span className="font-mono text-sm text-amber-400">







                            {edge.to}







                          </span>







                        </div>







                      ))}







                    </div>















                    <div className="mt-5 rounded-xl border border-red-900/40 bg-red-950/20 p-4">







                      <p className="text-sm font-semibold text-red-400">







                        Circular wait detected







                      </p>















                      <p className="mt-1 text-sm leading-6 text-zinc-500">







                        Multiple threads acquire locks in conflicting orders,







                        creating a potential deadlock cycle.







                      </p>







                    </div>







                  </div>







                </div>







              </div>







            )}























            {result.raceGraph?.detected && (







              <div className="rounded-2xl border border-orange-900/50 bg-orange-950/10 p-6">







                <div className="mb-6 flex items-center gap-3">







                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">







                    <Bug size={21} />







                  </div>















                  <div>







                    <h3 className="font-semibold text-orange-400">







                      Race Condition Timeline







                    </h3>















                    <p className="text-sm text-zinc-500">







                      Shared variable accesses detected across thread functions







                    </p>







                  </div>







                </div>























                <div className="mb-6">







                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                    Shared Variables







                  </h4>















                  <div className="flex flex-wrap gap-2">







                    {result.raceGraph.variables.map((variable) => (







                      <span







                        key={variable.id}







                        className="rounded-lg border border-orange-900/50 bg-orange-500/10 px-3 py-2 font-mono text-sm text-orange-400"







                      >







                        {variable.id}







                      </span>







                    ))}







                  </div>







                </div>























                <div>







                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                    Thread Accesses







                  </h4>















                  <div className="space-y-4">







                    {result.raceGraph.accesses.map((access, index) => (







                      <div







                        key={`${access.thread}-${access.variable}-${access.type}-${index}`}







                        className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"







                      >







                        <div className="min-w-[100px] font-mono text-sm font-semibold text-zinc-200">







                          {access.thread}







                        </div>















                        <div className="text-zinc-600">







                          →







                        </div>















                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">







                          {access.variable}







                        </div>















                        <div className="text-zinc-600">







                          →







                        </div>















                        <span







                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${







                            access.type === "write"







                              ? "bg-red-500/10 text-red-400"







                              : "bg-blue-500/10 text-blue-400"







                          }`}







                        >







                          {access.type}







                        </span>







                      </div>







                    ))}







                  </div>







                </div>























                <div className="mt-6 rounded-xl border border-orange-900/40 bg-orange-950/20 p-4">







                  <p className="text-sm font-semibold text-orange-400">







                    ⚠ Unsynchronized shared access detected







                  </p>















                  <p className="mt-1 text-sm leading-6 text-zinc-500">







                    Multiple thread functions access the same shared variable,







                    and at least one access is a write. Without proper







                    synchronization, the final result may depend on thread







                    scheduling.







                  </p>







                </div>







              </div>







            )}























            {result.networkGraph?.detected && (







              <div className="rounded-2xl border border-cyan-900/50 bg-cyan-950/10 p-6">







                <div className="mb-6 flex items-center gap-3">







                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">







                    <Network size={21} />







                  </div>















                  <div>







                    <h3 className="font-semibold text-cyan-400">







                      Network Packet Flow







                    </h3>















                    <p className="text-sm text-zinc-500">







                      Packet delivery and connectivity evidence detected by the analysis engine







                    </p>







                  </div>







                </div>























                <div className="mb-6 flex items-center justify-center gap-3">







                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-center">







                    <div className="text-xs uppercase tracking-wider text-zinc-500">







                      Source







                    </div>















                    <div className="mt-1 font-semibold text-zinc-200">







                      {result.networkGraph.source}







                    </div>







                  </div>















                  <div className="text-cyan-400">







                    →







                  </div>















                  <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-5 py-4 text-center">







                    <div className="text-xs uppercase tracking-wider text-zinc-500">







                      Destination







                    </div>















                    <div className="mt-1 font-semibold text-cyan-300">







                      {result.networkGraph.destination}







                    </div>







                  </div>







                </div>























                <div>







                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                    Packets







                  </h4>















                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">







                    {result.networkGraph.packets.map((packet) => (







                      <div







                        key={packet.id}







                        className={`rounded-xl border p-4 ${







                          packet.status === "success"







                            ? "border-emerald-900/50 bg-emerald-950/20"







                            : "border-red-900/50 bg-red-950/20"







                        }`}







                      >







                        <div className="flex items-center justify-between">







                          <span className="font-mono text-sm text-zinc-400">







                            Packet #{packet.id}







                          </span>















                          <span







                            className={`h-2.5 w-2.5 rounded-full ${







                              packet.status === "success"







                                ? "bg-emerald-400"







                                : "bg-red-400"







                            }`}







                          />







                        </div>















                        <div







                          className={`mt-3 text-sm font-semibold ${







                            packet.status === "success"







                              ? "text-emerald-400"







                              : "text-red-400"







                          }`}







                        >







                          {packet.status === "success"







                            ? "Delivered"







                            : "Lost / Timeout"}







                        </div>















                        {packet.latency !== undefined && (







                          <div className="mt-1 text-xs text-zinc-500">







                            Latency: {packet.latency} ms







                          </div>







                        )}







                      </div>







                    ))}







                  </div>







                </div>























                <div className="mt-6 rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4">







                  <p className="text-sm font-semibold text-cyan-400">







                    Network issue detected







                  </p>















                  <p className="mt-1 text-sm leading-6 text-zinc-500">







                    The packet trace contains evidence of connectivity problems.







                    Review packet loss, latency, timeouts, and routing information







                    to identify the underlying cause.







                  </p>







                </div>







              </div>







            )}























            <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-6">







              <div className="mb-6 flex items-center gap-3">







                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">







                  🦉







                </div>















                <div>







                  <h3 className="font-semibold text-emerald-400">







                    Night-Owl Analysis







                  </h3>















                  <p className="text-sm text-zinc-500">







                    AI-powered root-cause explanation







                  </p>







                </div>







              </div>















              <div className="space-y-5">















                <div className="flex flex-wrap items-center gap-3">







                  <h4 className="text-xl font-bold text-zinc-100">







                    {result.analysis.problem}







                  </h4>















                  <span







                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${severityClass(







                      result.analysis.severity







                    )}`}







                  >







                    {result.analysis.severity}







                  </span>







                </div>























                <div>







                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                    Root Cause







                  </h4>















                  <p className="leading-7 text-zinc-300">







                    {result.analysis.rootCause}







                  </p>







                </div>























                <div>







                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                    Evidence







                  </h4>















                  <p className="leading-7 text-zinc-300">







                    {result.analysis.evidence}







                  </p>







                </div>























                <div>







                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                    Why It Happened







                  </h4>















                  <p className="leading-7 text-zinc-300">







                    {result.analysis.whyItHappened}







                  </p>







                </div>























                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">







                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">







                    Suggested Fix







                  </h4>















                  <p className="leading-7 text-zinc-300">







                    {result.analysis.suggestedFix}







                  </p>







                </div>























                <div>







                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                    Systems Concept







                  </h4>















                  <p className="leading-7 text-zinc-300">







                    {result.analysis.concept}







                  </p>







                </div>























                <div className="rounded-2xl border border-blue-900/50 bg-blue-950/10 p-6">







                  <div className="mb-6 flex items-center gap-3">







                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">







                      📚







                    </div>















                    <div>







                      <h3 className="font-semibold text-blue-400">







                        Exam Mode







                      </h3>















                      <p className="text-sm text-zinc-500">







                        Understand it for exams and viva







                      </p>







                    </div>







                  </div>















                  <div className="space-y-5">















                    <div>







                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                        Definition







                      </h4>















                      <p className="leading-7 text-zinc-300">







                        {result.analysis.examMode.definition}







                      </p>







                    </div>























                    <div>







                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                        Why It Happened







                      </h4>















                      <p className="leading-7 text-zinc-300">







                        {result.analysis.examMode.whyItHappened}







                      </p>







                    </div>























                    <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">







                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-400">







                        Short Exam Answer







                      </h4>















                      <p className="leading-7 text-zinc-300">







                        {result.analysis.examMode.shortExamAnswer}







                      </p>







                    </div>























                    <div>







                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">







                        Viva Questions







                      </h4>















                      <div className="space-y-2">







                        {result.analysis.examMode.vivaQuestions.map(







                          (question, index) => (







                            <div







                              key={index}







                              className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-300"







                            >







                              <span className="mr-2 font-semibold text-blue-400">







                                Q{index + 1}.







                              </span>















                              {question}







                            </div>







                          )







                        )}







                      </div>







                    </div>







                  </div>







                </div>







              </div>







            </div>







          </section>



)}



</>









        )}







      </main>







    </div>







  );







}















function DomainCard({







  icon,







  title,







  description,







  selected,







  onClick,







}: {







  icon: ReactNode;







  title: string;







  description: string;







  selected: boolean;







  onClick: () => void;







}) {







  return (







    <button







      onClick={onClick}







      className={`group rounded-2xl border p-5 text-left transition ${







        selected







          ? "border-amber-500 bg-amber-500/5"







          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900"







      }`}







    >







      <div







        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
          selected
            ? "bg-amber-500/10 text-amber-400"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        {icon}
      </div>
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </button>
  );
}
export default App;