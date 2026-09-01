# live-by-bula-openapi

An unofficial [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) specification for the **Live! JSON API** - the feeds behind [Live! by BULA](https://beachultimate.org/livebybula/), the public results interface used by recent WFDF, EUC and BULA ultimate events.

Presented with Swagger UI and ReDoc.

**[Browse the documentation](https://cxd309.github.io/live-by-bula-openapi/)**

> Unofficial. Derived from the published Live! source and verified field by field against live deployments. Live! by BULA is © BULA Ltd. [UltiOrganizer](https://github.com/ktolonen/ultiorganizer) is a separate project. Neither has published, endorsed or reviewed this specification, and the API may break without warning.

## What this API actually is

UltiOrganizer is the database and the tournament admin. Live! by BULA drops a `live/` directory into an UltiOrganizer install and supplies the modern front end and this JSON API, UltiOrganizer has no API of its own. Most field names are UltiOrganizer's, which is why they read as lower-case run-together words - `teamname`, `fedinavg`, `done` for goals and `fedin` for assists.

Live! writes every response to a static JSON file and serves that. The dynamic endpoint at `index.php?view=live/api&entity=…` is what builds them, and returns byte-identical bodies, but sends no CORS headers.

## Version compatibility

Live! is versioned independently of this spec and **the API is not stable across patch releases**. Check `app_version` in `_heartbeat.json` before trusting this document - but check the response shape too where you can, since `app_version` is only a string in `package.json` and a deployment can drift from it, [as one already has](#known-deployments).

There is one spec per **distinct response shape**, named for the earliest release that produces it, because the shapes differ enough that a single document would have to caveat almost every field.

| Live! version     | Spec                  | Status                                                                      |
| ----------------- | --------------------- | --------------------------------------------------------------------------- |
| **1.9.14–1.9.16** | `openapi-1.9.14.yaml` | Complete. All 13 endpoints, verified against source and live data.          |
| **1.9.17**        | `openapi-1.9.17.yaml` | Complete. All 13 endpoints, verified against four deployments.              |
| **3.0.6**         | `openapi-3.0.6.yaml`  | Complete. Both transports, verified against WUCC 2026.                      |
| 1.8.x and older   | -                     | Not covered, see [Legacy deployments](#legacy-and-unsupported-deployments). |
| 2.x               | -                     | Not covered. Not seen on any live deployment.                               |

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

**Static files are on notice.** Live!'s own documentation calls them an internal cache rather than an interface, and deletes them once the event stops being publicly available. The routed endpoint is the stable one, but sends no CORS headers - so browser clients still have only the static files, and should expect them to vanish after the event.

### 1.9.17

| Change                             | What it means                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `teams[].reg_id` added             | Team registration id, now on the teams endpoint too. Always sent, `null` when the team has none.                    |
| `games[].time_utc` added           | UTC start time on every scheduled game. Use it instead of `season.utcOffset`, which is wrong across a clock change. |
| `seed.sotg_token` removed          | The team's private spirit-submission token is no longer published.                                                  |
| Heartbeat keeps its `config` block | Clearing the cache no longer strips `config`, which used to leave clients with no season id and no base path.       |
| Heartbeat sent with `no-cache`     | Config changes are picked up immediately instead of sitting in a browser cache.                                     |

## Known deployments

Values are read from each site's own `_heartbeat.json` and `_reference.json`. Season id casing varies and must be used verbatim. Tournament date is `season.starttime`-`season.endtime`, both local dates inclusive - note `endtime` is midnight on the last day, not its end.

| Event                    | Tournament start date | Host                                  | Live!   | Season id   | Base path               | Accessed   |
| ------------------------ | --------------------- | ------------------------------------- | ------- | ----------- | ----------------------- | ---------- |
| WMUCC 2026               | 2026-06-28            | `wmucc.wfdf.sport`                    | 1.9.17  | `wmucc2026` | `/live/data/`           | 2026-08-27 |
| WJUC 2026                | 2026-07-11            | `wjuc.wfdf.sport`                     | 1.9.17  | `wjuc2026`  | `/live/data/`           | 2026-08-27 |
| EYUC U17 2026 Vienna     | 2026-08-03            | `eyuc-schedule.ultimatefederation.eu` | 1.9.17  | `26EYUCVIE` | `/live/data/`           | 2026-08-27 |
| Elite Invite 2026 Leuven | 2026-05-23            | `elite-invite.ultimatefederation.eu`  | 1.9.17  | `26ELITLEU` | `/live/data/`           | 2026-08-27 |
| UKU Nationals 2026       | 2026-09-05            | `uku-schedule.ultimatefederation.eu`  | 1.9.17¹ | `26UKUNATS` | `/live/data/`           | 2026-09-01 |
| EUIC 2026                | 2026-01-29            | `euic-schedule.ultimatefederation.eu` | 1.9.16  | `euic2026`  | `/live/data/`           | 2026-08-27 |
| PAUC 2025                | 2025-12-01            | `results.pauc.sport`                  | 1.9.15  | `pauc2025`  | `/live/data/`           | 2026-08-27 |
| WBUC 2025                | 2025-11-16            | `wbuc.wfdf.sport`                     | 1.9.14  | `wbuc2025`  | `/live/data/`           | 2026-08-27 |
| WUCC 2026                | 2026-08-15            | `results.wfdf.sport/wucc-2026`        | 3.0.6   | `WUCC2026`  | `/wucc-2026/live/data/` | 2026-08-27 |

Each spec has a reference deployment that every schema was checked against: **WBUC 2025** for 1.9.14, **WMUCC 2026** for 1.9.17, **WUCC 2026** for 3.0.6. The 1.9.17 schemas were additionally cross-checked against WJUC 2026, EYUC 2026, Elite Invite 2026 and UKU Nationals 2026.

¹ UKU Nationals 2026's own heartbeat reports `app_version: 1.7.8`, which would place it below even the unsupported 1.8.x line - but every response matches 1.9.17 exactly: `teams[].reg_id` present, `games[].time_utc` present, `seed.sotg_token` gone. Checked against the plugin source (`live/api/ConstantsManager.php`), this is explained rather than coincidental - `app_version` is read straight from `live/package.json`'s `version` field on every request, with no link to which `api/*.php` is actually deployed, so a hand-patched install can serve current-generation shapes next to a stale version string. **Treat `app_version` as a hint, never a guarantee, and prefer the shape markers above when they disagree.** UKU Nationals 2026 is also the only deployment in this table probed before its event started (2026-09-05), so it is the one real-data confirmation this spec has for `status: "scheduled"` on both `season` and `games[]`.

Five further deployments are known and unsupported - all five are readable, see [Legacy and unsupported deployments](#legacy-and-unsupported-deployments).

## Repository layout

- `openapi-1.9.14.yaml`, `openapi-1.9.17.yaml`, `openapi-3.0.6.yaml` - the specifications, and the only files to edit by hand
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
  - Subtract `timer_paused_duration` to relate them to wall-clock
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
  - `series[].slug` appears only for divisions listed in the install's own `LIVE_SERIES_SLUGS` map, which is empty by default
  - `games[].ssdata`, `hasstarted` and `show_spirit` are extra `uo_game` columns on some installs, surfaced because the games query selects the whole row - on 3.0 `hasstarted` and `show_spirit` are core fields rather than install quirks
  - Expect others this spec does not list, and never treat any of them as guaranteed by a release
- **Not every entity becomes a static file**
  - `hb` and `wipe` are routed but were 404 as static files on every deployment checked
  - `config_static` is a redirect to `_heartbeat.json`, not data
  - `wipe` requires an authenticated admin session and returns 403 otherwise

## Legacy and unsupported deployments

Five known deployments are outside the supported set. Probed 2026-08-27 and every one serves the same response shape this spec documents, and none carry a field the 1.9.14 schema does not already describe. What varies is how you _find_ the data, not what comes back.

Their `app_version` values are build stamps or `dev` rather than releases, so none can be version-matched. The shape markers place all five on the **1.9.14–1.9.16** line: `seed.sotg_token` present, `teams[].reg_id` and `games[].time_utc` absent.

| Event                                                                                   | Tournament start date | `app_version`     | Season id   | Data base path           | Filenames  | CORS | Heartbeat            | What blocks it           |
| --------------------------------------------------------------------------------------- | --------------------- | ----------------- | ----------- | ------------------------ | ---------- | ---- | -------------------- | ------------------------ |
| [EBUCC 2025](https://live.ebucc.eu/live/data/reference.json)                            | 2025-06-06            | `20250612.082841` | `ebucc2025` | `/live/data/`            | unprefixed | `*`  | full, with `config`  | unprefixed filenames     |
| [EBUCC 2023](https://live.ebucc.eu/scores2023/live/data/reference.json)                 | 2023-06-09            | `20250612.082841` | `EBUCC2023` | `/scores2023/live/data/` | unprefixed | `*`  | full, with `config`  | unprefixed filenames     |
| [EUCF 2025 Wroclaw](https://eucf.ultimatefederation.eu/live/data/e2cf25_reference.json) | 2025-09-26            | `1.8.2`           | `e2cf25`    | `/live/data/`            | prefixed   | `*`  | no `config` block    | season id undiscoverable |
| [WBUCC 2024](https://live.wbucc.org/live/data/reference.json)                           | 2024-10-14            | `20241019.151221` | _(none)_    | `/live/data/`            | unprefixed | none | embedded in the HTML | no CORS                  |
| [WWUC 2025](https://results.wfdf.sport/wwuc/live/data/WWUC2025_reference.json)          | 2025-09-18            | `dev`             | `WWUC2025`  | `/wwuc/live/data/`       | prefixed   | `*`  | full, with `config`  | `app_version` only       |

EUCF 2025 and WBUCC 2024 serve a heartbeat with no `config` block, which is the same state the pre-1.9.17 bug in the [changelog](#1917) leaves a site in. Whether that is the cause here is unconfirmed: both run builds older than any release I have source for, so they may simply predate the feature. Either way the season id has to come from somewhere else - EUCF 2025's (`e2cf25`) is readable from `LIVE_SEASON_ID` in the SPA HTML at `/?view=live/index`.

## Related

- [Live! by BULA](https://beachultimate.org/livebybula/) - the software this API belongs to ([install guide and releases](https://github.com/layoutd/live-by-bula))
- [UltiOrganizer](https://github.com/ktolonen/ultiorganizer) - the tournament software underneath

## Licence

The specification is released under the [MIT licence](LICENSE). It documents, but does not include or redistribute, Live! by BULA (© BULA Ltd, CC BY-NC-ND 4.0) or UltiOrganizer. The data it describes belongs to the event organisers.
