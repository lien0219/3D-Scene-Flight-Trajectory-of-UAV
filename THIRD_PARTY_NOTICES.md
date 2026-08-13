# Third-Party Notices

This document records assets and services that are not covered by the repository's MIT license or that require separate terms.

## UAV model asset

`web/src/assets/uav.gltf` was created specifically for this repository from primitive geometry and is covered by the repository MIT license. It replaces earlier model files whose source and redistribution terms were not documented.

## Screenshot assets

Files under `web/src/img/default/` are screenshots of this project. They may include map imagery rendered from the service described below and must not be treated as independently licensed map data.

## Map imagery

The default scene requests satellite tiles from AutoNavi (Gaode) at runtime. The tile service and imagery are not bundled with this repository and are subject to the provider's terms, availability, access controls, coordinate system, and attribution requirements. Public or commercial deployments should review those terms and replace the imagery provider when needed.

## Software dependencies

Go and npm dependencies remain under their respective licenses. Their versions are recorded in `api/go.sum` and `web/pnpm-lock.yaml`.
