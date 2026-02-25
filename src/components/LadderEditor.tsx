import React from 'react';
import { useStore, ElementType } from '../store/useStore';
import { Plus, Trash2, Settings2, Play, Square } from 'lucide-react';
import { motion } from 'motion/react';

const ELEMENT_ICONS: Record<ElementType, string> = {
  NO_CONTACT: '┤ ├',
  NC_CONTACT: '┤/├',
  COIL: '( )',
  TIMER: '[T]',
  COUNTER: '[C]',
};

export const LadderEditor: React.FC = () => {
  const { rows, addRow, addElement, removeElement, updateElement, variables, isRunMode, getIOProfile } = useStore();
  const profile = getIOProfile();

  return (
    <div className="flex-1 bg-[#1a1b1e] p-6 overflow-auto font-mono">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Ladder Logic Editor</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Main Program Loop</p>
          </div>
          <button 
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm border border-white/5"
          >
            <Plus size={16} /> Add Rung
          </button>
        </div>

        <div className="space-y-4">
          {rows.map((row, rowIndex) => (
            <div key={row.id} className="relative group">
              <div className="flex items-center">
                {/* Left Rail */}
                <div className="w-1 h-24 bg-zinc-700 rounded-full" />
                
                {/* Rung Content */}
                <div className="flex-1 h-24 border-t border-zinc-700 flex items-center px-4 gap-4 relative">
                  <span className="absolute -top-3 left-2 text-[10px] text-zinc-600">RUNG {rowIndex + 1}</span>
                  
                  {row.elements.map((el) => (
                    <motion.div 
                      layout
                      key={el.id}
                      className={`relative w-20 h-16 flex flex-col items-center justify-center border rounded-md cursor-pointer transition-all
                        ${variables[el.variable] ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5'}
                        hover:border-white/30`}
                    >
                      <span className="text-xs text-zinc-400 mb-1">{el.variable}</span>
                      <span className={`text-lg font-bold ${variables[el.variable] ? 'text-emerald-400' : 'text-white'}`}>
                        {ELEMENT_ICONS[el.type]}
                      </span>
                      
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button 
                          onClick={() => removeElement(row.id, el.id)}
                          className="p-1 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                      
                      <select 
                        className="absolute -bottom-6 w-16 bg-zinc-900 border-b border-white/10 text-[10px] text-center text-zinc-500 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                        value={el.variable}
                        onChange={(e) => updateElement(row.id, el.id, { variable: e.target.value })}
                      >
                        <optgroup label="Inputs" className="bg-zinc-900">
                          {profile.inputs.map(v => <option key={v} value={v}>{v}</option>)}
                        </optgroup>
                        <optgroup label="Outputs" className="bg-zinc-900">
                          {profile.outputs.map(v => <option key={v} value={v}>{v}</option>)}
                        </optgroup>
                        <optgroup label="Internal" className="bg-zinc-900">
                          <option value="VAR">VAR</option>
                          <option value="T1">T1</option>
                          <option value="C1">C1</option>
                        </optgroup>
                      </select>
                    </motion.div>
                  ))}

                  <div className="flex gap-2 ml-auto">
                    {(['NO_CONTACT', 'NC_CONTACT', 'COIL', 'TIMER'] as ElementType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => addElement(row.id, type)}
                        className="w-8 h-8 flex items-center justify-center rounded border border-dashed border-white/10 text-zinc-500 hover:text-white hover:border-white/30 transition-all text-[10px]"
                        title={`Add ${type}`}
                      >
                        {ELEMENT_ICONS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Rail */}
                <div className="w-1 h-24 bg-zinc-700 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
