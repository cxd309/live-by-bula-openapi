# Live! by BULA openapi

An unofficial [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) specification for the [Live! by BULA](https://beachultimate.org/livebybula/) JSON API, the public results interface used by recent WFDF, EUC and BULA ultimate events.

Presented with Swagger UI and ReDoc.

**[Browse the documentation](https://cxd309.github.io/live-by-bula-openapi/)**

> Unofficial. Derived from the published Live! and UltiOrganizer source, PHP included. Live! by BULA is © BULA Ltd. [UltiOrganizer](https://github.com/ktolonen/ultiorganizer) is a separate project. Neither has published, endorsed or reviewed this specification, and the API may break without warning.

## What this API actually is

UltiOrganizer is the database and the tournament admin. Live! by BULA drops a `live/` directory into an UltiOrganizer install and supplies the modern front end and this JSON API, UltiOrganizer has no API of its own. Most field names are UltiOrganizer's, which is why they read as lower-case run-together words - `teamname`, `fedinavg`, `done` for goals and `fedin` for assists.

Live! writes every response to a static JSON file and serves that. The dynamic endpoint at `index.php?view=live/api&entity=…` is what builds them, and returns byte-identical bodies, but sends no CORS headers.

## Version compatibility

Live! is versioned independently of this spec and **the API is not stable across patch releases**. Check `app_version` in `_heartbeat.json` before trusting this document - but check the response shape too where you can, since `app_version` is only a string in `package.json` and a deployment can drift from it (see [Notes](#notes)).

There is one spec per **distinct response shape**, named for the earliest release that produces it, because the shapes differ enough that a single document would have to caveat almost every field. 1.9.14 through 1.9.17 are one shape with a handful of field-level differences called out inline (see the [changelog](#changelog)); 3.0 is a different API, not a revision of 1.9.

| Live! version     | Spec                  | Status                                                                      |
| ----------------- | --------------------- | --------------------------------------------------------------------------- |
| **1.9.14–1.9.17** | `openapi-1.9.14.yaml` | Complete. All 13 endpoints, derived from source.                            |
| **3.0.6**         | `openapi-3.0.6.yaml`  | Complete. Both transports, derived from source.                             |
| 1.8.x and older   | -                     | Not covered, see [Legacy deployments](#legacy-and-unsupported-deployments). |
| 2.x               | -                     | Not covered. Not seen on any live deployment.                               |

Cross-checked against real captures where possible - the archived JSON in [ultimate-tournament-results](https://github.com/cxd309/ultimate-tournament-results) covers every deployment known.

## Changelog

### 3.0.6

Live! 3 runs on UltiOrganizer 4 and is a different API, not a revision of 1.9.

| Change                                    | What it means                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Spirit categories are variable            | `cat1`-`cat5` became `cat1`-`catN`. Read `season.spiritCategories` for the real list and never assume five. `0` is now a real score.  |
| `playerevents` entity added               | A per-player scoring history, game by game. There was no per-player endpoint at all on 1.9.                                           |
| `pool_placements` added                   | Each team's resolved position in each pool, as data. On 1.9 the only ranking was inside the standings endpoint's rendered HTML.       |
| `completed` means something else          | A game is completed once it has started and stopped, so 0-0 results and forfeits now count. This shifts spirit and win averages.      |
| Spirit visibility enforced                | Scores appear only when both teams have submitted and the game is cleared. The games list no longer leaks `visitorsotg`.              |
| Team spirit objects reduced               | `spiritstats` and `spirittotal` are single-field objects; per-category detail moved into `spiritgiven` / `spiritreceived`.            |
| `teamvalid` dropped from the spirit board | Teams averaging zero are now included rather than filtered out.                                                                       |
| Countries are always resolvable           | `country_id` is an integer, inherited from a team's club where needed, with a synthetic `-1` "Unknown" row so the join never dangles. |
| Ids validated against the event           | Asking for an id from a different event returns `400` instead of data. Ids kept between tournaments must be refreshed.                |
| Real error codes                          | `400`, `403` and `503` (HTML, not JSON), all from the routed endpoint. `live/api.php` now returns 404.                                |
| `{seasonId}_config.json` gone             | `config` and `hb` are not cached to disk on 3.0 and are routed-only.                                                                  |

## Archived tournaments

Every deployment known to this project is catalogued and archived in [ultimate-tournament-results](https://github.com/cxd309/ultimate-tournament-results), a sister project that polls each one's API and republishes its data as a permanent, drop-in-compatible static copy.

## Repository layout

- `openapi-1.9.14.yaml`, `openapi-3.0.6.yaml` - the specifications, and the only files to edit by hand
- `docs/openapi-*.json` - generated by `just build`, **do not edit**
- `docs/` - the GitHub Pages web root (branch `main`, folder `/docs`), served as-is

`openapi-<version>.yaml` builds to `docs/openapi-<version>.json`, keeping the same name on both sides, so supporting another line means adding one file. `just versions` lists what is built.

The YAML is the source because the spec carries a lot of markdown, which is painful to write escaped into JSON.

## Development usage

```bash
just build      # generate docs/openapi-<version>.json from each openapi-<version>.yaml
just serve      # http://localhost:8081/live-by-bula-openapi/
just fmt        # format with dprint
just validate   # lint every spec with vacuum
just check      # fmt-check + build-check + validate, as CI would
```

### Requirements

- Go tools: `simple-file-server`, `vacuum`, `yq`
- `dprint`

## The API in one page

Every event exposes the same set of static JSON files. Nothing is hardcoded - start at the heartbeat, which hands you the season id and base URL, then build the rest from it. The listing below is the 1.9 line; the two differences on 3.0 are marked.

```
GET https://{host}/{prefix}/live/data/_heartbeat.json
      -> config.LIVE_SEASON_ID          e.g. "wbuc2025" (casing varies, use verbatim)
      -> config.STATIC_CACHE_BASE_URL   e.g. "/live/data/"
      -> app_version                    e.g. "1.9.14" (check before trusting this spec)

GET {base}/{seasonId}_reference.json             season, divisions, pools, teams, countries
GET {base}/{seasonId}_teams.json                 per-team W/L, points for/against, spirit
GET {base}/{seasonId}_teams_{teamId}.json        squad list + player stats + spirit given/received
GET {base}/{seasonId}_games.json                 every game (scores, no detail)
GET {base}/{seasonId}_games_active.json          games in or near the current round
GET {base}/{seasonId}_games_{gameId}.json        rosters, every goal, spirit breakdown
GET {base}/{seasonId}_standings_{poolId}.json    one pool's table and fixtures
GET {base}/{seasonId}_spirit_{seriesId}.json     division spirit leaderboard
GET {base}/{seasonId}_players.json               index of every player id
GET {base}/{seasonId}_statistics_{seriesId}.json division player leaderboard
GET {base}/{seasonId}_statistics_top.json        event-wide single-game records
GET {base}/{seasonId}_config.json                full deployment config + provenance  (1.9 only)
GET {base}/{seasonId}_playerevents_{playerId}.json  one player's goals and assists     (3.0 only)
```

**On 1.9 there is no per-player endpoint.** The router has no route taking a player id, and `_players_{id}.json` returns 404; `_players.json` gives nothing but ids. Use `_teams_{teamId}.json` or `_statistics_{seriesId}.json` instead. 3.0 adds `playerevents`, which is a real per-player scoring history.

`_config.json` is a superset of the heartbeat's `config` block, worth knowing about for `LIVE_ALLOWED_ENTITIES` and its real cache lifetimes. **It does not exist on 3.0**, where `config` and `hb` are routed-only.

### Notes

- **`app_version` is a hint, not a guarantee**
  - It is read straight from `live/package.json`'s `version` field on every request, with no link to which `api/*.php` is actually deployed
  - A hand-patched install can therefore serve one generation's response shape next to a stale (or non-semver, or pre-release) version string
  - Prefer the shape markers in each spec's changelog when they disagree with it - e.g. `teams[].reg_id` present, `games[].time_utc` present and `seed.sotg_token` gone all mean 1.9.17+ regardless of what `app_version` says
- **CORS**
  - The static files above send `Access-Control-Allow-Origin: *`
  - The dynamic `index.php?view=live/api&entity=…` endpoint returns byte-identical bodies but sends no CORS headers
  - Therefore it cannot be used from a browser on another origin
  - On 1.9, use the static files for most use cases
  - **On 3.0 neither route is complete**: the static files are deleted once the event stops being publicly available, and the routed endpoint still has no CORS. Server-side, use the routed endpoint; in a browser, expect the static files to vanish after the event
- **Redirects**
  - Some tournaments live on their own subdomain
  - `results.wfdf.sport/wjuc-2026` 301s to `wjuc.wfdf.sport`, whose `STATIC_CACHE_BASE_URL` is `/live/data/` with no tournament prefix
  - `STATIC_CACHE_BASE_URL` is root-relative, so join it to the _origin_ of the _final_ response URL, not to the requested one
- **Booleans**
  - `0` / `1` integers everywhere except the heartbeat, which uses real JSON booleans
  - Several heartbeat numbers are sent as strings (`"120"`, `"1"`)
- **In-game `time`**
  - Values are seconds elapsed since the game clock started, not clock times
  - On 3.0, subtract `timer_paused_duration` to relate them to wall-clock - `uo_game.timer_start`/`timer_pause_start`/`timer_paused_duration` are a UltiOrganizer 4 addition with no equivalent on 1.9, which stores no clock start/pause state at all
- **Numeric strings are coerced to numbers**
  - Except for `name`, `fieldname`, `abbreviation`, `cache_version` and `app_version`, plus `pools` on 3.0
  - This is why `games[].name` arrives as `"534"` rather than `534`, and `games[].pools` as `"1016"`
- **IDs are only unique within a season**
  - Their range is not predictable
  - A dedicated install (`wmucc.wfdf.sport`) numbers each season from 1
  - A shared install hosting several events (`ultimatefederation.eu`) carries on from wherever the last one finished, so ids there start high
  - `country_id` is the exception, coming from a shared table in the 1000s
- **Overlapping id ranges**
  - `_standings_` takes a _pool_ id, `_spirit_` and `_statistics_` a _series_ id, `_games_` a _game_ id
  - The ranges overlap heavily, so the same number is a valid id for all of them
  - Never infer an entity type from a value
- **Fields are usually absent rather than null**
  - Treat nearly everything as optional
  - The games list is the strongest case: every `null`, `0`, `"0"` and `false` is stripped before the response is sent, so an absent field there is ambiguous between "unset" and "zero"
  - Empty strings survive, which is why `liveurl` sometimes appears as `""`
  - `homescore` and `visitorscore` are restored to `0` for any game that is not `scheduled`
- **`spiritgiven[]` and `spiritreceived[]`**
  - `.givenby` and `.givento` both hold the _opponent's_ name
  - Neither tells you the direction
  - Rely on which array the record came from
- **`spiritstats` in game detail is inverted from what its keys suggest**
  - `spiritstats.hometeam` is the score awarded **to** the home team by the visitors
  - The response says so itself in a `note` field
- **`final_standing` vs `final_standing_calculated`**
  - `final_standing_calculated` is derived from results; prefer it
  - `final_standing` is the organiser's override, for disqualifications, forfeits and similar
  - `final_standing` is `0` in `_reference.json` for every team on this line, but populated in `_teams.json`
- **Player `games` counts appearances, not team fixtures**
  - Taken from the team sheet, so it varies between players in the same squad
  - It is the denominator for `doneavg`, `fedinavg` and `totalavg`
  - Ongoing games are excluded from every player statistic, so totals lag the live scores until a game is marked finished
- **`_standings_` returns HTML**
  - `standings.html` is UltiOrganizer's own rendering of the table, not structured data
  - Links are replaced by `{TEAM:123}`, `{POOL:64}` and `{GAME:377}` tokens for the client to substitute
  - Build structured standings from `standings.games` or `_teams.json` instead of parsing it
- **`_statistics_top.json` has two rough edges**
  - The `statistics` object carries a stray `"0": 0` member that is not a leaderboard
  - `topPairs` rows use raw SQL expressions as property names, holding the two player ids
- **Spirit leaderboards are means, not sums**
  - `_spirit_{seriesId}.json` gives per-game averages to two decimal places
  - Only games where both teams have submitted are counted
  - For sums use `spirit` on `_teams.json`
- **An id in the filename does not always mean the file is scoped to it**
  - `entity=players&id=N` ignores the id when building the response but still uses it to name the cache file
  - So a `_players_{N}.json`, if one has ever been requested, holds the _entire_ player list rather than one player
  - Likewise `_statistics.json` with no id resolves to series `0` and is always empty
- **Some fields depend on the deployment, not on the Live! version**
  - `series[].slug` appears only for divisions listed in the install's own `LIVE_SERIES_SLUGS` map, which is empty by default - it's Live!'s own field, just conditionally populated, so it's documented
  - The games query selects the whole `uo_game` row, so an install whose UltiOrganizer table has been extended sends its extra columns too (`ssdata` streaming metadata is one seen in the wild) - these aren't Live!'s own fields and aren't part of this spec, whatever shape they happen to take on a given install
  - On 3.0, `hasstarted` and `show_spirit` are core fields rather than install quirks, and are documented there
- **Not every entity becomes a static file**
  - `hb` and `wipe` are routed but were 404 as static files on every deployment checked
  - `config_static` is a redirect to `_heartbeat.json`, not data
  - `wipe` requires an authenticated admin session and returns 403 otherwise

## Legacy and unsupported deployments

A handful of known deployments serve the same response shape this spec documents but don't follow its normal conventions, because they predate one or more of: prefixed filenames, a discoverable season id in the heartbeat, or CORS at all. Their `app_version` values also tend to be build stamps or `dev` rather than a release, so they can't be version-matched by that field either - only by the shape markers described in the [changelog](#changelog).

For the current list of these, what specifically each one deviates on, and an archived copy of their data regardless, see [ultimate-tournament-results](https://github.com/cxd309/ultimate-tournament-results#legacy-deployments), which handles them with two additive flags on its own archiving tool.

## Related

- [Live! by BULA](https://beachultimate.org/livebybula/) - the software this API belongs to ([install guide and releases](https://github.com/layoutd/live-by-bula))
- [UltiOrganizer](https://github.com/ktolonen/ultiorganizer) - the tournament software underneath
- [ultimate-tournament-results](https://github.com/cxd309/ultimate-tournament-results) - archives every known deployment's data as a permanent, drop-in-compatible copy of this API

## Licence

The specification is released under the [MIT licence](LICENSE). It documents, but does not include or redistribute, Live! by BULA (© BULA Ltd, CC BY-NC-ND 4.0) or UltiOrganizer. The data it describes belongs to the event organisers.
