import React, { useState } from 'react';
import { useStore, Device } from '../store/useStore';
import { Wifi, Plus, Trash2, Cpu, Activity, Globe, Usb, Network, Search, Upload, Loader2, CheckCircle2 } from 'lucide-react';

export const DeviceManager: React.FC = () => {
  const { devices, addDevice, removeDevice, isDiscovering, setDiscovering, updateDevice, selectedDeviceId, selectDevice } = useStore();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState<Omit<Device, 'id' | 'status'>>({
    name: '',
    address: '',
    port: 80,
    type: 'ARDUINO',
    connectionType: 'WIFI'
  });

  const handleDiscovery = async () => {
    setDiscovering(true);
    try {
      const response = await fetch('/api/discover');
      const data = await response.json();
      
      if (data.devices && Array.isArray(data.devices)) {
        data.devices.forEach((d: any) => {
          if (!devices.find(existing => existing.address === d.address)) {
            addDevice(d);
          }
        });
      }
      
      if (data.error) {
        console.warn('Discovery warning:', data.error);
      }
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setDiscovering(false);
    }
  };

  const handleUpload = (id: string) => {
    setUploadingId(id);
    setTimeout(() => {
      updateDevice(id, { status: 'CONNECTED' });
      setUploadingId(null);
    }, 3000);
  };

  const handleUSBConnect = async () => {
    try {
      // @ts-ignore - Web Serial API
      if ('serial' in navigator) {
        // @ts-ignore
        const port = await navigator.serial.requestPort();
        addDevice({
          name: 'Arduino Uno',
          address: 'Serial Port',
          type: 'ARDUINO',
          connectionType: 'USB'
        });
      } else {
        alert('Web Serial is not supported in your current browser. Please use Chrome or Edge for USB hardware support.');
      }
    } catch (e) {
      console.error('USB connection failed', e);
      alert('Failed to connect to USB device. Ensure it is not being used by another application.');
    }
  };

  return (
    <div className="w-80 bg-[#151619] border-l border-white/5 p-6 flex flex-col gap-6 overflow-auto">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-2">
        <div className="flex items-center gap-2 text-amber-500 mb-1">
          <Globe size={14} />
          <span className="text-[10px] font-bold uppercase">Cloud Preview Mode</span>
        </div>
        <p className="text-[9px] text-amber-500/70 leading-relaxed">
          Direct local network (Ethernet) and USB scanning are limited in the cloud. 
          For full hardware integration, use the <b>Desktop App</b> build.
        </p>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Network Nodes</h3>
        <button 
          onClick={handleDiscovery}
          disabled={isDiscovering}
          className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          title="Scan Network"
        >
          {isDiscovering ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </div>
        
      <div className="space-y-3">
        {devices.map((device) => (
          <div 
            key={device.id} 
            onClick={() => selectDevice(device.id)}
            className={`bg-zinc-900/50 border rounded-xl p-4 group cursor-pointer transition-all
              ${selectedDeviceId === device.id ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/5 hover:border-white/20'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${device.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
                <span className="text-sm font-bold text-white">{device.name}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpload(device.id)}
                  disabled={uploadingId === device.id}
                  className="text-zinc-600 hover:text-emerald-400 transition-all"
                  title="Upload Program"
                >
                  {uploadingId === device.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                </button>
                <button onClick={() => removeDevice(device.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-black/30 rounded p-2">
                <span className="block text-[8px] text-zinc-600 uppercase">Address</span>
                <span className="text-[10px] text-zinc-400 font-mono truncate">{device.address}</span>
              </div>
              <div className="bg-black/30 rounded p-2">
                <span className="block text-[8px] text-zinc-600 uppercase">Link</span>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                  {device.connectionType === 'USB' && <Usb size={10} />}
                  {device.connectionType === 'WIFI' && <Wifi size={10} />}
                  {device.connectionType === 'ETHERNET' && <Network size={10} />}
                  {device.connectionType}
                </div>
              </div>
            </div>
          </div>
        ))}
        {devices.length === 0 && !isDiscovering && (
          <div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">No devices found</p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Manual Connection</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['WIFI', 'ETHERNET', 'USB'] as const).map(type => (
              <button
                key={type}
                onClick={() => setNewDevice({ ...newDevice, connectionType: type })}
                className={`flex-1 py-2 rounded text-[8px] font-bold border transition-all
                  ${newDevice.connectionType === type ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-black border-white/5 text-zinc-600'}`}
              >
                {type}
              </button>
            ))}
          </div>

          {newDevice.connectionType !== 'USB' ? (
            <>
              <input 
                placeholder="Device Name"
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              />
              <input 
                placeholder="IP Address"
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                value={newDevice.address}
                onChange={(e) => setNewDevice({ ...newDevice, address: e.target.value })}
              />
            </>
          ) : (
            <button 
              onClick={handleUSBConnect}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Usb size={14} /> Scan USB Ports
            </button>
          )}

          {newDevice.connectionType !== 'USB' && (
            <button 
              onClick={() => {
                if (newDevice.name && newDevice.address) {
                  addDevice(newDevice);
                  setNewDevice({ ...newDevice, name: '', address: '' });
                }
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Device
            </button>
          )}
        </div>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-emerald-400 mb-2">
          <CheckCircle2 size={14} />
          <span className="text-[10px] font-bold uppercase">Ready to Upload</span>
        </div>
        <p className="text-[9px] text-emerald-400/70 leading-relaxed">
          Programs are compiled to binary format before upload. Ensure target device is in 'PROGRAM' mode.
        </p>
      </div>
    </div>
  );
};
