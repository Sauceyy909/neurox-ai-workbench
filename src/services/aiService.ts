import { GoogleGenAI, Type } from "@google/genai";
import { LadderRow, HMIWidget, DeviceProfile } from "../store/useStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateProgram(prompt: string, profile: DeviceProfile): Promise<{ rows: LadderRow[], widgets: HMIWidget[] }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert industrial automation engineer. Generate a PLC ladder logic program and an HMI interface for the following request: "${prompt}".
    
    IMPORTANT: You MUST use the following I/O variables for this specific device:
    Inputs: ${profile.inputs.join(', ')}
    Outputs: ${profile.outputs.join(', ')}
    Analogs: ${profile.analogs.join(', ')}
    
    Return a JSON object with:
    1. "rows": An array of LadderRow objects. Each row has an "id" and "elements". Elements have "id", "type" (NO_CONTACT, NC_CONTACT, COIL, TIMER, COUNTER), and "variable".
    2. "widgets": An array of HMIWidget objects. Each has "id", "type" (BUTTON, GAUGE, LED, SLIDER, TEXT), "x", "y", "variable", and "label".
    
    Ensure variables in ladder logic match those in HMI widgets.`,
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
                      variable: { type: Type.STRING }
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
