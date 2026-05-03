import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDocuments,
  useDeleteDocument,
  useGetDocument,
  useListDocumentMessages,
  useClearDocumentMessages,
  getListDocumentsQueryKey,
  getListDocumentMessagesQueryKey
} from "@workspace/api-client-react";
import {
  FileText,
  Plus,
  Trash2,
  MessageSquare,
  Send,
  MoreVertical,
  Menu,
  Loader2,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: documents, isLoading: isLoadingDocs } = useListDocuments({
    query: { queryKey: getListDocumentsQueryKey() }
  });

  useEffect(() => {
    if (documents && documents.length > 0 && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [documents, activeDocId]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f0f4ff]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-72 flex-col bg-sidebar border-r border-sidebar-border" style={{ boxShadow: "2px 0 20px rgba(0,0,0,0.08)" }}>
        <SidebarContent
          documents={documents}
          activeDocId={activeDocId}
          setActiveDocId={setActiveDocId}
          isLoading={isLoadingDocs}
        />
      </div>

      {/* Mobile Header */}
      <div className="flex md:hidden flex-col absolute top-0 left-0 right-0 z-10 bg-sidebar border-b border-sidebar-border h-14">
        <div className="flex items-center justify-between h-full px-4">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0">
              <SidebarContent
                documents={documents}
                activeDocId={activeDocId}
                setActiveDocId={(id: number) => { setActiveDocId(id); setIsMobileOpen(false); }}
                isLoading={isLoadingDocs}
              />
            </SheetContent>
          </Sheet>
          <div className="font-semibold text-sm text-sidebar-foreground flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#1565C0]" />
            Sitare University
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col pt-14 md:pt-0 min-w-0">
        {documents?.length === 0 ? (
          <EmptyState />
        ) : activeDocId ? (
          <ChatArea documentId={activeDocId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a topic to start asking questions.
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarContent({ documents, activeDocId, setActiveDocId, isLoading }: any) {
  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1565C0, #1976D2)", boxShadow: "0 4px 14px rgba(21,101,192,0.4)" }}
          >
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground text-sm leading-tight tracking-tight">Sitare University</h2>
            <p className="text-[10px] text-sidebar-foreground/40 leading-tight mt-0.5">Student Q&A Assistant</p>
          </div>
        </div>

        <Link href="/upload">
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, #1565C0, #1976D2)", boxShadow: "0 4px 12px rgba(21,101,192,0.35)" }}
          >
            <Plus className="h-4 w-4" />
            Add Document
          </button>
        </Link>
      </div>

      {/* Section label */}
      <div className="mx-5 mb-2">
        <div className="h-px bg-sidebar-border/50 mb-3" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 px-1">
          Topics
        </p>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 pb-4">
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground/30" />
            </div>
          ) : documents?.map((doc: any) => (
            <button
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-150 text-left group ${
                activeDocId === doc.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/55 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                activeDocId === doc.id
                  ? "bg-[#1565C0]/20 text-[#1565C0]"
                  : "bg-sidebar-accent/60 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60"
              }`}>
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span className="truncate leading-snug">{doc.name}</span>
              {activeDocId === doc.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1565C0] shrink-0" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border/50">
        <p className="text-[10px] text-sidebar-foreground/25 text-center leading-relaxed">
          Powered by AI · Answers based on<br />official university documents only
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
      <div
        className="p-5 rounded-2xl mb-5"
        style={{ background: "linear-gradient(135deg, rgba(21,101,192,0.12), rgba(25,118,210,0.08))" }}
      >
        <BookOpen className="h-9 w-9 text-[#1565C0]" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">No documents yet</h3>
      <p className="text-muted-foreground max-w-sm mb-7 text-sm leading-relaxed">
        Add university documents to enable Q&A for students and staff.
      </p>
      <Link href="/upload">
        <button
          className="flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: "linear-gradient(135deg, #1565C0, #1976D2)", boxShadow: "0 4px 12px rgba(21,101,192,0.35)" }}
        >
          <Plus className="h-4 w-4" />
          Add Document
        </button>
      </Link>
    </div>
  );
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  "About Sitare University": [
    "Who founded Sitare University and when?",
    "What is Sitare University's mission?",
    "Where is Sitare University located?",
    "Why should I choose Sitare University?",
  ],
  "Admissions 2026": [
    "How do I apply for the 2026 intake?",
    "Who is eligible to apply at Sitare University?",
    "Is there financial support for students?",
    "What is the application portal link?",
  ],
  "Programs & Curriculum": [
    "What degree does Sitare University offer?",
    "When do students start their paid internships?",
    "What happens during the final year?",
    "How is the curriculum different from other universities?",
  ],
  "Campus Life & Facilities": [
    "Does Sitare University have hostels?",
    "What sports and clubs are available?",
    "What dining facilities are on campus?",
    "What does campus life look like at Sitare?",
  ],
  "Placements & Industry Partners": [
    "Which companies are Sitare's industry partners?",
    "How does the placement process work?",
    "Do students get paid during internships?",
    "What sectors do Sitare's partner companies cover?",
  ],
};

function ChatArea({ documentId }: { documentId: number }) {
  const { data: document } = useGetDocument(documentId);
  const { data: messages } = useListDocumentMessages(documentId, {
    query: { queryKey: getListDocumentMessagesQueryKey(documentId) }
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteDoc = useDeleteDocument();
  const clearMsgs = useClearDocumentMessages();

  const [question, setQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingAnswer, isTyping]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const submitQuestion = async (q: string) => {
    if (!q.trim() || isStreaming || isTyping) return;
    setQuestion("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsTyping(true);
    setStreamingAnswer("");

    queryClient.setQueryData(getListDocumentMessagesQueryKey(documentId), (old: any) => [
      ...(old || []),
      { id: Date.now(), documentId, role: "user", content: q, createdAt: new Date().toISOString() }
    ]);

    try {
      const response = await fetch(`/api/documents/${documentId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      setIsTyping(false);
      setIsStreaming(true);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) { fullAnswer += data.content; setStreamingAnswer(fullAnswer); }
              if (data.done) {
                setIsStreaming(false);
                queryClient.invalidateQueries({ queryKey: getListDocumentMessagesQueryKey(documentId) });
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch {
      setIsTyping(false);
      setIsStreaming(false);
      toast({ title: "Error", description: "Failed to connect to the assistant.", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitQuestion(question); }
  };

  const handleClear = () => {
    clearMsgs.mutate({ id: documentId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentMessagesQueryKey(documentId) });
        toast({ title: "Chat history cleared" });
      }
    });
  };

  const handleDelete = () => {
    deleteDoc.mutate({ id: documentId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "Document deleted" });
      }
    });
  };

  const hasMessages = (messages?.length ?? 0) > 0 || isTyping || isStreaming;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 relative">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3.5 z-10 shrink-0"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(21,101,192,0.10)" }}>
            <FileText className="h-4 w-4 text-[#1565C0]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate text-foreground leading-tight">
              {document?.name ?? <span className="inline-block h-4 w-40 bg-muted animate-pulse rounded" />}
            </h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Sitare University · AI-powered Q&A</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 rounded-xl hover:bg-muted">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleClear} disabled={clearMsgs.isPending}>
              <MessageSquare className="mr-2 h-4 w-4" />Clear History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} disabled={deleteDoc.isPending} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Delete Document
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-2xl mx-auto px-4 md:px-6 pt-6 pb-4 space-y-5">

          {/* Empty state with suggestions */}
          {!hasMessages && (
            <div className="flex flex-col items-center pt-8 pb-4 animate-in fade-in duration-500">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, #1565C0, #1976D2)", boxShadow: "0 8px 24px rgba(21,101,192,0.3)" }}
              >
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">How can I help you?</p>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs leading-relaxed">
                Ask anything about this topic, or try a suggestion below.
              </p>

              {document?.name && SUGGESTED_QUESTIONS[document.name] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                  {SUGGESTED_QUESTIONS[document.name].map((q) => (
                    <button
                      key={q}
                      onClick={() => submitQuestion(q)}
                      className="suggestion-card text-left px-4 py-3.5 rounded-2xl text-sm leading-snug text-foreground"
                      style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#1565C0" }}>
                        Ask
                      </span>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages?.map((msg: any, i: number) => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} index={i} />
          ))}

          {isTyping && (
            <div className="flex items-end gap-3 message-in">
              <div className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1565C0, #1976D2)" }}>
                <GraduationCap className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="flex gap-1.5 items-center h-4">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#1565C0", opacity: 0.5 }} />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#1565C0", opacity: 0.5 }} />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#1565C0", opacity: 0.5 }} />
                </div>
              </div>
            </div>
          )}

          {isStreaming && <MessageBubble role="assistant" content={streamingAnswer} index={-1} streaming />}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 px-4 md:px-6 py-4" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderTop: "1px solid #e2e8f0" }}>
        <div className="max-w-2xl mx-auto">
          <div
            className="flex items-end gap-2 rounded-2xl px-4 py-2.5 transition-shadow focus-within:shadow-md"
            style={{ background: "#fff", border: "1.5px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={question}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Sitare University… (Enter to send)"
              disabled={isStreaming || isTyping}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed py-1"
              style={{ maxHeight: "120px", minHeight: "24px" }}
            />
            <button
              type="button"
              onClick={() => submitQuestion(question)}
              disabled={!question.trim() || isStreaming || isTyping}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{
                background: question.trim() && !isStreaming && !isTyping ? "linear-gradient(135deg, #1565C0, #1976D2)" : "#f1f5f9",
                boxShadow: question.trim() && !isStreaming && !isTyping ? "0 2px 8px rgba(21,101,192,0.35)" : "none",
              }}
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
            Answers are based solely on official Sitare University documents.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content, index, streaming }: { role: string; content: string; index: number; streaming?: boolean }) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-3 message-in ${isUser ? "flex-row-reverse" : ""}`} style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}>
      <div
        className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0"
        style={isUser
          ? { background: "#e8edf5", color: "#334155" }
          : { background: "linear-gradient(135deg, #1565C0, #1976D2)" }
        }
      >
        {isUser
          ? <span className="text-[10px] font-bold text-[#334155]">You</span>
          : <GraduationCap className="h-3.5 w-3.5 text-white" />
        }
      </div>
      <div
        className={`relative px-4 py-3 text-sm max-w-[78%] leading-relaxed ${isUser ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}
        style={isUser
          ? { background: "linear-gradient(135deg, #1565C0, #1976D2)", color: "white", boxShadow: "0 4px 12px rgba(21,101,192,0.3)" }
          : { background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0", color: "#0f172a", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }
        }
      >
        <div className="whitespace-pre-wrap">
          {content === "Information not available." ? (
            <span className="italic opacity-70">I couldn't find that information in the document.</span>
          ) : content}
        </div>
        {streaming && (
          <span className="inline-block w-0.5 h-4 ml-0.5 rounded-full align-middle" style={{ background: "#1565C0", animation: "pulse 1s ease-in-out infinite" }} />
        )}
      </div>
    </div>
  );
}
