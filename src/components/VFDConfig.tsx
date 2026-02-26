import React from 'react';
import { useStore } from '../store/useStore';
import { Settings2, Zap, Clock, Maximize2, Save } from 'lucide-react';

export const VFDConfig: React.FC = () => {
  const { simulationData, updateSimulationData } = useStore();

  const handleChange = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateSimulationData({ [key]: num });
    }
  };

  return (
    <div className="flex-1 bg-[#0f1012] p-8 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">VFD Parameter Editor</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Variable Frequency Drive Configuration</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all shadow-lg shadow-emerald-500/20">
            <Save size={14} /> Save to Drive
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParamCard 
            icon={<Clock size={18} />}
            label="Acceleration Time"
            value={simulationData.vfdAccelTime}
            unit="sec"
            onChange={(v) => handleChange('vfdAccelTime', v)}
            description="Time taken to reach maximum frequency from standstill."
          />
          <ParamCard 
            icon={<Clock size={18} />}
            label="Deceleration Time"
            value={simulationData.vfdDecelTime}
            unit="sec"
            onChange={(v) => handleChange('vfdDecelTime', v)}
            description="Time taken to stop from maximum frequency."
          />
          <ParamCard 
            icon={<Maximize2 size={18} />}
            label="Maximum Frequency"
            value={simulationData.vfdMaxFreq}
            unit="Hz"
            onChange={(v) => handleChange('vfdMaxFreq', v)}
            description="The upper limit of the output frequency."
          />
          <ParamCard 
            icon={<Zap size={18} />}
            label="Base Voltage"
            value={480}
            unit="V"
            onChange={() => {}}
            description="Rated voltage of the motor connected to the VFD."
          />
        </div>

        <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Settings2 className="text-blue-400" size={20} />
            <h3 className="font-bold text-white">Advanced Control Mode</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {['V/f Control', 'Vector Control', 'Sensorless Vector'].map((mode) => (
              <button 
                key={mode}
                className={`p-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all
                  ${mode === 'V/f Control' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/5 text-zinc-600 hover:text-zinc-400'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function ParamCard({ icon, label, value, unit, onChange, description }: any) {
  return (
    <div className="bg-[#151619] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-end gap-2 mb-4">
        <input 
          type="number" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-black border border-white/10 rounded-lg px-4 py-2 w-24 text-xl font-mono font-bold text-white focus:border-emerald-500 outline-none"
        />
        <span className="text-sm text-zinc-600 font-bold mb-2">{unit}</span>
      </div>
      <p className="text-[10px] text-zinc-600 leading-relaxed">{description}</p>
    </div>
  );
}
