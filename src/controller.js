/* eslint-disable import/prefer-default-export */
import axios from 'axios';
import url from 'url';

import valueIn from '../utils/valueIn';
import tryCatch from '../utils/tryCatch';
import {
  NO_MOVIELINK,
  INVALID_MOVIELINK,
  NO_TRAILERS_FOUND,
} from '../constants/messages';
import {
  getTmdbFindUrl,
  getTmdbVideosUrl,
  getYouTubeUrl,
} from '../constants/urls';
import { TRAILER, YOUTUBE } from '../constants/strings';

// TODO: move error handling to custom error handler
// Return error messages depending on NODE_ENV (actual error for debug, nice message for prod)
export const handleTrailerRequest = async (req, res) => {
  const { tmdbApiKey } = req.context;
  console.log('Handling ', req.url);
  const { movieLink = '' } = req.query;

  if (!movieLink) {
    return res.status(400).send(NO_MOVIELINK);
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
    !parsedUrl.href || // This seems unlikely but we're depending on it below
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.host !== 'content.viaplay.se'
  ) {
    return res.status(400).send(INVALID_MOVIELINK);
  }

  const [vpErr, vpRes] = await tryCatch(() => axios.get(parsedUrl.href));
  if (vpErr) {
    console.log(vpErr.response);
    return res.status(400).send(INVALID_MOVIELINK);
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
    return res.status(200).send(NO_TRAILERS_FOUND);
  }

  const [findErr, findRes] = await tryCatch(() =>
    axios.get(getTmdbFindUrl(imdbId, tmdbApiKey))
  );

  if (findErr) {
    console.log(findErr.response);
    return res.status(200).send(NO_TRAILERS_FOUND);
  }

  const tmdbId = valueIn(findRes, ['data', 'movie_results', '0', 'id']);
  if (!tmdbId) {
    return res.status(200).send(NO_TRAILERS_FOUND);
  }

  const [vidErr, vidRes] = await tryCatch(() =>
    axios.get(getTmdbVideosUrl(tmdbId, tmdbApiKey))
  );

  if (vidErr) {
    console.log(vidErr.response);
    return res.status(200).send(NO_TRAILERS_FOUND);
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
      return res.status(200).send(getYouTubeUrl(trailer.key));
    }
  }

  return res.status(200).send(NO_TRAILERS_FOUND);
};
