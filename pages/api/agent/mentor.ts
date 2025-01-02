import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      console.log(req.body); // Log the body for debugging
      const { menteeId, mentorId } = req.body;

      // Validate input
      if (!menteeId || !mentorId) {
        return res.status(400).json({ error: 'MenteeId and MentorId are required.' });
      }

      // Update mentee with mentorId
      const updatedAgent = await prisma.agent.update({
        where: { id: menteeId },
        data: { mentorId: mentorId },
      });

      res.status(200).json(updatedAgent);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to assign mentor.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
