# Third-party notices

The application code is distributed under the MIT License in `LICENSE`.
Third-party data and map services retain their own terms; the MIT license does
not relicense them.

## Korean historical records

- Provider: 한국학중앙연구원
- Source: https://www.data.go.kr/data/15052752/fileData.do
- License: 공공데이터포털 표시 “이용허락범위 제한 없음”
- `prisma/real-data.json` is the normalized derivative of this public dataset;
  attribution is retained in this notice and the dataset manifest.

## Academy of Korean Studies encyclopedia facts

The location summaries use only facts from entries whose text is owned by the
Academy of Korean Studies. Its [content-use guide](https://encykorea.aks.ac.kr/Guide/ContentUse)
states that those texts may be freely used under Article 24-2 of the Korean
Copyright Act. No encyclopedia images or verbatim article text are bundled.

## Map tiles

- Provider: OpenStreetMap contributors
- Copyright: https://www.openstreetmap.org/copyright
- Tile policy: https://operations.osmfoundation.org/policies/tiles/
- Data license: https://osmfoundation.org/wiki/Licence
- Tiles are fetched at runtime from the provider configured by
  `NEXT_PUBLIC_MAP_TILE_URL`; no OSM tiles or database are bundled in this
  repository.

## Location evidence

Location evidence is accepted into the public layer only when its record has
an official HTTPS source and a compatible redistribution license recorded in
`prisma/clan-research.json`. User-reported locations remain hidden from the
public layer until independently verified.

## Excluded research source

The Academy of Korean Studies Korean Studies Materials Portal exposes a family-name
and place-of-origin database at
https://kostma.aks.ac.kr/eng/sub/gatewayServiceView.aspx?gwCorpsId=3&gwServiceId=5.
Its public reuse and derivative-work terms could not be verified, so it is
import-only and deliberately excluded from the repository and deployment bundle.
No portal text or records are copied here.
