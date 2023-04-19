# KmeansColors JS

A javascript wrapper for [kmeans_colors](https://github.com/okaneco/kmeans-colors) rust crate

## Installation
```s
npm i kmeans-colors
```

## Usage
```js
import KmeansColors, { defaultFlags } from 'kmeans-colors'

const flags = defaultFlags('imagePath')
const {stdout} = await KmeansColors.exec(flags)

console.log(stdout)
// cc8049,98562b,4f290f,1c1009,d13607,e7c912,4a72c5,2eb30c
// 0.3831,0.2084,0.1361,0.0845,0.0806,0.0530,0.0281,0.0262
```

### Flags

All available flags from `kmeans_colors` binary executable is available. By default `KmeansColors JS` sets the following default flags object using the `defaultFlags` utility:
```js
{
    "no-file": true,
    print: true,
    rgb: true,
    sort: true,
    pct: true,
    input: imagePath,
}
```

To use a different sets of flags just build an object containing valid flags, note that input flag must always be present:
```js
import KmeansColors from 'kmeans-colors'

const flags = {
    iterations: 30,
    ext: 'jpeg',
    print: true,
    rgb: true,
    pct: true,
    input: imagePath,
}

const {stdout} = await KmeansColors.exec(flags)

console.log(stdout)
// cc8049,98562b,4f290f,1c1009,d13607,e7c912,4a72c5,2eb30c
// 0.3831,0.2084,0.1361,0.0845,0.0806,0.0530,0.0281,0.0262
```

For more info about flags, visit the original [repo](https://github.com/okaneco/kmeans-colors) or simply run the `kmeans_colors` executable with the `--help` flag:
```s
./kmeans_colors --help
```

### Custom binary path

For convenience we can also initialize `KmeansColors` with a custom binary path using `create` utility:

```js
import { create: kmeansColors } from 'kmeans-colors'

const KmeansColors = kmeansColors('path/to/kmeans_colors_executable')
```