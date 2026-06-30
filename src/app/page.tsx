'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type Role = 'user' | 'assistant' | 'system';

interface Message {
  id: string;
  role: Role;
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const MODELS = [
  { value: 'phi3.5', label: 'Phi-3.5 (base)' },
  { value: 'phi3.5-financial', label: 'Phi-3.5-Financial' },
  { value: 'qwen2.5:3b', label: 'Qwen 2.5 3B' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'tinyllama', label: 'TinyLlama' },
];

const SERVERS = [
  { value: 'http://localhost:11434', label: 'Ollama (11434)' },
  { value: 'http://localhost:8000', label: 'Triton (8000)' },
];

const SYSTEM_PROMPT =
  'You are a professional financial AI assistant for TechCorp Industries. ' +
  'You provide accurate, concise, and insightful analysis on financial topics, ' +
  'market trends, investment strategies, and business intelligence. ' +
  'Always be professional, data-driven, and clear in your responses.';

const SUGGESTIONS = [
  'Analyse le marché des actions tech en 2024',
  'Explique le concept de diversification de portefeuille',
  "Quels sont les indicateurs clés d'une bonne santé financière ?",
  'Compare les stratégies value vs growth investing',
];

const STORAGE_KEY = 'techcorp-conversations';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function makeTitle(text: string) {
  return text.length > 38 ? text.slice(0, 38) + '…' : text;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [model, setModel] = useState(MODELS[1].value);
  const [serverUrl, setServerUrl] = useState(SERVERS[0].value);
  const [customServer, setCustomServer] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeConvIdRef = useRef<string | null>(null);

  const effectiveServer = customServer.trim() || serverUrl;

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConversations(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist conversations
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function startNewChat() {
    setMessages([]);
    setActiveConvId(null);
    activeConvIdRef.current = null;
    setIsEphemeral(false);
    setError(null);
    setInput('');
  }

  function startEphemeralChat() {
    setMessages([]);
    setActiveConvId(null);
    activeConvIdRef.current = null;
    setIsEphemeral(true);
    setError(null);
    setInput('');
  }

  function loadConversation(conv: Conversation) {
    if (isLoading) return;
    setMessages(conv.messages);
    setActiveConvId(conv.id);
    activeConvIdRef.current = conv.id;
    setIsEphemeral(false);
    setError(null);
    setInput('');
  }

  function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvIdRef.current === id) {
      setMessages([]);
      setActiveConvId(null);
      activeConvIdRef.current = null;
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);
    const userMsg: Message = { id: uid(), role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setIsLoading(true);

    // Create conversation entry on first message (non-ephemeral)
    let convId = activeConvIdRef.current;
    if (!isEphemeral && !convId) {
      const newId = uid();
      convId = newId;
      setActiveConvId(newId);
      activeConvIdRef.current = newId;
      const newConv: Conversation = {
        id: newId,
        title: makeTitle(text),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
    }

    const assistantId = uid();
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    let fullContent = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          serverUrl: effectiveServer,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
        );
      }

      // Save completed conversation
      if (!isEphemeral && convId) {
        const finalMessages: Message[] = [
          ...history,
          { id: assistantId, role: 'assistant', content: fullContent },
        ];
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, isEphemeral, model, effectiveServer]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-full bg-gray-950 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-200 shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-2 px-3 py-4 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            TC
          </div>
          <span className="text-sm font-semibold text-white truncate">TechCorp AI</span>
        </div>

        {/* Action buttons */}
        <div className="px-2 space-y-1 shrink-0">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle conversation
          </button>
          <button
            onClick={startEphemeralChat}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isEphemeral
                ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Chat éphémère
          </button>
        </div>

        <div className="mx-3 my-3 border-t border-gray-800" />

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 space-y-0.5">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-600 px-3 py-2">Aucune conversation</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                disabled={isLoading}
                className={`w-full group flex items-start justify-between gap-1 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeConvId === conv.id && !isEphemeral
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-snug">{conv.title}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{formatDate(conv.updatedAt)}</p>
                </div>
                <span
                  role="button"
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-600 hover:text-red-400 transition-all shrink-0 mt-0.5"
                  title="Supprimer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {isEphemeral && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-purple-300 bg-purple-900/30 border border-purple-700/40 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Éphémère — non archivé
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="text-xs bg-gray-800 border border-gray-700 rounded-md px-2 py-1.5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowSettings((s) => !s)}
              className={`p-1.5 rounded-md transition-colors ${
                showSettings ? 'text-blue-400 bg-blue-900/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
              title="Paramètres serveur"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Settings panel */}
        {showSettings && (
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 shrink-0">
            <p className="text-xs font-medium text-gray-400 mb-2">Serveur d&apos;inférence</p>
            <div className="flex items-center gap-2 flex-wrap">
              {SERVERS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setServerUrl(s.value); setCustomServer(''); }}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    effectiveServer === s.value && !customServer
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <input
                type="text"
                placeholder="URL personnalisée…"
                value={customServer}
                onChange={(e) => setCustomServer(e.target.value)}
                className="text-xs bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-48"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Actif : <span className="text-gray-400 font-mono">{effectiveServer}</span>
            </p>
          </div>
        )}

        {/* Messages */}
        <main className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
                isEphemeral
                  ? 'bg-purple-600/20 border-purple-500/30'
                  : 'bg-blue-600/20 border-blue-500/30'
              }`}>
                <svg className={`w-8 h-8 ${isEphemeral ? 'text-purple-400' : 'text-blue-400'}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isEphemeral ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  )}
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-200">
                  {isEphemeral ? 'Chat éphémère' : 'Phi-3.5-Financial'}
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  {isEphemeral
                    ? 'Cette conversation ne sera pas sauvegardée.'
                    : "Posez vos questions sur la finance, les marchés ou l'analyse business."}
                </p>
              </div>
              {!isEphemeral && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="text-left text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 hover:border-gray-600 hover:text-gray-200 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.role === 'user'
                  ? isEphemeral ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {msg.role === 'user' ? 'U' : 'AI'}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? isEphemeral
                    ? 'bg-purple-700 text-white rounded-tr-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-800 text-gray-100 rounded-tl-sm'
              }`}>
                {msg.content === '' && isLoading ? (
                  <span className="flex items-center gap-1 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                ) : (
                  <span className="whitespace-pre-wrap">
                    {msg.content}
                    {msg.role === 'assistant' && isLoading && msg.content && (
                      <span className="cursor-blink" />
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-2 bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-300">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <footer className="px-4 py-4 bg-gray-900 border-t border-gray-800 shrink-0">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isEphemeral
                  ? 'Chat éphémère — non archivé…'
                  : 'Posez votre question… (Entrée pour envoyer)'
              }
              rows={1}
              className={`flex-1 resize-none border rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent overflow-y-auto scrollbar-thin bg-gray-800 ${
                isEphemeral
                  ? 'border-purple-700/50 focus:ring-purple-500'
                  : 'border-gray-700 focus:ring-blue-500'
              }`}
              style={{ minHeight: '46px', maxHeight: '160px' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 160) + 'px';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 ${
                isEphemeral ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-2">
            {model} &middot; <span className="font-mono">{effectiveServer}</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
