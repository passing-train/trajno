# Trajno

Cross platform time tracker using the passing train methodology.

## Development

### Install from Nixos

Currently WIP situation

```
clone
cd trajno
nix-shell
npm install --openssl_fips=''
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```


### New release

- update and commit changelog
- make sure no compile errors
- npm run release-git
- npm run build
- cd dist_electron && ln -sf Trajno-0.6.2.AppImage Trajno-latest.AppImage

