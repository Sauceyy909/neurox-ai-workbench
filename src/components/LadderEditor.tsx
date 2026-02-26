import React, { useState } from 'react';
import { useStore, ElementType } from '../store/useStore';
import { Plus, Trash2, Settings2, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ELEMENT_ICONS: Record<ElementType, string> = {
  NO_CONTACT: '┤ ├',
  NC_CONTACT: '┤/├',
  COIL: '( )',
  TON: '[TON]',
  TOF: '[TOF]',
  CTU: '[CTU]',
  CTD: '[CTD]',
  MOVE: '[MOV]',
  ADD: '[ADD]',
  SUB: '[SUB]',
  BRANCH_START: '┬',
  BRANCH_END: '┴',
};

export const LadderEditor: React.FC = () => {
  const { rows, addRow, addElement, removeElement, updateElement, variables, isRunMode, getIOProfile } = useStore();
  const profile = getIOProfile();
  const [editingElement, setEditingElement] = useState<{ rowId: string, elId: string } | null>(null);

  const elementTypes: ElementType[] = [
    'NO_CONTACT', 'NC_CONTACT', 'COIL', 'TON', 'TOF', 'CTU', 'CTD', 'MOVE', 'ADD', 'SUB'
  ];

  const allVariables = [
    ...profile.inputs,
    ...profile.outputs,
    ...profile.analogs,
    ...Object.keys(variables).filter(v => !profile.inputs.includes(v) && !profile.outputs.includes(v) && !profile.analogs.includes(v))
  ];

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
                <div className="w-1 h-32 bg-zinc-700 rounded-full" />
                
                {/* Rung Content */}
                <div className="flex-1 h-32 border-t border-zinc-700 flex items-center px-4 gap-4 relative">
                  <span className="absolute -top-3 left-2 text-[10px] text-zinc-600">RUNG {rowIndex + 1}</span>
                  
                  {row.elements
                    .filter(el => !row.elements.some(parent => parent.parallel?.includes(el.id)))
                    .map((el) => (
                    <div key={el.id} className="relative">
                      <motion.div 
                        layout
                        className={`relative w-20 h-16 flex flex-col items-center justify-center border rounded-md cursor-pointer transition-all
                          ${variables[el.variable] ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5'}
                          hover:border-white/30`}
                      >
                        <span className="text-xs text-zinc-400 mb-1">{el.variable}</span>
                        <span className={`text-lg font-bold ${variables[el.variable] ? 'text-emerald-400' : 'text-white'}`}>
                          {ELEMENT_ICONS[el.type]}
                        </span>
                        
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                          <button 
                            onClick={() => setEditingElement({ rowId: row.id, elId: el.id })}
                            className="p-1 bg-blue-500/20 hover:bg-blue-500/40 rounded text-blue-400"
                            title="Edit Parameters"
                          >
                            <Settings2 size={10} />
                          </button>
                          <button 
                            onClick={() => useStore.getState().addParallelElement(row.id, el.id, 'NO_CONTACT')}
                            className="p-1 bg-emerald-500/20 hover:bg-emerald-500/40 rounded text-emerald-400"
                            title="Add Holding Contact"
                          >
                            <Plus size={10} />
                          </button>
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
                          <optgroup label="I/O & Tags" className="bg-zinc-900">
                            {allVariables.map(v => <option key={v} value={v}>{v}</option>)}
                          </optgroup>
                        </select>
                      </motion.div>

                      {/* Parameter Editor Modal/Popover */}
                      <AnimatePresence>
                        {editingElement?.elId === el.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-0 left-24 z-50 w-48 bg-[#151619] border border-white/10 rounded-xl p-4 shadow-2xl"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">{el.type} Params</span>
                              <button onClick={() => setEditingElement(null)} className="text-zinc-600 hover:text-white">
                                <Plus size={12} className="rotate-45" />
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(el.type === 'TON' || el.type === 'TOF' || el.type === 'CTU' || el.type === 'CTD') && (
                                <div>
                                  <label className="block text-[8px] text-zinc-600 uppercase mb-1">Preset Value</label>
                                  <input 
                                    type="number"
                                    value={el.params?.preset || 0}
                                    onChange={(e) => updateElement(row.id, el.id, { params: { ...el.params, preset: parseInt(e.target.value) } })}
                                    className="w-full bg-black border border-white/5 rounded px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                                  />
                                </div>
                              )}
                              {el.type === 'MOVE' && (
                                <div>
                                  <label className="block text-[8px] text-zinc-600 uppercase mb-1">Source Value</label>
                                  <input 
                                    type="number"
                                    value={el.params?.source || 0}
                                    onChange={(e) => updateElement(row.id, el.id, { params: { ...el.params, source: parseFloat(e.target.value) } })}
                                    className="w-full bg-black border border-white/5 rounded px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="block text-[8px] text-zinc-600 uppercase mb-1">Tag/Variable</label>
                                <select 
                                  value={el.variable}
                                  onChange={(e) => updateElement(row.id, el.id, { variable: e.target.value })}
                                  className="w-full bg-black border border-white/5 rounded px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                                >
                                  {allVariables.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Parallel Elements Rendering */}
                      {el.parallel && el.parallel.length > 0 && (
                        <div className="absolute top-16 left-0 w-full flex flex-col items-center">
                          <div className="w-px h-4 bg-zinc-700" />
                          {el.parallel.map(pId => {
                            const pEl = row.elements.find(e => e.id === pId);
                            if (!pEl) return null;
                            return (
                              <div key={pId} className="relative mt-2">
                                <div className={`w-20 h-16 flex flex-col items-center justify-center border rounded-md cursor-pointer transition-all
                                  ${variables[pEl.variable] ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5'}
                                  hover:border-white/30`}
                                >
                                  <span className="text-xs text-zinc-400 mb-1">{pEl.variable}</span>
                                  <span className={`text-lg font-bold ${variables[pEl.variable] ? 'text-emerald-400' : 'text-white'}`}>
                                    {ELEMENT_ICONS[pEl.type]}
                                  </span>
                                  <button 
                                    onClick={() => removeElement(row.id, pEl.id)}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-1 ml-auto max-w-[200px] justify-end">
                    {elementTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => addElement(row.id, type)}
                        className="w-10 h-8 flex items-center justify-center rounded border border-dashed border-white/10 text-zinc-500 hover:text-white hover:border-white/30 transition-all text-[9px] bg-black/20"
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
