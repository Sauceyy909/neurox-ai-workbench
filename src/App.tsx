/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LadderEditor } from './components/LadderEditor';
import { HMIBuilder } from './components/HMIBuilder';
import { DeviceManager } from './components/DeviceManager';
import { AIChat } from './components/AIChat';
import { SimulationPanel } from './components/SimulationPanel';
import { VFDConfig } from './components/VFDConfig';
import { ArduinoEditor } from './components/ArduinoEditor';
import { TagEditor } from './components/TagEditor';
import { useStore, LadderElement } from './store/useStore';
import { 
  Cpu, 
  Layout, 
  Play, 
  Square, 
  Settings, 
  Terminal, 
  Activity,
  Wifi,
  Zap,
  Code,
  Sparkles,
  Box,
  MessageSquare,
  ZapOff,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'LADDER' | 'HMI' | 'ARDUINO' | 'AI' | 'SIM' | 'VFD' | 'TAGS'>('LADDER');
  const { 
    isRunMode, 
    toggleRunMode, 
    variables, 
    setVariable, 
    rows, 
    isSimulationMode, 
    toggleSimulationMode,
    simulationData,
    updateSimulationData
  } = useStore();

  // Virtual PLC Engine + Physics Simulator
  useEffect(() => {
    if (!isRunMode) return;

    const interval = setInterval(() => {
      // 1. Ladder Logic Execution
      rows.forEach(row => {
        let rungState = true;
        let outputCoil = null;

        row.elements.forEach(el => {
          let elState = false;
          const val = !!variables[el.variable];
          
          // Basic state of the element
          if (el.type === 'NO_CONTACT') elState = val;
          else if (el.type === 'NC_CONTACT') elState = !val;
          else elState = true; // For other blocks, they might not block the rung unless they are timers/counters

          // Handle Parallel (Holding) Contacts
          if (el.parallel && el.parallel.length > 0) {
            el.parallel.forEach(parallelId => {
              const parallelEl = row.elements.find(e => e.id === parallelId);
              if (parallelEl) {
                const pVal = !!variables[parallelEl.variable];
                if (parallelEl.type === 'NO_CONTACT') elState = elState || pVal;
                else if (parallelEl.type === 'NC_CONTACT') elState = elState || !pVal;
              }
            });
          }

          switch (el.type) {
            case 'NO_CONTACT':
            case 'NC_CONTACT':
              rungState = rungState && elState;
              break;
            case 'COIL':
              outputCoil = el.variable;
              break;
            case 'TON': {
              const timerVal = variables[el.variable] || 0;
              const preset = el.params?.preset || 5000;
              if (rungState) {
                if (timerVal < preset) setVariable(el.variable, timerVal + 100);
              } else {
                setVariable(el.variable, 0);
              }
              rungState = rungState && (timerVal >= preset);
              break;
            }
            case 'CTU': {
              const countVal = variables[el.variable] || 0;
              const preset = el.params?.preset || 10;
              const prevInput = el.params?.prevInput || false;
              if (rungState && !prevInput) setVariable(el.variable, countVal + 1);
              el.params = { ...el.params, prevInput: rungState };
              rungState = rungState && (countVal >= preset);
              break;
            }
            case 'TOF': {
              const timerVal = variables[el.variable] || 0;
              const preset = el.params?.preset || 5000;
              if (!rungState) {
                if (timerVal < preset) setVariable(el.variable, timerVal + 100);
              } else {
                setVariable(el.variable, 0);
              }
              rungState = rungState && (timerVal < preset);
              break;
            }
            case 'CTD': {
              const countVal = variables[el.variable] || 0;
              const preset = el.params?.preset || 0;
              const prevInput = el.params?.prevInput || false;
              if (rungState && !prevInput) setVariable(el.variable, countVal - 1);
              el.params = { ...el.params, prevInput: rungState };
              rungState = rungState && (countVal <= preset);
              break;
            }
            case 'MOVE': {
              if (rungState) {
                const source = el.params?.source || 0;
                setVariable(el.variable, source);
              }
              break;
            }
          }
        });

        if (outputCoil) {
          setVariable(outputCoil, rungState);
        }
      });

      // 2. Physics Simulation (VFD / Motors)
      if (isSimulationMode) {
        const motorOn = !!variables['Q0.1']; // Assume Q0.1 is Motor Run
        const targetFreq = motorOn ? simulationData.vfdMaxFreq : 0;
        
        // Ramp frequency based on Accel/Decel parameters
        const currentFreq = simulationData.vfdFrequency;
        const diff = targetFreq - currentFreq;
        
        // Accel/Decel step calculation (100ms interval)
        const accelStep = (simulationData.vfdMaxFreq / (simulationData.vfdAccelTime * 10));
        const decelStep = (simulationData.vfdMaxFreq / (simulationData.vfdDecelTime * 10));
        
        const step = diff > 0 ? accelStep : -decelStep;
        
        const nextFreq = Math.abs(diff) < Math.abs(step) ? targetFreq : currentFreq + step;
        const nextSpeed = (nextFreq / 60) * 1800;
        const nextCurrent = motorOn ? 2.5 + (nextFreq / 60) * 8.5 : 0;

        updateSimulationData({
          vfdFrequency: nextFreq,
          vfdSpeed: nextSpeed,
          vfdCurrent: nextCurrent
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunMode, rows, variables, setVariable, isSimulationMode, simulationData, updateSimulationData]);

  const arduinoCode = `
#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

WebSocketsServer webSocket = WebSocketsServer(81);

void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if(type == WStype_TEXT) {
    // Parse JSON command from OpenPLC Studio
    // Update Digital/Analog Pins
  }
}

void setup() {
  WiFi.begin(ssid, password);
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
}

void loop() {
  webSocket.loop();
  // Send pin states back to Studio
}
  `;

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-300 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-20 bg-[#151619] border-r border-white/5 flex flex-col items-center py-8 gap-8">
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Cpu size={28} />
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <NavButton 
            active={activeTab === 'LADDER'} 
            onClick={() => setActiveTab('LADDER')} 
            icon={<Activity size={20} />} 
            label="Logic" 
          />
          <NavButton 
            active={activeTab === 'HMI'} 
            onClick={() => setActiveTab('HMI')} 
            icon={<Layout size={20} />} 
            label="HMI" 
          />
          <NavButton 
            active={activeTab === 'VFD'} 
            onClick={() => setActiveTab('VFD')} 
            icon={<Zap size={20} />} 
            label="VFD" 
          />
          <NavButton 
            active={activeTab === 'ARDUINO'} 
            onClick={() => setActiveTab('ARDUINO')} 
            icon={<Code size={20} />} 
            label="Arduino" 
          />
          <NavButton 
            active={activeTab === 'TAGS'} 
            onClick={() => setActiveTab('TAGS')} 
            icon={<Database size={20} />} 
            label="Tags" 
          />
          <NavButton 
            active={activeTab === 'AI'} 
            onClick={() => setActiveTab('AI')} 
            icon={<Sparkles size={20} />} 
            label="AI" 
          />
          <NavButton 
            active={activeTab === 'SIM'} 
            onClick={() => setActiveTab('SIM')} 
            icon={<Box size={20} />} 
            label="Sim" 
          />
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <button className="p-3 text-zinc-600 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header / Control Bar */}
        <header className="h-16 bg-[#151619] border-b border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-white">Neurox Workbench</h1>
            <div className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-500 border border-white/5">v2.0.0-AI</div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                {isOnline ? 'Cloud Link Active' : 'Offline'}
              </span>
            </div>

            <button
              onClick={toggleSimulationMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all
                ${isSimulationMode 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                  : 'bg-zinc-800 text-zinc-500 border border-white/5'}`}
            >
              <Box size={14} /> {isSimulationMode ? 'Simulation Active' : 'Live Hardware'}
            </button>

            <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-full border border-white/5">
              <div className={`w-2 h-2 rounded-full ${isRunMode ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {isRunMode ? 'Processor Running' : 'Program Halted'}
              </span>
            </div>

            <button 
              onClick={toggleRunMode}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs transition-all
                ${isRunMode 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                  : 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-500'}`}
            >
              {isRunMode ? <><Square size={14} /> Stop</> : <><Play size={14} /> Run Program</>}
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'LADDER' && (
              <motion.div 
                key="ladder"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex"
              >
                <LadderEditor />
              </motion.div>
            )}
            {activeTab === 'HMI' && (
              <motion.div 
                key="hmi"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex-1 flex"
              >
                <HMIBuilder />
              </motion.div>
            )}
            {activeTab === 'VFD' && (
              <motion.div 
                key="vfd"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex"
              >
                <VFDConfig />
              </motion.div>
            )}
            {activeTab === 'ARDUINO' && (
              <motion.div 
                key="arduino"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex"
              >
                <ArduinoEditor />
              </motion.div>
            )}
            {activeTab === 'TAGS' && (
              <motion.div 
                key="tags"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex"
              >
                <TagEditor />
              </motion.div>
            )}
            {activeTab === 'AI' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 bg-[#0f1012] p-6 overflow-hidden flex flex-col items-center"
              >
                <div className="w-full max-w-4xl h-full">
                  <AIChat />
                </div>
              </motion.div>
            )}
            {activeTab === 'SIM' && (
              <motion.div 
                key="sim"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex"
              >
                <SimulationPanel />
              </motion.div>
            )}
          </AnimatePresence>
          
          <DeviceManager />
        </div>

        {/* Status Bar */}
        <footer className="h-8 bg-[#0f1012] border-t border-white/5 flex items-center justify-between px-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><Terminal size={12} /> Console: Ready</span>
            <span className="flex items-center gap-2"><Wifi size={12} /> WiFi: Scanning...</span>
          </div>
          <div className="flex gap-4">
            <span className="text-emerald-500/50">CPU: 2.4%</span>
            <span className="text-emerald-500/50">MEM: 124MB</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all group
        ${active ? 'bg-emerald-500/10 text-emerald-500' : 'text-zinc-600 hover:text-zinc-400'}`}
    >
      {icon}
      <span className="text-[8px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
