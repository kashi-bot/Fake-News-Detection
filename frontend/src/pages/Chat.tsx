import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, Bot, User, ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const { id } = useParams();
  const storageKey = `tl_chat_${id ?? 'default'}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { role: 'assistant', content: 'Hi! I am your TruthLens AI assistant. Ask me anything about this verification result, or paste a new headline to check.' }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function clearChat() {
    if (!confirm('Clear all chat messages?')) return;
    const initial: Message[] = [{ role: 'assistant', content: 'Chat cleared. Ask me something new.' }];
    setMessages(initial);
    localStorage.setItem(storageKey, JSON.stringify(initial));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await api<{ reply: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: next, context: id }),
      });
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setMessages([...next, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between gap-3 border-b p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link to={id ? `/app/result/${id}` : '/app'} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Bot className="h-5 w-5 text-blue-600" />
          <h1 className="text-sm font-semibold">TruthLens AI Chat</h1>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Trash2 className="h-3 w-3" /> Clear
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
              m.role === 'user'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 dark:bg-slate-700">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-500 dark:bg-slate-800">
              TruthLens is thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t p-4 dark:border-slate-800">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about this news..."
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-slate-900 focus:outline-none disabled:opacity-50 dark:border-slate-700"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-slate-900 p-2 text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}