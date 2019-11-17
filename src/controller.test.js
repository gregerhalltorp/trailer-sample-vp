import axios from 'axios';
import url from 'url';

import { handleTrailerRequest } from './controller';
import {
  NO_MOVIELINK,
  INVALID_MOVIELINK,
  NO_TRAILERS_FOUND,
} from '../constants/messages';

jest.mock('axios');
jest.mock('url');

describe('controller', () => {
  describe('trailer request handler', () => {
    const req = {};
    const res = {};
    const movieLink = 'movieLink';
    beforeEach(() => {
      req.context = { tmdbApiKey: 'tmdbApiKey' };
      req.query = { movieLink };
      res.status = jest.fn().mockReturnThis();
      res.send = jest.fn();
      url.URL.mockImplementation(() => ({
        protocol: 'https:',
        host: 'content.viaplay.se',
        href: movieLink,
      }));
    });

    it('sends status 400 with correct error message if no movieLink on reqest.query', () => {
      req.query.movieLink = '';
      handleTrailerRequest(req, res);

      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(NO_MOVIELINK);
    });

    it('handles throw in url.URL (correct status and message)', () => {
      url.URL.mockImplementation(() => {
        throw new Error('testerror');
      });

      handleTrailerRequest(req, res);
      expect(url.URL.mock.calls.length).toBe(1);
      expect(url.URL.mock.calls[0][0]).toBe(movieLink);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(INVALID_MOVIELINK);
    });

    it('handles movieLink protocol <> https (correct status and message)', () => {
      url.URL.mockImplementation(() => ({ protocol: 'nothttps:' }));

      handleTrailerRequest(req, res);
      expect(url.URL.mock.calls.length).toBe(2);
      expect(url.URL.mock.calls[1][0]).toBe(movieLink);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(INVALID_MOVIELINK);
    });

    it('handles movieLink host <> content.viaplay.se', () => {
      url.URL.mockImplementation(() => ({
        protocol: 'https:',
        host: 'notviaplay',
      }));

      handleTrailerRequest(req, res);
      expect(url.URL.mock.calls.length).toBe(3);
      expect(url.URL.mock.calls[2][0]).toBe(movieLink);
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
      expect(url.URL.mock.calls.length).toBe(4);
      expect(url.URL.mock.calls[3][0]).toBe(movieLink);
      expect(axios.get.mock.calls.length).toBe(1);
      expect(axios.get.mock.calls[0][0]).toBe(movieLink);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(400);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(INVALID_MOVIELINK);
    });

    it('will handle no imdb id found', async () => {
      axios.get.mockResolvedValueOnce({});

      await handleTrailerRequest(req, res);
      expect(url.URL.mock.calls.length).toBe(5);
      expect(url.URL.mock.calls[4][0]).toBe(movieLink);
      expect(axios.get.mock.calls.length).toBe(2);
      expect(axios.get.mock.calls[1][0]).toBe(movieLink);
      expect(res.status.mock.calls.length).toBe(1);
      expect(res.status.mock.calls[0][0]).toBe(200);
      expect(res.send.mock.calls.length).toBe(1);
      expect(res.send.mock.calls[0][0]).toBe(NO_TRAILERS_FOUND);
    });
  });
});
