import React from 'react';
import { useStore } from '../store/useStore';
import { Play, Save, Terminal, Cpu, Zap } from 'lucide-react';

export const ArduinoEditor: React.FC = () => {
  const { arduinoCode, setArduinoCode, devices } = useStore();
  const connectedArduino = devices.find(d => d.type === 'ARDUINO' && d.status === 'CONNECTED');

  return (
    <div className="flex-1 bg-[#0f1012] flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 bg-[#151619] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Arduino Uno (Bridge Mode)</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className={connectedArduino ? "text-emerald-500" : "text-zinc-600"} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${connectedArduino ? "text-emerald-500" : "text-zinc-600"}`}>
              {connectedArduino ? `${connectedArduino.address}: Connected` : "No Hardware Detected"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!connectedArduino && (
            <button 
              onClick={() => {
                const deviceTab = document.querySelector('[aria-label="Devices"]') as HTMLElement;
                if (deviceTab) deviceTab.click();
              }}
              className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all"
            >
              Setup Hardware
            </button>
          )}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase tracking-widest transition-all">
            <Save size={14} /> Verify
          </button>
          <button 
            disabled={!connectedArduino}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
          >
            <Play size={14} /> Upload to Board
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor Area */}
        <div className="flex-1 relative bg-[#1a1b1e] p-4">
          <div className="absolute top-0 left-0 w-12 h-full bg-black/20 border-r border-white/5 flex flex-col items-center py-4 text-[10px] font-mono text-zinc-700 select-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="h-6">{i + 1}</div>
            ))}
          </div>
          <textarea
            value={arduinoCode}
            onChange={(e) => setArduinoCode(e.target.value)}
            className="w-full h-full bg-transparent pl-12 text-sm font-mono text-emerald-500/90 outline-none resize-none leading-6 spellcheck-false"
            spellCheck={false}
          />
        </div>

        {/* Console Area */}
        <div className="w-80 bg-[#151619] border-l border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center gap-2 text-zinc-500">
            <Terminal size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Serial Monitor</span>
          </div>
          <div className="flex-1 p-4 font-mono text-[10px] text-zinc-600 space-y-2 overflow-y-auto">
            <div className="text-emerald-500/50">[INFO] Initializing Serial at 9600 baud...</div>
            <div className="text-emerald-500/50">[INFO] Bridge firmware v2.4 detected.</div>
            <div className="text-zinc-500">D13: LOW</div>
            <div className="text-zinc-500">D13: HIGH</div>
            <div className="text-zinc-500">D13: LOW</div>
            <div className="text-zinc-500">D13: HIGH</div>
            <div className="animate-pulse text-emerald-500">_</div>
          </div>
          <div className="p-4 border-t border-white/5">
            <input 
              type="text" 
              placeholder="Send command..."
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[10px] text-zinc-400 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
