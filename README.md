# find-replace-cli

## Install

```
npm install find-replace-cli -g
```

## Usage

### Convert Jasmine Tests to Mocha/Chai

```shell
find-replace-cli $(npm root -g)/find-replace-cli/src/presets/jasmine-to-mocha.json
```

### Custom Configuration File

```shell
find-replace-cli ./path/to/config/file.json
```
