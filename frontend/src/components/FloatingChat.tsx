import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, X, MessageSquare, Trash2, Download, Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_REPLIES = [
  "How do I verify a news link?",
  "What is considered fake news?",
  "Why is my verification unverified?",
  "Are you 100% accurate?"
];

export default function FloatingChat({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const location = useLocation();
  const { user } = useAuth();
  const verificationId = location.pathname.match(/\/result\/([a-zA-Z0-9]+)/)?.[1];
  
  // User-specific storage key so chats don't leak between accounts
  const storageKey = `tl_chat_${user?.id ?? 'anon'}_${verificationId ?? 'general'}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{
      role: 'assistant',
      content: `### 👋 Welcome to TruthLens AI

I am your fact-checking assistant. Here is how you can use me:

**1. Explain a Verification**
If you just checked a headline, ask me *"Why was this marked as false?"*

**2. Ask About Sources**
Ask me *"Is the BBC a reliable source?"*

**3. Paste a Headline**
Type any headline to get a quick fact-check based on my knowledge.`
    }];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function clearChat() {
    if (!confirm('Clear this chat?')) return;
    const init: Message[] = [{ role: 'assistant', content: 'Chat cleared. Ask me something new.' }];
    setMessages(init);
    localStorage.setItem(storageKey, JSON.stringify(init));
  }

  function saveChat() {
    const text = messages.map(m => `${m.role === 'user' ? 'You' : 'TruthLens'}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truthlens-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await api<{ reply: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: next, context: verificationId }),
      });
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setMessages([...next, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:scale-105 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        aria-label="Open AI chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-40 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 ${
      expanded ? 'h-[85vh] w-[90vw] max-w-3xl' : 'h-[600px] w-[400px]'
    }`}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">TruthLens AI</p>
            <p className="text-[10px] text-slate-500">Fact-checking assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={saveChat} title="Save chat" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={clearChat} title="Clear chat" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={() => setExpanded(!expanded)} title="Expand" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen(false)} title="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-200'
            }`}>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-code:text-xs prose-pre:bg-slate-900 prose-pre:text-slate-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
            {m.role === 'user' && (
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 dark:bg-slate-700">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce" style={{animationDelay: '0.1s'}}>·</span>
                <span className="animate-bounce" style={{animationDelay: '0.2s'}}>·</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies (Only show if there are few messages) */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {QUICK_REPLIES.map((reply, i) => (
            <button
              key={i}
              onClick={() => sendMessage(reply)}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about any news..."
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-300"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-slate-900 p-2 text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}