// src/lib/oracle.ts

export class CentralOracle {
    private static instance: CentralOracle;
    private globalKnowledge: Record<string, unknown> = {};
  
    private constructor() {}
  
    public static getInstance(): CentralOracle {
      if (!CentralOracle.instance) {
        CentralOracle.instance = new CentralOracle();
      }
      return CentralOracle.instance;
    }
  
    public updateKnowledge(key: string, value: unknown) {
      this.globalKnowledge[key] = value;
      console.log(`[Oracle] Knowledge updated for key "${key}"`);
    }
  
    public getKnowledge(key: string): unknown {
      return this.globalKnowledge[key];
    }
  
    public getAllKnowledge(): Record<string, unknown> {
      return this.globalKnowledge;
    }
  }
  