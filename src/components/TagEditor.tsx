import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Tag, Database, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TagEditor: React.FC = () => {
  const { variables, addVariable, removeVariable, setVariable } = useStore();
  const [newTagName, setNewTagName] = useState('');
  const [newTagValue, setNewTagValue] = useState('false');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    let val: any = newTagValue;
    if (newTagValue === 'false') val = false;
    if (newTagValue === 'true') val = true;
    if (!isNaN(Number(newTagValue))) val = Number(newTagValue);

    addVariable(newTagName.trim(), val);
    setNewTagName('');
  };

  const filteredTags = Object.entries(variables).filter(([name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#0f1012] p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Tag Database</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Global Variable Management</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              <input 
                type="text" 
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-300 focus:border-emerald-500 outline-none w-64"
              />
            </div>
          </div>
        </div>

        {/* Add New Tag Bar */}
        <div className="bg-[#151619] border border-white/5 rounded-2xl p-4 mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[8px] font-bold text-zinc-600 uppercase mb-2 tracking-widest">Tag Name</label>
            <input 
              type="text" 
              placeholder="e.g. MOTOR_SPEED"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="w-48">
            <label className="block text-[8px] font-bold text-zinc-600 uppercase mb-2 tracking-widest">Initial Value</label>
            <select 
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500 outline-none appearance-none"
            >
              <option value="false">Boolean (False)</option>
              <option value="true">Boolean (True)</option>
              <option value="0">Integer (0)</option>
              <option value="0.0">Float (0.0)</option>
            </select>
          </div>
          <button 
            onClick={handleAddTag}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Add Tag
          </button>
        </div>

        {/* Tags Table */}
        <div className="bg-[#151619] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/5">
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Value</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredTags.map(([name, value]) => (
                  <motion.tr 
                    key={name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-zinc-800 rounded text-zinc-500">
                          <Tag size={12} />
                        </div>
                        <span className="text-sm font-mono text-white">{name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-600">
                        {typeof value === 'boolean' ? 'BOOL' : typeof value === 'number' ? 'REAL' : 'STRING'}
                      </span>
                    </td>
                    <td className="p-4">
                      {typeof value === 'boolean' ? (
                        <button 
                          onClick={() => setVariable(name, !value)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all
                            ${value ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-white/5'}`}
                        >
                          {value ? 'True' : 'False'}
                        </button>
                      ) : (
                        <input 
                          type="number"
                          value={value}
                          onChange={(e) => setVariable(name, parseFloat(e.target.value))}
                          className="bg-black/40 border border-white/5 rounded px-2 py-1 text-xs font-mono text-zinc-400 w-24 focus:border-emerald-500 outline-none"
                        />
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => removeVariable(name)}
                        className="p-2 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredTags.length === 0 && (
            <div className="p-12 text-center">
              <Database className="mx-auto mb-4 opacity-10" size={48} />
              <p className="text-xs text-zinc-600 uppercase tracking-widest">No tags found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
