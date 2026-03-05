import express from 'express';
import { LlamaGenClient } from 'comic';

const app = express();
app.use(express.json());

const llamagen = new LlamaGenClient({
  apiKey: process.env.LLAMAGEN_API_KEY
});

app.post('/comic/create', async (req, res) => {
  try {
    const created = await llamagen.comic.create(req.body);
    res.json(created);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/comic/:id', async (req, res) => {
  try {
    const detail = await llamagen.comic.get(req.params.id);
    res.json(detail);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(3000, () => {
  console.log('Express demo listening on http://localhost:3000');
});
