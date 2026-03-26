# @synatic/json-magic

Utilities for manipulating JSON objects and arrays using path-based access and transformation helpers.

## Features

- Path parsing and compilation (`parsePath`, `compilePath`)
- Read/write operations on nested values (`has`, `get`, `set`, `remove`)
- Flattening utilities (`pathDict`, `pathArray`, `walk`)
- Structure and value transforms (`renameKey`, `changeValue`, `setProperty`)
- Data cleanup helpers (`convertDateTOISOString`, `fixForMongo`)
- TypeScript definitions included (`index.d.ts`)

## Requirements

- Node.js `>=22`
- npm `>=10`

## Installation

```bash
npm install @synatic/json-magic
```

## Usage

```js
const $json = require('@synatic/json-magic');

const payload = {
    user: {
        profile: {
            firstName: 'Ada',
            tags: ['admin'],
        },
    },
};

// Read values
const firstName = $json.get(payload, '/user/profile/firstName');

// Write values
$json.set(payload, '/user/profile/lastName', 'Lovelace');

// Check/remove values
const hasTags = $json.has(payload, '/user/profile/tags');
$json.remove(payload, '/user/profile/tags/0');

console.log({ firstName, hasTags, payload });
```

## Common API

### Path helpers

- `parsePath(path, separator?, ignoreSeparator?)`: parse a path string/array into path segments.
- `compilePath(pathArray, separator?, ignoreLeading?)`: build a path string from path segments.

### Access and mutation

- `has(obj, path)`: returns `true` if the path exists.
- `get(obj, path, separator?, ignoreSeparator?)`: gets a nested value.
- `set(obj, path, value, ignoreSeparator?)`: sets a nested value.
- `remove(obj, path)`: removes a nested value.

### Flattening and traversal

- `pathDict(obj, separator?)`: returns `{ [path]: value }` for leaf paths.
- `pathArray(obj, format?)`: returns `[{ path, value }]` for leaf paths.
- `walk(obj, iterator, separator?)`: invokes an iterator for each leaf value/path.

### Transformations

- `renameKey(obj, renamer, separator?)`: renames keys recursively.
- `changeValue(obj, changer, separator?)`: updates values conditionally.
- `convertDateTOISOString(obj)`: converts `Date` values to ISO strings.
- `fixForMongo(obj)`: sanitizes keys for Mongo-compatible storage:
  - keys starting with `$` are prefixed with `_`
  - `.` in keys is replaced with `_`
- `setProperty(obj, property, value, override?)`: sets a property on objects recursively.

## Examples

### Dot notation and slash notation

```js
const $json = require('@synatic/json-magic');

const data = { a: { b: { c: 1 } } };

console.log($json.get(data, '/a/b/c')); // 1
console.log($json.get(data, 'a.b.c')); // 1
```

### Build a path dictionary

```js
const $json = require('@synatic/json-magic');

const data = { a: { b: { c: 1, d: 2 } } };
console.log($json.pathDict(data));
// { '/a/b/c': 1, '/a/b/d': 2 }
```

### Rename keys for Mongo safety

```js
const $json = require('@synatic/json-magic');

const data = { $a: { 'b.c': 1 } };
$json.fixForMongo(data);
console.log(data);
// { _a: { b_c: 1 } }
```

## Development

Install dependencies:

```bash
npm install
```

Available scripts:

- `npm run lint` - run ESLint
- `npm run lint-fix` - run ESLint with `--fix`
- `npm run lint-errors` - show only lint errors
- `npm run prettier` - format project files
- `npm test` - run test suite
- `npm run test-ci` - run tests with CI coverage summary
- `npm run test-cov` - run tests with LCOV output

## CI and Publishing

- CI build runs lint and tests on Node 22 and Node 24.
- Package validation includes `npm pack`.
- npm publishing is triggered by creating a GitHub release.

## License

MIT
