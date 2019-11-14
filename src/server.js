import express from 'express';
import axios from 'axios';

const app = express();
const { tmdbApiKey } = process.env;
if (!tmdbApiKey) {
  console.log('Please set tmdbApiKey before running!');
  process.exit(0);
}

const PORT = 3001;

app.get('/', async (req, res) => {
  console.log(tmdbApiKey);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
