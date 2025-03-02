// routes/ChatRoutes.js
// routes/chatRoutes.js
import express from 'express';
import chatWithGemini from '../controllers/ChatController.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const reply = await chatWithGemini(message);
    res.json({ reply });  // Send response in the format expected by the frontend
  } catch (error) {
    console.error("Error in chat route:", error);
    res.status(500).json({ 
      error: error.message,
      reply: "Sorry, I encountered an error processing your request." 
    });
  }
});

export default router;