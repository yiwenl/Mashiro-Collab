# Vendored tracking libraries

These source snapshots make this prototype independent of sibling checkouts and GitHub package access. Upstream source files are retained unchanged. Install dependencies with `npm ci` from `prototypes/circles08/`, where this prototype's package.json lives; do not install inside vendor libraries or the repository root.

| Library | Upstream | Source revision | License declared by upstream package |
| --- | --- | --- | --- |
| Digit | https://github.com/yiwenl/digit | `46347d7f04198eea46a8a0cea052398170907713` | ISC |
| Kinetic | https://github.com/yiwenl/kinetic | `537d28d5f7480b86fe0f07b7ddb0bea31e13b9fd` | ISC |
| camera-manager | https://github.com/yiwenl/camera-manager | `67f8d07d18d0fcdb4854057561227fca3f94bdba` | ISC |

The camera-manager revision matches both trackers’ installed lockfile dependency in the original experiment. It is intentionally not taken from a newer checkout.

Webpack resolves each tracker’s `@mediapipe/tasks-vision` import to its pinned npm alias (`mediapipe-digit` 0.10.32 / `mediapipe-kinetic` 1.0.1). The TypeScript loader adjusts the runtime WASM URL to that same version at build time. This preserves the source snapshots and the original experiment’s runtime versions. Both trackers share this camera-manager source through local aliases.

The original Digit and Kinetic package metadata both declare ISC. Their source checkouts did not contain separate LICENSE files. Other npm dependencies retain their own license files under `node_modules`; production builds retain generated license notices.
