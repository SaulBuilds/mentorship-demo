import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { openAiClient } from '@/lib/openai';
import { CentralOracle } from '@/lib/oracle';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { agentId, question } = req.body;

      // fetch agent
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found.' });
      }

      // maybe the agent first checks Oracle knowledge
      const oracle = CentralOracle.getInstance();
      const existingKnowledge = oracle.getAllKnowledge();

      // combine question with any existing knowledge
      const prompt = `We have some knowledge: ${JSON.stringify(existingKnowledge)}.
      The agent asks: ${question}`;

      // call OpenAI via LangChain
      const response = await openAiClient.call(prompt);

      // store or update knowledge
      oracle.updateKnowledge(`Q:${question}`, response);

      // optionally, increment agent’s experience
      await prisma.agent.update({
        where: { id: agentId },
        data: { experience: agent.experience + 1 },
      });

      res.status(200).json({ answer: response });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Chat failed.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
