export const getTmdbFindUrl = (imdbId, tmdbApiKey) =>
  `https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbApiKey}&external_source=imdb_id`;
export const getTmdbVideosUrl = (tmdbId, tmdbApiKey) =>
  `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${tmdbApiKey}`;
export const getYouTubeUrl = key => `https://youtube.com/watch?v=${key}`;
