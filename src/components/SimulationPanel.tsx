import React from 'react';
import { useStore } from '../store/useStore';
import { Activity, Zap, Gauge, Thermometer, Info } from 'lucide-react';
import { motion } from 'motion/react';

export const SimulationPanel: React.FC = () => {
  const { simulationData, variables, isSimulationMode, getIOProfile } = useStore();
  const profile = getIOProfile();
  const relevantIO = [...profile.inputs, ...profile.outputs];

  if (!isSimulationMode) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-zinc-500">
        <div className="text-center">
          <Info className="mx-auto mb-4 opacity-20" size={48} />
          <p className="text-sm uppercase tracking-widest font-bold">Simulation Mode Disabled</p>
          <p className="text-[10px] mt-2 opacity-50">Connect to physical hardware to view real-time data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] p-8 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Virtual Environment</h2>
            <p className="text-[10px] text-emerald-500 uppercase tracking-widest mt-1">Real-time Physics Simulation Active</p>
          </div>
          <div className="flex gap-4">
            <StatBlock label="CPU Load" value="1.2%" />
            <StatBlock label="Latency" value="2ms" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VFD Simulation */}
          <div className="bg-[#151619] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Zap size={20} />
              </div>
              <h3 className="font-bold text-white">VFD Simulator</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Frequency</span>
                  <span className="text-2xl font-mono font-bold text-blue-400">{simulationData.vfdFrequency.toFixed(1)} Hz</span>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Current</span>
                  <span className="text-2xl font-mono font-bold text-amber-400">{simulationData.vfdCurrent.toFixed(2)} A</span>
                </div>
              </div>

              <div className="relative pt-4">
                <div className="flex justify-between text-[10px] text-zinc-500 uppercase mb-2">
                  <span>Motor Speed</span>
                  <span>{simulationData.vfdSpeed.toFixed(0)} RPM</span>
                </div>
                <div className="h-2 bg-black rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500"
                    animate={{ width: `${(simulationData.vfdSpeed / 1800) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* I/O Status */}
          <div className="bg-[#151619] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Activity size={20} />
              </div>
              <h3 className="font-bold text-white">I/O Monitor</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {relevantIO.map((key) => {
                const value = variables[key];
                return (
                  <div key={key} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5">
                    <span className="text-xs font-mono text-zinc-400">{key}</span>
                    <div className={`w-3 h-3 rounded-full ${value ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-800'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Process Visualization */}
        <div className="bg-[#151619] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Gauge size={20} />
            </div>
            <h3 className="font-bold text-white">Process Dynamics</h3>
          </div>
          
          <div className="h-32 flex items-end gap-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-purple-500/20 rounded-t-sm"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-4 text-center uppercase tracking-widest">Simulated Process Load (Stochastic Model)</p>
        </div>
      </div>
    </div>
  );
};

function StatBlock({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-right">
      <span className="text-[8px] text-zinc-600 uppercase block">{label}</span>
      <span className="text-xs font-bold text-zinc-400">{value}</span>
    </div>
  );
}
