import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { name, role } = req.body;
      const newAgent = await prisma.agent.create({
        data: { name, role, experience: 0 },
      });
      res.status(200).json(newAgent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create agent.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
