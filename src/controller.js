/* eslint-disable import/prefer-default-export */
import axios from 'axios';
import url from 'url';

import valueIn from '../utils/valueIn';
import tryCatch from '../utils/tryCatch';

const TRAILER = 'Trailer';
const YOUTUBE = 'YouTube';

// TODO: move error handling to custom error handler
// Return error messages depending on NODE_ENV (actual error for debug, nice message for prod)
export const handleTrailerRequest = async (req, res) => {
  const { tmdbApiKey } = req.context;
  console.log('Handling ', req.url);
  const { movieLink = '' } = req.query;

  if (!movieLink) {
    return res.status(400).send('Please supply a movieLink query parameter');
  }

  let parsedUrl;
  let parseError;
  try {
    parsedUrl = new url.URL(movieLink);
  } catch (err) {
    parseError = err;
  }

  // Some basic sanity checks
  if (
    parseError ||
    !parsedUrl ||
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.host !== 'content.viaplay.se'
  ) {
    return res
      .status(400)
      .send('Please provide a valid movieLink query parameter');
  }

  const [vpErr, vpRes] = await tryCatch(() => axios.get(parsedUrl.href));
  if (vpErr) {
    console.log(vpErr.response);
    return res
      .status(400)
      .send('Please provide a valid movieLink query parameter');
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
    res.status(200).send('No trailers found for resource link');
  }

  const [findErr, findRes] = await tryCatch(() =>
    axios.get(
      `https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbApiKey}&external_source=imdb_id`
    )
  );

  if (findErr) {
    console.log(findErr.response);
    return res.status(200).send('No trailers found for resource link');
  }

  const tmdbId = valueIn(findRes, ['data', 'movie_results', '0', 'id']);

  const [vidErr, vidRes] = await tryCatch(() =>
    axios.get(
      `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${tmdbApiKey}`
    )
  );

  if (vidErr) {
    console.log(vidErr.response);
    return res.status(200).send('No trailers found for resource link');
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
      return res.status(200).send(`https://youtube.com/watch?v=${trailer.key}`);
    }
  }

  return res.status(200).send('No trailers found for resource link');
};
