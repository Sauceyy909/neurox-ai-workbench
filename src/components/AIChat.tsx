import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, Sparkles, Trash2, Activity } from 'lucide-react';
import { chatWithAI, generateProgram } from '../services/aiService';
import { useStore } from '../store/useStore';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am Neurox AI. How can I help you with your industrial automation project today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(!process.env.GEMINI_API_KEY);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setFullState, getIOProfile, rows, widgets, variables, devices } = useStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage = messageToSend.trim();
    if (!overrideMessage) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithAI(userMessage, history, { rows, widgets, variables, devices });
      setMessages(prev => [...prev, { role: 'model', text: response || 'No response' }]);
    } catch (error: any) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message || 'Failed to connect to AI'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFromChat = async (prompt: string) => {
    setIsLoading(true);
    try {
      const profile = getIOProfile();
      const result = await generateProgram(prompt, profile);
      setFullState(result.rows, result.widgets);
      setMessages(prev => [...prev, { role: 'model', text: '✅ I have generated the program and HMI layout based on your request. You can see the changes in the Logic and HMI tabs.' }]);
    } catch (error: any) {
      console.error('Generation failed:', error);
      setMessages(prev => [...prev, { role: 'model', text: `❌ Generation failed: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'model', text: 'Chat cleared. How can I help you now?' }]);
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1b1e] rounded-xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Neurox Chat</h3>
            <p className="text-[9px] text-zinc-500">Expert Automation Assistant</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleSend("Can you audit my current ladder logic for any errors or missing interlocks?")}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-500/30"
            title="Audit Logic"
          >
            <Activity size={12} /> Audit
          </button>
          <button 
            onClick={clearChat}
            className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {apiKeyMissing && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
            <p className="text-xs text-red-400 font-bold uppercase tracking-widest mb-1">⚠️ API Key Missing</p>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              The GEMINI_API_KEY is not set. Please add it to your <code className="bg-black px-1 rounded">.env</code> file or environment variables to enable AI features.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 
                ${m.role === 'user' ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/10 text-emerald-500'}`}
              >
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed
                ${m.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-black/40 text-zinc-300 border border-white/5 rounded-tl-none'}`}
              >
                <div className="markdown-body prose prose-invert prose-sm max-w-none">
                  <Markdown>{m.text}</Markdown>
                </div>
                
                {m.role === 'model' && (m.text.toLowerCase().includes('generate') || m.text.includes('apply these changes')) && (
                  <button
                    onClick={() => {
                      // Find the last user message before this model message
                      const userMsgs = messages.slice(0, i).filter(msg => msg.role === 'user');
                      const lastUserPrompt = userMsgs[userMsgs.length - 1]?.text || "";
                      handleGenerateFromChat(lastUserPrompt);
                    }}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Sparkles size={14} /> Generate & Apply Program
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div className="bg-black/40 p-3 rounded-2xl rounded-tl-none border border-white/5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything or describe a program..."
            className="w-full bg-black border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-300 focus:border-emerald-500 outline-none transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[9px] text-zinc-600 mt-2 text-center uppercase tracking-widest">
          Neurox AI can generate logic, HMI, and answer technical questions.
        </p>
      </div>
    </div>
  );
};
