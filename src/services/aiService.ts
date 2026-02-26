import { GoogleGenAI, Type } from "@google/genai";
import { LadderRow, HMIWidget, DeviceProfile } from "../store/useStore";

function getAI() {
  // Priority: 1. Platform Secret, 2. User Selection, 3. Hardcoded Fallback
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "AIzaSyB-q2v1F4rvLXgSwjhYWXQWHlWRRAyXLUE";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please select a key via the 'Select Paid API Key' button in the chat.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateProgram(prompt: string, profile: DeviceProfile): Promise<{ rows: LadderRow[], widgets: HMIWidget[] }> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an elite industrial automation engineer. Generate a high-reliability PLC ladder logic program and a professional HMI interface for the following request: "${prompt}".
    
    CRITICAL CONSTRAINTS:
    1. I/O MAPPING: You MUST ONLY use these variables for physical I/O:
       - Inputs: ${profile.inputs.join(', ')}
       - Outputs: ${profile.outputs.join(', ')}
       - Analogs: ${profile.analogs.join(', ')}
    2. FUNCTIONAL CORRECTNESS: The logic must be complete and functional. Use internal tags (e.g., B3:0, T4:0) for intermediate logic if needed.
    3. SAFETY: Include standard safety practices (e.g., stop buttons should be NC logic, interlocks for reversing motors).
    4. HMI ALIGNMENT: Every HMI widget must be linked to a variable used in the ladder logic.
    
    Return a JSON object with:
    1. "rows": Array of LadderRow. Elements: "id", "type" (NO_CONTACT, NC_CONTACT, COIL, TON, TOF, CTU, CTD, MOVE), "variable", and optional "params" (preset, source).
    2. "widgets": Array of HMIWidget. Types: BUTTON, GAUGE, LED, SLIDER, TEXT. Include "x", "y", "variable", "label".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                elements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: { type: Type.STRING },
                      variable: { type: Type.STRING },
                      params: {
                        type: Type.OBJECT,
                        properties: {
                          preset: { type: Type.NUMBER },
                          source: { type: Type.NUMBER }
                        }
                      }
                    },
                    required: ["id", "type", "variable"]
                  }
                }
              },
              required: ["id", "elements"]
            }
          },
          widgets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                variable: { type: Type.STRING },
                label: { type: Type.STRING }
              },
              required: ["id", "type", "x", "y", "variable", "label"]
            }
          }
        },
        required: ["rows", "widgets"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
}

export async function chatWithAI(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  currentState?: { rows: LadderRow[], widgets: HMIWidget[], variables: Record<string, any>, devices: any[] }
) {
  const ai = getAI();
  
  let contextInstruction = `You are Neurox AI, an elite industrial automation assistant. 
      Your primary goal is to HELP THE USER BUILD, EDIT, DEBUG, and TROUBLESHOOT their PLC, VFD, and Arduino projects.
      
      CAPABILITIES:
      1. PROGRAM GENERATION: When asked to "create" or "build", explain the logic and end with: "I can generate this program and HMI layout for you now. Would you like me to apply these changes?"
         - ROBUSTNESS CHECKLIST: Always include:
           * Safety Interlocks (e.g., E-Stop, Overload)
           * Debouncing logic for physical inputs
           * Watchdog/Heartbeat for remote I/O
           * Proper latching/unlatching for motor controls
      2. HARDWARE TROUBLESHOOTING: You can diagnose connection issues with Arduinos (USB/Serial), PLCs (Ethernet/Modbus), and VFDs. 
         - TROUBLESHOOTING GUIDE:
           * USB/Serial: Must use "Shared App URL" in a new tab. Check baud rate (9600 default).
           * Ethernet: Check IP subnet (must match server). Check port (502 for PLC, 80/8080 for VFD).
           * VFD: Check parameter P0.01 for control source.
      3. LOGIC AUDIT: Proactively identify safety risks or logic deadlocks.
      
      You are technical, precise, and prioritize industrial safety.`;

  if (currentState) {
    contextInstruction += `\n\nCURRENT PROJECT STATE:
    - Ladder Logic: ${JSON.stringify(currentState.rows)}
    - HMI Widgets: ${JSON.stringify(currentState.widgets)}
    - Current Variable Values: ${JSON.stringify(currentState.variables)}
    - Connected Devices: ${JSON.stringify(currentState.devices)}
    
    Use this state to provide context-aware help. If you see a logic error or a device is disconnected, mention it.`;
  }

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: contextInstruction,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
