# live-by-bula-openapi

An unofficial [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) specification for the **Live! JSON API** - the feeds behind [Live! by BULA](https://beachultimate.org/livebybula/), the public results interface used by recent WFDF, EUC and BULA ultimate events.

Presented with Swagger UI and ReDoc.

**[Browse the documentation](https://cxd309.github.io/live-by-bula-openapi/)**

> Unofficial. Derived from the published Live! source and verified field by field against live deployments. Live! by BULA is © BULA Ltd. [UltiOrganizer](https://github.com/ktolonen/ultiorganizer) is a separate project. Neither has published, endorsed or reviewed this specification, and the API may break without warning.

## What this API actually is

UltiOrganizer is the database and the tournament admin. Live! by BULA drops a `live/` directory into an UltiOrganizer install and supplies the modern front end and this JSON API, UltiOrganizer has no API of its own. Most field names are UltiOrganizer's, which is why they read as lower-case run-together words - `teamname`, `fedinavg`, `done` for goals and `fedin` for assists.

Live! writes every response to a static JSON file and serves that. The dynamic endpoint at `index.php?view=live/api&entity=…` is what builds them, and returns byte-identical bodies, but sends no CORS headers.

## Version compatibility

Live! is versioned independently of this spec and **the API is not stable across patch releases**. Check `app_version` in `_heartbeat.json` before trusting this document.

There is one spec per **distinct response shape**, named for the earliest release that produces it, because the shapes differ enough that a single document would have to caveat almost every field.

| Live! version     | Spec                  | Status                                                                      |
| ----------------- | --------------------- | --------------------------------------------------------------------------- |
| **1.9.14–1.9.16** | `openapi-1.9.14.yaml` | Complete. All 13 endpoints, verified against source and live data.          |
| **1.9.17**        | `openapi-1.9.17.yaml` | Complete. All 13 endpoints, verified against four deployments.              |
| **3.0.x**         | -                     | Planned.                                                                    |
| 1.8.x and older   | -                     | Not covered, see [Legacy deployments](#legacy-and-unsupported-deployments). |
| 2.x               | -                     | Not covered. Not seen on any live deployment.                               |

## Changelog

### 1.9.17

| Change                             | What it means                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `teams[].reg_id` added             | Team registration id, now on the teams endpoint too. Always sent, `null` when the team has none.                    |
| `games[].time_utc` added           | UTC start time on every scheduled game. Use it instead of `season.utcOffset`, which is wrong across a clock change. |
| `seed.sotg_token` removed          | The team's private spirit-submission token is no longer published.                                                  |
| Heartbeat keeps its `config` block | Clearing the cache no longer strips `config`, which used to leave clients with no season id and no base path.       |
| Heartbeat sent with `no-cache`     | Config changes are picked up immediately instead of sitting in a browser cache.                                     |

## Known deployments

Probed 2026-08-27. Values are read from each site's own `_heartbeat.json`. Season id casing varies and must be used verbatim.

| Event                    | Host                                  | Live!      | Season id   | Base path               |
| ------------------------ | ------------------------------------- | ---------- | ----------- | ----------------------- |
| WMUCC 2026               | `wmucc.wfdf.sport`                    | 1.9.17     | `wmucc2026` | `/live/data/`           |
| WJUC 2026                | `wjuc.wfdf.sport`                     | 1.9.17     | `wjuc2026`  | `/live/data/`           |
| EYUC U17 2026 Vienna     | `eyuc-schedule.ultimatefederation.eu` | 1.9.17     | `26EYUCVIE` | `/live/data/`           |
| Elite Invite 2026 Leuven | `elite-invite.ultimatefederation.eu`  | 1.9.17     | `26ELITLEU` | `/live/data/`           |
| EUIC 2026                | `euic-schedule.ultimatefederation.eu` | 1.9.16     | `euic2026`  | `/live/data/`           |
| PAUC 2025                | `results.pauc.sport`                  | 1.9.15     | `pauc2025`  | `/live/data/`           |
| **WBUC 2025**            | `wbuc.wfdf.sport`                     | **1.9.14** | `wbuc2025`  | `/live/data/`           |
| WUCC 2026                | `results.wfdf.sport/wucc-2026`        | 3.0.6      | `WUCC2026`  | `/wucc-2026/live/data/` |

Each spec has a reference deployment that every schema was checked against: **WBUC 2025** for 1.9.14, **WMUCC 2026** for 1.9.17. The 1.9.17 schemas were additionally cross-checked against WJUC 2026, EYUC 2026 and Elite Invite 2026.

Five further deployments are known and unsupported - all five are readable, see [Legacy and unsupported deployments](#legacy-and-unsupported-deployments).

## Repository layout

- `openapi-1.9.14.yaml`, `openapi-1.9.17.yaml` - the specifications, and the only files to edit by hand
- `docs/openapi-1.9.14.json`, `docs/openapi-1.9.17.json` - generated by `just build`, **do not edit**
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

Every event exposes the same set of static JSON files. Nothing is hardcoded - start at the heartbeat, which hands you the season id and base URL, then build the rest from it.

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
GET {base}/{seasonId}_config.json                full deployment config + setting provenance
```

There is **no per-player endpoint** on this line. The router has no route that takes a player id, and `_players_{id}.json` returns 404. `_players.json` gives nothing but ids; for names and numbers use `_teams_{teamId}.json` or `_statistics_{seriesId}.json`.

`_config.json` is a superset of the heartbeat's `config` block and is rarely what you want - the heartbeat is smaller and is what the front end actually reads. It is worth knowing about for `LIVE_ALLOWED_ENTITIES`, which lists the real server-side cache lifetimes.

### Notes

- **CORS**
  - The static files above send `Access-Control-Allow-Origin: *`
  - The dynamic `index.php?view=live/api&entity=…` endpoint returns byte-identical bodies but sends no CORS headers
  - Therefore it cannot be used from a browser on another origin
  - Use the static files for most use cases
- **Redirects**
  - Some tournaments live on their own subdomain
  - `results.wfdf.sport/wjuc-2026` 301s to `wjuc.wfdf.sport`, whose `STATIC_CACHE_BASE_URL` is `/live/data/` with no tournament prefix
  - `STATIC_CACHE_BASE_URL` is root-relative, so join it to the _origin_ of the _final_ response URL, not to the requested one
- **Booleans**
  - `0` / `1` integers everywhere except the heartbeat, which uses real JSON booleans
  - Several heartbeat numbers are sent as strings (`"120"`, `"1"`)
- **In-game `time`**
  - Values are seconds elapsed since the game clock started, not clock times
  - Subtract `timer_paused_duration` to relate them to wall-clock
- **Numeric strings are coerced to numbers**
  - Except for `name`, `fieldname`, `abbreviation`, `cache_version` and `app_version`
  - This is why `games[].name` arrives as `"534"` rather than `534`
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
  - `series[].slug` appears only for divisions listed in the install's own `LIVE_SERIES_SLUGS` map, which is empty by default
  - `games[].ssdata`, `hasstarted` and `show_spirit` are extra `uo_game` columns on some installs, surfaced because the games query selects the whole row
  - Expect others this spec does not list, and never treat any of them as guaranteed by a release
- **Not every entity becomes a static file**
  - `hb` and `wipe` are routed but were 404 as static files on every deployment checked
  - `config_static` is a redirect to `_heartbeat.json`, not data
  - `wipe` requires an authenticated admin session and returns 403 otherwise

## Legacy and unsupported deployments

Five known deployments are outside the supported set. Probed 2026-08-27 and every one serves the same response shape this spec documents, and none carry a field the 1.9.14 schema does not already describe. What varies is how you _find_ the data, not what comes back.

Their `app_version` values are build stamps or `dev` rather than releases, so none can be version-matched. The shape markers place all five on the **1.9.14–1.9.16** line: `seed.sotg_token` present, `teams[].reg_id` and `games[].time_utc` absent.

| Event                                                                                   | `app_version`     | Season id   | Data base path           | Filenames  | CORS | Heartbeat            | What blocks it           |
| --------------------------------------------------------------------------------------- | ----------------- | ----------- | ------------------------ | ---------- | ---- | -------------------- | ------------------------ |
| [EBUCC 2025](https://live.ebucc.eu/live/data/reference.json)                            | `20250612.082841` | `ebucc2025` | `/live/data/`            | unprefixed | `*`  | full, with `config`  | unprefixed filenames     |
| [EBUCC 2023](https://live.ebucc.eu/scores2023/live/data/reference.json)                 | `20250612.082841` | `EBUCC2023` | `/scores2023/live/data/` | unprefixed | `*`  | full, with `config`  | unprefixed filenames     |
| [EUCF 2025 Wroclaw](https://eucf.ultimatefederation.eu/live/data/e2cf25_reference.json) | `1.8.2`           | `e2cf25`    | `/live/data/`            | prefixed   | `*`  | no `config` block    | season id undiscoverable |
| [WBUCC 2024](https://live.wbucc.org/live/data/reference.json)                           | `20241019.151221` | _(none)_    | `/live/data/`            | unprefixed | none | embedded in the HTML | no CORS                  |
| [WWUC 2025](https://results.wfdf.sport/wwuc/live/data/WWUC2025_reference.json)          | `dev`             | `WWUC2025`  | `/wwuc/live/data/`       | prefixed   | `*`  | full, with `config`  | `app_version` only       |

EUCF 2025 and WBUCC 2024 serve a heartbeat with no `config` block, which is the same state the pre-1.9.17 bug in the [changelog](#1917) leaves a site in. Whether that is the cause here is unconfirmed: both run builds older than any release I have source for, so they may simply predate the feature. Either way the season id has to come from somewhere else - EUCF 2025's (`e2cf25`) is readable from `LIVE_SEASON_ID` in the SPA HTML at `/?view=live/index`.

## Related

- [Live! by BULA](https://beachultimate.org/livebybula/) - the software this API belongs to ([install guide and releases](https://github.com/layoutd/live-by-bula))
- [UltiOrganizer](https://github.com/ktolonen/ultiorganizer) - the tournament software underneath

## Licence

The specification is released under the [MIT licence](LICENSE). It documents, but does not include or redistribute, Live! by BULA (© BULA Ltd, CC BY-NC-ND 4.0) or UltiOrganizer. The data it describes belongs to the event organisers.
