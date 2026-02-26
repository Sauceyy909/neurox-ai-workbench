import { create } from 'zustand';

export type ElementType = 
  | 'NO_CONTACT' 
  | 'NC_CONTACT' 
  | 'COIL' 
  | 'TON' 
  | 'TOF' 
  | 'CTU' 
  | 'CTD' 
  | 'MOVE' 
  | 'ADD' 
  | 'SUB' 
  | 'BRANCH_START' 
  | 'BRANCH_END';

export interface LadderElement {
  id: string;
  type: ElementType;
  variable: string;
  value?: any;
  params?: Record<string, any>;
  parallel?: string[]; // IDs of elements in parallel with this one
}

export interface LadderRow {
  id: string;
  elements: LadderElement[];
}

export interface HMIWidget {
  id: string;
  type: 'BUTTON' | 'GAUGE' | 'LED' | 'SLIDER' | 'TEXT';
  x: number;
  y: number;
  variable: string;
  label: string;
  color?: string;
}

export interface Device {
  id: string;
  name: string;
  address: string; // IP or Serial Port
  port?: number;
  type: 'ARDUINO' | 'VFD' | 'PLC';
  connectionType: 'WIFI' | 'ETHERNET' | 'USB';
  status: 'CONNECTED' | 'DISCONNECTED' | 'DISCOVERING';
}

export interface DeviceProfile {
  inputs: string[];
  outputs: string[];
  analogs: string[];
}

const DEVICE_PROFILES: Record<Device['type'], DeviceProfile> = {
  ARDUINO: {
    inputs: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
    outputs: ['D8', 'D9', 'D10', 'D11', 'D12', 'D13'],
    analogs: ['A0', 'A1', 'A2', 'A3']
  },
  PLC: {
    inputs: ['I0.0', 'I0.1', 'I0.2', 'I0.3', 'I0.4', 'I0.5', 'I0.6', 'I0.7'],
    outputs: ['Q0.0', 'Q0.1', 'Q0.2', 'Q0.3', 'Q0.4', 'Q0.5', 'Q0.6', 'Q0.7'],
    analogs: ['IW64', 'IW66', 'QW64']
  },
  VFD: {
    inputs: ['DI1', 'DI2', 'DI3', 'DI4', 'FWD', 'REV'],
    outputs: ['RO1', 'RO2', 'DO1'],
    analogs: ['AI1', 'AI2', 'AO1']
  }
};

interface PLCState {
  rows: LadderRow[];
  widgets: HMIWidget[];
  variables: Record<string, any>;
  devices: Device[];
  selectedDeviceId: string | null;
  isRunMode: boolean;
  isDiscovering: boolean;
  isSimulationMode: boolean;
  simulationData: {
    vfdSpeed: number;
    vfdFrequency: number;
    vfdCurrent: number;
    vfdTargetSpeed: number;
    vfdAccelTime: number;
    vfdDecelTime: number;
    vfdMaxFreq: number;
  };
  
  // Actions
  arduinoCode: string;
  setArduinoCode: (code: string) => void;
  addRow: () => void;
  addElement: (rowId: string, type: ElementType) => void;
  updateElement: (rowId: string, elementId: string, updates: Partial<LadderElement>) => void;
  removeElement: (rowId: string, elementId: string) => void;
  addParallelElement: (rowId: string, parentId: string, type: ElementType) => void;
  
  addWidget: (type: HMIWidget['type']) => void;
  updateWidget: (id: string, updates: Partial<HMIWidget>) => void;
  removeWidget: (id: string) => void;
  
  setVariable: (name: string, value: any) => void;
  addVariable: (name: string, initialValue: any) => void;
  removeVariable: (name: string) => void;
  toggleRunMode: () => void;
  toggleSimulationMode: () => void;
  updateSimulationData: (updates: Partial<PLCState['simulationData']>) => void;
  
  addDevice: (device: Omit<Device, 'id' | 'status'>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  removeDevice: (id: string) => void;
  selectDevice: (id: string | null) => void;
  setFullState: (rows: LadderRow[], widgets: HMIWidget[]) => void;
  setDiscovering: (val: boolean) => void;
  getIOProfile: () => DeviceProfile;
}

export const useStore = create<PLCState>((set, get) => ({
  rows: [{ id: 'row-1', elements: [] }],
  widgets: [],
  variables: {
    'I0.1': false,
    'I0.2': false,
    'Q0.1': false,
    'T1': 0,
  },
  devices: [],
  selectedDeviceId: null,
  isRunMode: false,
  isDiscovering: false,
  isSimulationMode: true, // Default to simulation mode for testing
  arduinoCode: `
void setup() {
  pinMode(D13, OUTPUT);
}

void loop() {
  digitalWrite(D13, HIGH);
  delay(1000);
  digitalWrite(D13, LOW);
  delay(1000);
}
`,
  simulationData: {
    vfdSpeed: 0,
    vfdFrequency: 0,
    vfdCurrent: 0,
    vfdTargetSpeed: 0,
    vfdAccelTime: 5.0,
    vfdDecelTime: 5.0,
    vfdMaxFreq: 60.0,
  },

  setArduinoCode: (code) => set({ arduinoCode: code }),

  getIOProfile: () => {
    const state = get();
    const device = state.devices.find(d => d.id === state.selectedDeviceId);
    return device ? DEVICE_PROFILES[device.type] : DEVICE_PROFILES.PLC;
  },

  setFullState: (rows, widgets) => set({ rows, widgets }),
  setDiscovering: (val) => set({ isDiscovering: val }),
  toggleSimulationMode: () => set((state) => ({ isSimulationMode: !state.isSimulationMode })),
  updateSimulationData: (updates) => set((state) => ({ 
    simulationData: { ...state.simulationData, ...updates } 
  })),

  addRow: () => set((state) => ({
    rows: [...state.rows, { id: `row-${state.rows.length + 1}`, elements: [] }]
  })),
  
  // ... rest of the store ...
  addElement: (rowId, type) => set((state) => ({
    rows: state.rows.map(row => row.id === rowId ? {
      ...row,
      elements: [...row.elements, {
        id: Math.random().toString(36).substr(2, 9),
        type,
        variable: get().getIOProfile().inputs[0] || 'VAR',
      }]
    } : row)
  })),

  updateElement: (rowId, elementId, updates) => set((state) => ({
    rows: state.rows.map(row => row.id === rowId ? {
      ...row,
      elements: row.elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
    } : row)
  })),

  removeElement: (rowId, elementId) => set((state) => ({
    rows: state.rows.map(row => row.id === rowId ? {
      ...row,
      elements: row.elements.filter(el => el.id !== elementId)
    } : row)
  })),

  addParallelElement: (rowId, parentId, type) => set((state) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newElement: LadderElement = {
      id: newId,
      type,
      variable: get().getIOProfile().inputs[0] || 'VAR',
    };
    
    return {
      rows: state.rows.map(row => row.id === rowId ? {
        ...row,
        elements: row.elements.map(el => el.id === parentId ? {
          ...el,
          parallel: [...(el.parallel || []), newId]
        } : el).concat(newElement)
      } : row)
    };
  }),

  addWidget: (type) => set((state) => ({
    widgets: [...state.widgets, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
      variable: get().getIOProfile().outputs[0] || 'VAR',
      label: type.toLowerCase(),
    }]
  })),

  updateWidget: (id, updates) => set((state) => ({
    widgets: state.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
  })),

  removeWidget: (id) => set((state) => ({
    widgets: state.widgets.filter(w => w.id !== id)
  })),

  setVariable: (name, value) => set((state) => ({
    variables: { ...state.variables, [name]: value }
  })),

  addVariable: (name, initialValue) => set((state) => ({
    variables: { ...state.variables, [name]: initialValue }
  })),

  removeVariable: (name) => set((state) => {
    const { [name]: _, ...rest } = state.variables;
    return { variables: rest };
  }),

  toggleRunMode: () => set((state) => ({ isRunMode: !state.isRunMode })),

  addDevice: (device) => set((state) => ({
    devices: [...state.devices, { ...device, id: Math.random().toString(36).substr(2, 9), status: 'DISCONNECTED' }]
  })),

  updateDevice: (id, updates) => set((state) => ({
    devices: state.devices.map(d => d.id === id ? { ...d, ...updates } : d)
  })),

  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter(d => d.id !== id),
    selectedDeviceId: state.selectedDeviceId === id ? null : state.selectedDeviceId
  })),

  selectDevice: (id) => set({ selectedDeviceId: id }),
}));
