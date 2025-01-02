// src/lib/agent.ts
import { CentralOracle } from './oracle';

export type AgentRole = 'mentor' | 'mentee';

export class AgentEntity {
  id: number;
  name: string;
  role: AgentRole;
  experience: number;
  mentorId?: number;
  knowledge: Record<string, unknown>; // local knowledge

  constructor(
    id: number,
    name: string,
    role: AgentRole = 'mentee',
    experience = 0,
    mentorId?: number
  ) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.experience = experience;
    this.mentorId = mentorId;
    this.knowledge = {};
  }

  public async requestGuidance() {
    if (this.role === 'mentee' && this.mentorId) {
      console.log(`${this.name} is requesting guidance from mentor #${this.mentorId}.`);
      // In practice, you'd fetch the actual mentor from DB, etc.
      // For demo, let’s just say we got “guidance”.
      const guidance = { tactic: 'optimized-strategy' };
      this.knowledge = { ...this.knowledge, ...guidance };
    }
  }

  public shareKnowledgeWithOracle(key: string, value: unknown) {
    const oracle = CentralOracle.getInstance();
    oracle.updateKnowledge(key, value);
  }

  public updateLocalKnowledgeFromOracle(key: string) {
    const oracle = CentralOracle.getInstance();
    const knowledgeValue = oracle.getKnowledge(key);
    if (knowledgeValue) {
      this.knowledge[key] = knowledgeValue;
    }
  }

  public gainExperience(amount: number) {
    this.experience += amount;
    if (this.experience > 10 && this.role !== 'mentor') {
      this.promoteToMentor();
    }
  }

  private promoteToMentor() {
    console.log(`${this.name} has been promoted to mentor!`);
    this.role = 'mentor';
  }
}
