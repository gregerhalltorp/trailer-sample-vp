# Back-end work sample brief

## Installation

1. Clone the repo `git clone git@github.com:gregerhalltorp/trailer-sample-vp.git`
2. `cd trailer-sample-vp`
3. `yarn`

## Running

### Dev cycle

`tmdbApiKey=<Your key here> yarn dev`

### "Prod"

1. `yarn build`
2. `tmdbApiKey=<Your key here> node build/index.js`

## Usage

Perform a http GET to http://localhost:3001?moveLink={movieLink} where movieLink is a Viaplay movie resource link.

## Overview

Performs a GET on the provided movie resource link and extracts the IMDB movie Id from the repsonse. This Id is then used to query `api.themoviedb.org/3/find` to find the movie in the TMDB database. Finally, the app will query `api.themoviedb.org/3/movie/{id}/videos`to find any linked videos. If any videos exist, the first tagged with the type `Trailer` and the site `YouTube` will be used to construct a link to a YouTube-video.

If all goes well, the response will be `200` with the generated link.
If any of the API calls are unsuccessful, appropriate responses will be returned.

## PERFORMANCE CONSIDERATIONS:

1. Caching

   Results from both `content.viaplay.se` and `api.themoviedb.org` have `ETag` headers, TMDB results also have `Cache-Control` headers with a set `max-age`. In the call to `content.viaplay.se` as well as the call to `api.themoviedb.org/3/find`, only a small part of the response is used and would need to be cached.

   The result should be cached and returned directly if none of the API requests yielded a cache miss.

2. Node performance
   - Horizontal scaling
     - Forking to use all cores
     - Scaling to multiple machines

## TODOS:

- Handle other sites than YouTube (tmdb supports videos from Vimeo and maybe more)
  _Excluded due to time constraints, would require a lot of analysis_
- Move util functions to lib and provide testing
