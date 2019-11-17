import axios from 'axios';
import url from 'url';

import { handleTrailerRequest } from './controller';
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

jest.mock('axios');
jest.mock('url');

describe('controller', () => {
  describe('trailer request handler', () => {
    const req = {};
    const res = {};
    const tmdbApiKey = 'tmdbApiKey';
    const movieLink = 'movieLink';
    const imdbId = 'imdbId';
    const tmdbId = 'tmdbId';
    const trailerKey = 'trailerKey';

    const viaPlayResponse = {
      data: {
        _embedded: {
          'viaplay:blocks': [
            {
              _embedded: {
                'viaplay:product': {
                  content: {
                    imdb: {
                      id: imdbId,
                    },
                  },
                },
              },
            },
          ],
        },
      },
    };
    const tmdbFindResult = {
      data: {
        movie_results: [
          {
            id: tmdbId,
          },
        ],
      },
    };

    const tmdbVideosResult = {
      data: {
        results: [
          {
            type: TRAILER,
            site: YOUTUBE,
            key: trailerKey,
          },
        ],
      },
    };

    beforeEach(() => {
      req.context = { tmdbApiKey };
      req.query = { movieLink };
      res.status = jest.fn().mockReturnThis();
      res.send = jest.fn();
      url.URL.mockImplementation(() => ({
        protocol: 'https:',
        host: 'content.viaplay.se',
        href: movieLink,
      }));
    });

    it('sends status 400 with correct error message if no movieLink on reqest.query', async () => {
      req.query.movieLink = '';
      await handleTrailerRequest(req, res);

      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(NO_MOVIELINK);
    });

    it('handles throw in url.URL (correct status and message)', async () => {
      url.URL.mockImplementation(() => {
        throw new Error('testerror');
      });

      await handleTrailerRequest(req, res);
      expect(url.URL.mock.calls.length).toBe(1);
      expect(url.URL.mock.calls[0][0]).toBe(movieLink);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(INVALID_MOVIELINK);
    });

    it('handles movieLink protocol <> https (correct status and message)', async () => {
      url.URL.mockImplementation(() => ({ protocol: 'nothttps:' }));

      await handleTrailerRequest(req, res);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(INVALID_MOVIELINK);
    });

    it('handles movieLink host <> content.viaplay.se', async () => {
      url.URL.mockImplementation(() => ({
        protocol: 'https:',
        host: 'notviaplay',
      }));

      await handleTrailerRequest(req, res);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(INVALID_MOVIELINK);
    });

    it('handles error in call to viaplay content api', async () => {
      axios.get.mockImplementationOnce(() =>
        Promise.reject(new Error('testerror'))
      );

      await handleTrailerRequest(req, res);

      expect(axios.get.mock.calls.length).toBe(1);
      expect(axios.get.mock.calls[0][0]).toBe(movieLink);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(INVALID_MOVIELINK);
    });

    it('handles no imdb id found', async () => {
      axios.get.mockResolvedValueOnce({});

      await handleTrailerRequest(req, res);

      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(200);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(NO_TRAILERS_FOUND);
    });

    it('handles error in call to tmdb find', async () => {
      axios.get
        .mockResolvedValueOnce(viaPlayResponse)
        .mockImplementationOnce(() => Promise.reject(new Error('testerror')));

      await handleTrailerRequest(req, res);

      expect(axios.get.mock.calls.length).toBe(4);
      expect(axios.get.mock.calls[3][0]).toBe(
        getTmdbFindUrl(imdbId, tmdbApiKey)
      );
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(200);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(NO_TRAILERS_FOUND);
    });

    it('handles no tmdbId found', async () => {
      axios.get
        .mockResolvedValueOnce(viaPlayResponse)
        .mockResolvedValueOnce({});

      await handleTrailerRequest(req, res);

      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(200);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(NO_TRAILERS_FOUND);
    });

    it('handles error in call to tmdb videos', async () => {
      axios.get
        .mockResolvedValueOnce(viaPlayResponse)
        .mockResolvedValueOnce(tmdbFindResult)
        .mockImplementationOnce(() => Promise.reject(new Error('testerror')));

      await handleTrailerRequest(req, res);
      expect(axios.get.mock.calls.length).toBe(9);
      expect(axios.get.mock.calls[8][0]).toBe(
        getTmdbVideosUrl(tmdbId, tmdbApiKey)
      );
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(200);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(NO_TRAILERS_FOUND);
    });

    it('handles bad data from tmdb videos', async () => {
      axios.get
        .mockResolvedValueOnce(viaPlayResponse)
        .mockResolvedValueOnce(tmdbFindResult)
        .mockResolvedValueOnce({});

      await handleTrailerRequest(req, res);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(200);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(NO_TRAILERS_FOUND);
    });

    it('does the good thing', async () => {
      axios.get
        .mockResolvedValueOnce(viaPlayResponse)
        .mockResolvedValueOnce(tmdbFindResult)
        .mockResolvedValueOnce(tmdbVideosResult);

      await handleTrailerRequest(req, res);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(200);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(getYouTubeUrl(trailerKey));
    });
  });
});
