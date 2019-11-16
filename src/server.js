import express from 'express';
import axios from 'axios';

import valueIn from '../utils/valueIn';
import tryCatch from '../utils/tryCatch';
import asyncMiddleware from '../utils/asyncMiddleware';

// TODO: Take viaplay url as parameter
// TODO: validation and sanitation
// TODO: Handle bad results
// TODO: tests

const TRAILER = 'Trailer';
const YOUTUBE = 'YouTube';

const app = express();
const { tmdbApiKey } = process.env;
if (!tmdbApiKey) {
  console.log('Please set tmdbApiKey before running!');
  process.exit(0);
}

const PORT = 3001;

app.get(
  '/',
  asyncMiddleware(async (req, res, next) => {
    const [vpErr, vpRes] = await tryCatch(() =>
      axios.get('https://content.viaplay.se/pc-se/film/captain-marvel-2019')
    );
    if (vpErr) {
      console.log(vpErr);
      return next(vpErr);
    }
    // IDEA: vpRes.data._embedded['viaplay:blocks'][0]._embedded['viaplay:product']
    // Check type here if validating instead of handling error
    const imdbId = valueIn(vpRes, [
      'data',
      '_embedded',
      'viaplay:blocks',
      '0',
      '_embedded',
      'viaplay:product',
      'content',
      'imdb',
      'id',
    ]);

    if (!imdbId) {
      // TODO: Handle this case better!
      res.sendStatus(400);
    }

    // TODO: handle querystring better than this
    const [findErr, findRes] = await tryCatch(() =>
      axios.get(
        `https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbApiKey}&external_source=imdb_id`
      )
    );

    if (findErr) {
      return next(new Error('tmdb get error', findErr));
    }

    const tmdbId = valueIn(findRes, ['data', 'movie_results', '0', 'id']);

    const [vidErr, vidRes] = await tryCatch(() =>
      axios.get(
        `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${tmdbApiKey}`
      )
    );

    if (vidErr) {
      return next(new Error('tmdb videos error', vidErr));
    }
    const { data: vidData } = vidRes;

    if (
      vidData &&
      vidData.results &&
      Array.isArray(vidData.results) &&
      vidData.results.length
    ) {
      const trailer = vidData.results.find(
        video => video.type === TRAILER && video.site === YOUTUBE && video.key
      );
      if (trailer) {
        const trailerUrl = `https://youtube.com/watch?v=${trailer.key}`;
        return res.status(200).send(`
        <html>
        <body>
         <a href="${trailerUrl}">${trailerUrl}</a>
        </body>
        </html>
        `);
      }
    }

    res.status(200).send('No trailer found');
  })
);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
