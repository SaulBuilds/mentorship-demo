// pages/api/agent/ab-test.ts
import { NextApiRequest, NextApiResponse } from "next";
import { runABTest } from "@/lib/ab-test";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { task, threadId, isMentorEnabled } = req.body;
    if (!task || !threadId) {
      return res.status(400).json({ error: "Missing task or threadId" });
    }

    const userMessage = new HumanMessage(task);
    const initialMessages = [userMessage];

    const finalMessages = await runABTest(
      threadId,
      initialMessages,
      !!isMentorEnabled
    );

    // finalMessages => array of { type, text }
    const output = finalMessages.map((msg: BaseMessage) => ({
      type: msg._getType(),
      text: msg.text,
    }));

    return res.status(200).json({ finalMessages: output });
  } catch (err) {
    console.error("AB test error:", err);
    return res.status(500).json({ error: "Failed to run AB test." });
  }
}
