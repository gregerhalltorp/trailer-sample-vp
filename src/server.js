import express from 'express';

import asyncMiddleware from '../utils/asyncMiddleware';
import { handleTrailerRequest } from './controller';

// TODO: tests

const app = express();
const { tmdbApiKey } = process.env;
if (!tmdbApiKey) {
  console.log('Please set tmdbApiKey before running!');
  process.exit(0);
}

const PORT = 3001;

app.use((req, _, next) => {
  req.context = {
    ...(req.context || {}),
    tmdbApiKey,
  };

  next();
});

app.get('/', asyncMiddleware(handleTrailerRequest));

app.get('*', (req, res) => {
  res.sendStatus(404);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
