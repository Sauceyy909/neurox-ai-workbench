import React, { useRef } from 'react';
import { useStore, HMIWidget } from '../store/useStore';
import Draggable from 'react-draggable';
import { MousePointer2, Layout, Settings, Trash2, Plus } from 'lucide-react';

const DraggableWidget: React.FC<{ 
  widget: HMIWidget; 
  updateWidget: (id: string, updates: Partial<HMIWidget>) => void;
  removeWidget: (id: string) => void;
  renderWidget: (widget: HMIWidget) => React.ReactNode;
  profile: any;
}> = ({ widget, updateWidget, removeWidget, renderWidget, profile }) => {
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      defaultPosition={{ x: widget.x, y: widget.y }}
      onStop={(_, data) => updateWidget(widget.id, { x: data.x, y: data.y })}
    >
      <div 
        ref={nodeRef}
        className="absolute group cursor-move" 
        style={{ width: widget.type === 'GAUGE' ? 120 : 100, height: widget.type === 'GAUGE' ? 120 : 60 }}
      >
        <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-zinc-900 p-1 rounded border border-white/10 z-20">
          <select 
            className="bg-transparent text-[10px] text-white w-20 focus:outline-none appearance-none cursor-pointer"
            value={widget.variable}
            onChange={(e) => updateWidget(widget.id, { variable: e.target.value })}
          >
            <optgroup label="Inputs" className="bg-zinc-900">
              {profile.inputs.map((v: string) => <option key={v} value={v}>{v}</option>)}
            </optgroup>
            <optgroup label="Outputs" className="bg-zinc-900">
              {profile.outputs.map((v: string) => <option key={v} value={v}>{v}</option>)}
            </optgroup>
            <optgroup label="Internal" className="bg-zinc-900">
              <option value="VAR">VAR</option>
              <option value="T1">T1</option>
              <option value="C1">C1</option>
            </optgroup>
          </select>
          <button onClick={() => removeWidget(widget.id)} className="text-red-400 hover:text-red-300">
            <Trash2 size={12} />
          </button>
        </div>
        {renderWidget(widget)}
      </div>
    </Draggable>
  );
};

export const HMIBuilder: React.FC = () => {
  const { widgets, addWidget, updateWidget, removeWidget, variables, setVariable, getIOProfile } = useStore();
  const profile = getIOProfile();

  const renderWidget = (widget: HMIWidget) => {
    const value = variables[widget.variable];

    switch (widget.type) {
      case 'BUTTON':
        return (
          <button
            onMouseDown={() => setVariable(widget.variable, true)}
            onMouseUp={() => setVariable(widget.variable, false)}
            className={`w-full h-full rounded-lg border-2 flex items-center justify-center font-bold transition-all active:scale-95
              ${value ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
          >
            {widget.label}
          </button>
        );
      case 'LED':
        return (
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full border-2 transition-all
              ${value ? 'bg-red-500 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-zinc-900 border-zinc-800'}`} 
            />
            <span className="text-[10px] text-zinc-500 uppercase font-bold">{widget.label}</span>
          </div>
        );
      case 'GAUGE':
        const percent = Math.min(100, Math.max(0, (Number(value) || 0)));
        return (
          <div className="w-full h-full bg-zinc-900 rounded-xl border border-white/5 p-3 flex flex-col items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#27272a" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8" 
                  strokeDasharray={`${percent * 2.51} 251`}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-lg font-bold text-white">{value || 0}</span>
                <span className="text-[8px] text-zinc-500 uppercase">{widget.label}</span>
              </div>
            </div>
          </div>
        );
      case 'TEXT':
        return (
          <div className="w-full h-full bg-black border border-zinc-800 rounded p-2 flex items-center justify-center">
            <span className="text-emerald-500 font-mono text-xl tracking-tighter">
              {String(value ?? '---')}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-[#0f1012] relative overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="h-14 bg-[#151619] border-b border-white/5 flex items-center px-6 gap-6 z-10">
        <div className="flex items-center gap-2 text-zinc-400">
          <Layout size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">HMI Canvas</span>
        </div>
        
        <div className="h-6 w-px bg-white/5" />
        
        <div className="flex gap-2">
          {(['BUTTON', 'LED', 'GAUGE', 'TEXT'] as const).map((type) => (
            <button
              key={type}
              onClick={() => addWidget(type)}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-bold border border-white/5 transition-colors"
            >
              + {type}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-[radial-gradient(#1a1b1e_1px,transparent_1px)] [background-size:20px_20px]">
        {widgets.map((widget) => (
          <DraggableWidget
            key={widget.id}
            widget={widget}
            updateWidget={updateWidget}
            removeWidget={removeWidget}
            renderWidget={renderWidget}
            profile={profile}
          />
        ))}
      </div>
    </div>
  );
};
