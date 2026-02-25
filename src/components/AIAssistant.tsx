import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { generateProgram } from '../services/aiService';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';

export const AIAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { setFullState, getIOProfile } = useStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const profile = getIOProfile();
      const result = await generateProgram(prompt, profile);
      setFullState(result.rows, result.widgets);
      setPrompt('');
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate program. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-[#1a1b1e] rounded-xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Neurox AI Assistant</h3>
          <p className="text-[10px] text-zinc-500">Generate logic and HMI with natural language</p>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a water tank control system with a high level sensor, a pump coil, and a dashboard gauge..."
          className="w-full h-32 bg-black border border-white/10 rounded-xl p-4 text-sm text-zinc-300 focus:border-emerald-500 outline-none resize-none transition-all placeholder:text-zinc-700"
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="absolute bottom-4 right-4 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg"
        >
          {isGenerating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <span className="text-xs font-bold px-1">Generate</span>
              <Send size={16} />
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Motor Starter', 'Traffic Light', 'Tank Level', 'VFD Speed Control'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setPrompt(`Create a ${suggestion.toLowerCase()} system`)}
            className="whitespace-nowrap px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
