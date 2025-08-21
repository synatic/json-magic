const assert = require('assert');
const $check = require('check-types');
const {ObjectId, Binary, Timestamp} = require('bson');

const $json = require('../index.js');

describe('JSON Magic', function () {
    describe('parse path', function () {
        it('should parse a pointer path', function () {
            assert.deepStrictEqual($json.parsePath('a/b/c'), ['a', 'b', 'c'], 'Invalid parse');
        });

        it('should parse a pointer path with leading slash', function () {
            assert.deepStrictEqual($json.parsePath('/a/b/c'), ['a', 'b', 'c'], 'Invalid parse');
        });

        it('should parse a dot path', function () {
            assert.deepStrictEqual($json.parsePath('a.b.c'), ['a', 'b', 'c'], 'Invalid parse');
        });

        it('should parse a dot path with leading dot', function () {
            assert.deepStrictEqual($json.parsePath('.a.b.c'), ['a', 'b', 'c'], 'Invalid parse');
        });

        it('should parse unknown separator path', function () {
            assert.deepStrictEqual($json.parsePath('/a.b.c'), ['/a', 'b', 'c'], 'Invalid parse');
        });

        it('should parse a specified separator', function () {
            assert.deepStrictEqual($json.parsePath('a$$b$$c', '$$'), ['a', 'b', 'c'], 'Invalid parse');
        });

        it('should parse ignoring separator', function () {
            assert.deepStrictEqual($json.parsePath('a$$b$$c', '$$', true), ['a$$b$$c'], 'Invalid parse');
        });

        it('should parse ignoring separator with a leading dot', function () {
            assert.deepStrictEqual($json.parsePath('.a.b.c', null, true), ['a.b.c'], 'Invalid parse');
        });

        it('should parse ignoring separator with a leading slash', function () {
            assert.deepStrictEqual($json.parsePath('/a/b/c', null, true), ['a/b/c'], 'Invalid parse');
        });

        it('should parse unknown separator path ignoring separator', function () {
            assert.deepStrictEqual($json.parsePath('.a/b/c', null, true), ['.a/b/c'], 'Invalid parse');
        });

        it('should parse specified dot separator path ignoring separator', function () {
            assert.deepStrictEqual($json.parsePath('.a/b/c', '.', true), ['a/b/c'], 'Invalid parse');
        });

        it('should parse specified text dot separator path ignoring separator', function () {
            assert.deepStrictEqual($json.parsePath('.a/b/c', 'dot', true), ['a/b/c'], 'Invalid parse');
        });

        it('should parse specified slash separator path ignoring separator', function () {
            assert.deepStrictEqual($json.parsePath('/a.b.c', '/', true), ['a.b.c'], 'Invalid parse');
        });
    });

    describe('compile path', function () {
        it('should throw an error on invalid request', function () {
            assert.throws(
                () => {
                    $json.compilePath('a,b,c');
                },
                Error,
                'Invalid compile'
            );
        });

        it('should compile a path', function () {
            assert.deepStrictEqual($json.compilePath(['a', 'b', 'c']), '/a/b/c', 'Invalid compile');
        });

        it('should compile a path with dot', function () {
            assert.deepStrictEqual($json.compilePath(['a', 'b', 'c'], '.'), 'a.b.c', 'Invalid compile');
        });

        it('should compile a path with separator', function () {
            assert.deepStrictEqual($json.compilePath(['a', 'b', 'c'], '$$', true), 'a$$b$$c', 'Invalid compile');
        });
    });

    describe('has', function () {
        it('should check a defined path', function () {
            assert($json.has({a: {b: {c: 1}}}, '/a/b/c'), 'Invalid defined check');
        });

        it('should check a path not defined', function () {
            assert(!$json.has({a: {b: null}}, '/a/b/c'), 'Invalid defined check');
        });

        it('should check a path defined array', function () {
            assert($json.has({a: {b: [{c: 1}, {c: 2}]}}, '/a/b/0/c'), 'Invalid defined check');
        });

        it('should check a path not defined array', function () {
            assert(!$json.has({a: {b: [{d: 1}, {c: 2}]}}, '/a/b/0/c'), 'Invalid defined check');
        });

        it('should check a path not defined array dot', function () {
            assert(!$json.has({a: {b: [{d: 1}, {c: 2}]}}, 'a.b.0.c'), 'Invalid defined check');
        });

        it('should has 1', function () {
            assert($json.has({a: {b: {c: 1}}}, 'a.b'), 'Invalid Has');
        });

        it('should has array', function () {
            assert($json.has([{a: {b: {c: 1}}}], '0.a.b'), 'Invalid Has');
        });

        it('should not has 1', function () {
            assert(!$json.has({a: {b: {c: 1}}}, 'a.x'), 'Invalid Has');
        });

        it('should has error null', function () {
            assert(!$json.has(null, 'a.x'), 'Invalid Has');
        });

        it('should has error string', function () {
            assert(!$json.has('a', 'a.x'), 'Invalid Has');
        });
    });

    describe('get attribute', function () {
        it('should get a value 1', function () {
            assert.deepStrictEqual($json.get({a: {b: {c: 1}}}, ''), {a: {b: {c: 1}}}, 'Invalid get');
        });

        it('should get a value 2', function () {
            assert.deepStrictEqual($json.get({a: {b: {c: 1}}}, '.a.b.c'), 1, 'Invalid get');
        });

        it('should get a value 3', function () {
            assert.deepStrictEqual($json.get({a: {b: {c: 1}}}, 'a.b'), {c: 1}, 'Invalid get');
        });

        it('should get a value 4', function () {
            assert.deepStrictEqual($json.get({a: {b: {c: 1}}}, '/a/b'), {c: 1}, 'Invalid get');
        });

        it('should get a value 5', function () {
            assert.deepStrictEqual($json.get([{a: {b: {c: 1}}}], '0/a/b'), {c: 1}, 'Invalid get');
        });

        it('should error on get a value on string', function () {
            assert.throws(
                function () {
                    $json.get('xxx', '/');
                },
                Error,
                'Invalid Error thrown'
            );
        });

        it('should error on get a value on null', function () {
            assert.throws(
                function () {
                    $json.get(null, '/a/x/c');
                },
                Error,
                'Invalid Error thrown'
            );
        });

        it('should throw an error on an invalid path', function () {
            assert.throws(
                function () {
                    $json.get({a: {b: {c: 1}}}, '/a/x/c');
                },
                Error,
                'Invalid Error thrown'
            );
        });

        it('should get a value ignoring separator 1', function () {
            assert.deepStrictEqual($json.get({'b/c': 1}, '/b/c', null, true), 1, 'Invalid get');
        });

        it('should get a value ignoring separator 2', function () {
            assert.deepStrictEqual($json.get({'b/c/d': 1}, '/b/c/d', null, true), 1, 'Invalid get');
        });

        it('should get a value ignoring separator 3', function () {
            assert.deepStrictEqual($json.get({'b.c': 1}, '/b.c', null, true), 1, 'Invalid get');
        });

        it('should get a value ignoring separator 4', function () {
            assert.deepStrictEqual($json.get({'b.c.d': 1}, '.b.c.d', null, true), 1, 'Invalid get');
        });

        it('should throw an error on an invalid path ignoring separator', function () {
            assert.throws(
                function () {
                    // eslint-disable-next-line no-unused-vars
                    const val = $json.get({'b.c.d': 1}, '/b.c.d', null, true);
                },
                Error,
                'Invalid Get error'
            );
        });

        it('should get a value on a dot path ignoring separator', function () {
            assert.deepStrictEqual($json.get({'b.c': 1}, '.b.c', '.', true), 1, 'Invalid get');
        });

        it('should get a value without ignoring separator 1', function () {
            assert.deepStrictEqual($json.get({b: {c: 1}}, '/b/c', null, false), 1, 'Invalid get');
        });

        it('should get a value without ignoring separator 2', function () {
            assert.deepStrictEqual($json.get({b: {c: {d: 1}}}, '/b/c/d', null, false), 1, 'Invalid get');
        });

        it('should get a value without ignoring separator 3', function () {
            assert.deepStrictEqual($json.get({'b.c': 1}, '/b.c', null, false), 1, 'Invalid get');
        });

        it('should get a value without ignoring separator 4', function () {
            assert.deepStrictEqual($json.get({b: {c: {d: 1}}}, '.b.c.d', null, false), 1, 'Invalid get');
        });

        it('should throw an error on an invalid path without ignoring separator', function () {
            assert.throws(
                function () {
                    // eslint-disable-next-line no-unused-vars
                    const val = $json.get({'b.c.d': 1}, '/b.c.d', null, false);
                },
                Error,
                'Invalid Get error'
            );
        });
    });

    describe('set attribute', function () {
        it('should set a value 1 ', function () {
            const val = {};
            $json.set(val, '.a.b.c', 1);
            assert.deepStrictEqual(val, {a: {b: {c: 1}}}, 'Invalid set');
        });

        it('should set a value 2', function () {
            const val = {};
            $json.set(val, '.a.b', {c: 1});
            assert.deepStrictEqual(val, {a: {b: {c: 1}}}, 'Invalid set');
        });

        it('should set a value 3', function () {
            const val = {};
            $json.set(val, '/a/b', {c: 1});
            assert.deepStrictEqual(val, {a: {b: {c: 1}}}, 'Invalid set');
        });

        it('should set a value 4', function () {
            const val = {};
            $json.set(val, 'a', '1');
            assert.deepStrictEqual(val, {a: '1'}, 'Invalid set');
        });

        it('should set a value 5 ', function () {
            const val = [];
            $json.set(val, '/0', 'Val1');
            assert.deepStrictEqual(val, ['Val1'], 'Invalid set');
        });

        it('should set an array value ', function () {
            const val = {
                a: {
                    b: [
                        {
                            c: [{d: 'one', e: 1}],
                        },
                        {
                            c: [{d: 'two', e: 2}],
                        },
                        {
                            c: [{d: 'three', e: 3}],
                        },
                    ],
                },
            };
            $json.set(val, ['a', 'b', '1', 'c'], [{d: 'twofix', e: 2.1}]);
            assert.deepStrictEqual(
                val,
                {
                    a: {
                        b: [
                            {
                                c: [{d: 'one', e: 1}],
                            },
                            {
                                c: [{d: 'twofix', e: 2.1}],
                            },
                            {
                                c: [{d: 'three', e: 3}],
                            },
                        ],
                    },
                },
                'Invalid set'
            );
        });

        it('should set a value 6', function () {
            const val = {a: {b: {c: null}}};
            $json.set(val, '/a/b/c', 1);
            assert.deepStrictEqual(val, {a: {b: {c: 1}}}, 'Invalid set');
        });

        it('should throw an error on a non object', function () {
            assert.throws(
                function () {
                    const val = 'xxx';
                    $json.set(val, {c: 1}, '/a/x');
                },
                Error,
                'Invalid Error thrown'
            );
        });

        it('should not set a null object', function () {
            assert.throws(
                function () {
                    const val = null;
                    $json.set(val, {c: 1}, '/a/x');
                },
                Error,
                'Invalid Error thrown'
            );
        });

        it('should set a value ignoring separator 1', function () {
            const val = {};
            $json.set(val, '/a/b', 1, true);
            assert.deepStrictEqual(val, {'a/b': 1}, 'Invalid set');
        });

        it('should set a value ignoring separator 2', function () {
            const val = {};
            $json.set(val, '/a/b/c', 1, true);
            assert.deepStrictEqual(val, {'a/b/c': 1}, 'Invalid set');
        });

        it('should set a value ignoring separator 3', function () {
            const val = {};
            $json.set(val, '/a.b', 1, true);
            assert.deepStrictEqual(val, {'a.b': 1}, 'Invalid set');
        });

        it('should set a value without ignoring separator 1', function () {
            const val = {};
            $json.set(val, '/a/b', 1, false);
            assert.deepStrictEqual(val, {a: {b: 1}}, 'Invalid set');
        });

        it('should set a value without ignoring separator 2', function () {
            const val = {};
            $json.set(val, '/a/b/c', 1, false);
            assert.deepStrictEqual(val, {a: {b: {c: 1}}}, 'Invalid set');
        });

        it('should set a value without ignoring separator 3', function () {
            const val = {};
            $json.set(val, '/a.b.c', 1, false);
            assert.deepStrictEqual(val, {'/a': {b: {c: 1}}}, 'Invalid set');
        });

        it('should set a value without ignoring separator 4', function () {
            const val = {};
            $json.set(val, '/a.b', 1, false);
            assert.deepStrictEqual(val, {'a.b': 1}, 'Invalid set');
        });

        it('should set a value without ignoring separator 5', function () {
            const val = {};
            $json.set(val, '.a/b', 1, false);
            assert.deepStrictEqual(val, {'.a': {b: 1}}, 'Invalid set');
        });
    });

    describe('remove attribute', function () {
        it('should remove a value', function () {
            const val = {a: {b: {c: 1}}};
            $json.remove(val, '/a/b/c');
            assert.deepStrictEqual(val, {a: {b: {}}}, 'Invalid remove');
        });

        it('should remove a value', function () {
            const val = {a: {b: {c: 1}}};
            $json.remove(val, '/a/b');
            assert.deepStrictEqual(val, {a: {}}, 'Invalid remove');
        });
    });

    describe('path dictionary', function () {
        it('should get a pathDict', function () {
            const val = {a: {b: {c: 1, d: 2}}};

            assert.deepStrictEqual($json.pathDict(val), {'/a/b/c': 1, '/a/b/d': 2}, 'Invalid paths');
        });

        it('should get a pathDict with dot', function () {
            const val = {a: {b: {c: 1, d: 2}}};
            assert.deepStrictEqual($json.pathDict(val, 'dot'), {'a.b.c': 1, 'a.b.d': 2}, 'Invalid paths');
        });

        it('should get a pathDict with dot 2', function () {
            const val = {a: {b: {c: 1, d: 2}, x: 'abc'}};
            assert.deepStrictEqual($json.pathDict(val, 'dot'), {'a.b.c': 1, 'a.b.d': 2, 'a.x': 'abc'}, 'Invalid paths');
        });
        it('should get a pathDict with dot 3', function () {
            const val = [{a: {b: {c: 1, d: 2}}}];
            assert.deepStrictEqual($json.pathDict(val, 'dot'), {'0.a.b.c': 1, '0.a.b.d': 2}, 'Invalid paths');
        });
    });

    describe('path array', function () {
        it('should get a pathArr', function () {
            const val = {a: {b: {c: 1, d: 2}}};

            assert.deepStrictEqual(
                $json.pathArray(val),
                [
                    {path: '/a/b/c', value: 1},
                    {
                        path: '/a/b/d',
                        value: 2,
                    },
                ],
                'Invalid paths'
            );
        });

        it('should get a pathArr with dot', function () {
            const val = {a: {b: {c: 1, d: 2}}};

            assert.deepStrictEqual(
                $json.pathArray(val, 'dot'),
                [
                    {path: 'a.b.c', value: 1},
                    {
                        path: 'a.b.d',
                        value: 2,
                    },
                ],
                'Invalid paths'
            );
        });

        it('should get a pathArr with dot 2', function () {
            const val = {a: {b: {c: 1, d: 2}, x: 'abc'}};
            assert.deepStrictEqual(
                $json.pathArray(val, 'dot'),
                [
                    {path: 'a.b.c', value: 1},
                    {
                        path: 'a.b.d',
                        value: 2,
                    },
                    {path: 'a.x', value: 'abc'},
                ],
                'Invalid paths'
            );
        });
    });

    describe('walk', function () {
        it('should walk', function () {
            const val = {a: {b: {c: 1, d: 2}, x: 'abc'}};
            const walkedVals = {};
            $json.walk(val, function (value, path) {
                walkedVals[path] = value;
            });
            assert.deepStrictEqual(walkedVals, {'/a/b/c': 1, '/a/b/d': 2, '/a/x': 'abc'}, 'Invalid walk');
        });

        it('should walk an array', function () {
            const val = {a: {b: {c: 1, d: 2}, x: [{length: 10}, {a: 1}]}};
            const walkedVals = {};
            $json.walk(val, function (value, path) {
                walkedVals[path] = value;
            });
            assert.deepStrictEqual(
                walkedVals,
                {
                    '/a/b/c': 1,
                    '/a/b/d': 2,
                    '/a/x/0/length': 10,
                    '/a/x/1/a': 1,
                },
                'Invalid walk'
            );
        });

        it('should walk dot', function () {
            const val = {a: {b: {c: 1, d: 2}, x: 'abc'}};
            const walkedVals = {};
            $json.walk(
                val,
                function (value, path) {
                    walkedVals[path] = value;
                },
                '.'
            );
            assert.deepStrictEqual(walkedVals, {'a.b.c': 1, 'a.b.d': 2, 'a.x': 'abc'}, 'Invalid walk');
        });

        it('should walk string', function () {
            const val = 'abc';
            $json.walk(val, function (value, path) {
                assert.equal(path, '/', 'Invalid path');
                assert.equal(value, 'abc', 'invalid value');
            });
        });
    });

    describe('rename key', function () {
        it('should not rename key', function () {
            let val = {a: {b: {c: 1, d: 2}, x: 'abc'}};

            val = $json.renameKey(val, (key, path) => {
                return key;
            });
            assert.deepStrictEqual(val, {a: {b: {c: 1, d: 2}, x: 'abc'}}, 'Invalid key rename');
        });

        it('should rename a key', function () {
            let val = {a: {b: {c: 1, d: 2}, x: 'abc'}};

            val = $json.renameKey(val, (key, path) => {
                if (key === 'c') {
                    return 'r';
                }
            });
            assert.deepStrictEqual(val, {a: {b: {r: 1, d: 2}, x: 'abc'}}, 'Invalid key rename');
        });

        it('should rename a key with array', function () {
            let val = {
                a: {
                    b: [
                        {c: 1, d: 2},
                        {c: 4, d: 5},
                    ],
                    x: 'abc',
                },
            };

            val = $json.renameKey(val, (key, path) => {
                if (key === 'c') {
                    return 'r';
                } else if (key === 'x') {
                    return 'x2';
                }
            });
            assert.deepStrictEqual(
                val,
                {
                    a: {
                        b: [
                            {r: 1, d: 2},
                            {r: 4, d: 5},
                        ],
                        x2: 'abc',
                    },
                },
                'Invalid key rename'
            );
        });

        it('should rename complex', function () {
            let val = require('./data/complex-json-object.json');

            val = $json.renameKey(val, (key, path) => {
                if (!key) {
                    return key;
                }
                if (!$check.string(key)) {
                    return key;
                }
                if (key.startsWith('$')) {
                    key = '_' + key.substring(1);
                }
                key = key.replace(/\./g, '_');

                return key;
            });
            assert.deepStrictEqual(val, require('./data/complex-json-object-result.json'), 'Invalid key rename');
        });

        it('should rename a key for mongo', function () {
            let val = {_id: 1, val1: 'x', testVal: {$in: ['A', 'C']}};

            val = $json.renameKey(val, (key, path) => {
                if (key === '_id') {
                    try {
                        $json.set(val, path, {$objectId: $json.get(val, path)});
                    } catch (exp) {
                        assert(!exp, 'An error occurred');
                    }
                    return key;
                } else if (!$check.integer(key) && !key.startsWith('$')) {
                    return 'data.' + key;
                } else {
                    return key;
                }
            });
            assert.deepStrictEqual(
                val,
                {
                    _id: {$objectId: 1},
                    'data.val1': 'x',
                    'data.testVal': {$in: ['A', 'C']},
                },
                'Invalid key rename'
            );
        });

        it('should rename a string ', function () {
            let val = 'abc';

            val = $json.renameKey(val, (key, path) => {
                if (key === 'c') {
                    return 'r';
                } else if (key === 'x') {
                    return 'x2';
                }
            });
            assert.deepStrictEqual(val, 'abc', 'Invalid key rename');
        });
    });

    describe('change value', function () {
        it('should not change value', function () {
            let val = {a: {b: {c: 1, d: 2}, x: 'abc'}};

            val = $json.changeValue(val, (val, path) => {
                return val;
            });

            assert.deepStrictEqual(val, {a: {b: {c: 1, d: 2}, x: 'abc'}}, 'Invalid change val');
        });

        it('should change a value', function () {
            let val = {a: {b: {c: 1, d: 2}, x: 'abc'}};

            val = $json.changeValue(val, (val, path) => {
                if (val === 2) {
                    return 20;
                } else {
                    return val;
                }
            });
            assert.deepStrictEqual(val, {a: {b: {c: 1, d: 20}, x: 'abc'}}, 'Invalid key rename');
        });

        it('should change a value on array', function () {
            let val = {
                a: {
                    b: [
                        {c: 1, d: 2},
                        {c: 2, d: 5},
                    ],
                    x: 'abc',
                },
            };

            val = $json.changeValue(val, (val, path) => {
                if (val === 2) {
                    return 20;
                } else {
                    return val;
                }
            });
            assert.deepStrictEqual(
                val,
                {
                    a: {
                        b: [
                            {c: 1, d: 20},
                            {c: 20, d: 5},
                        ],
                        x: 'abc',
                    },
                },
                'Invalid key rename'
            );
        });

        it('should change a value containing BSON data and be able to stringify the output', function () {
            const value = {
                a: 'a',
                _id: new ObjectId(),
                binary: new Binary(Buffer.from('binary')),
                nested: {
                    b: 1,
                    timestamp: new Timestamp(0xffffffffffffffffn),
                },
            };

            const newValue = $json.changeValue(value, (val, path) => {
                return {value: val};
            });

            const newValueString = JSON.stringify(newValue);

            assert.strictEqual(JSON.stringify(value), newValueString, 'Invalid change val');
        });

        it('should change a string ', function () {
            let val = 'abc';

            val = $json.renameKey(val, (key, path) => {
                if (val === 2) {
                    return 20;
                } else {
                    return val;
                }
            });
            assert.deepStrictEqual(val, 'abc', 'Invalid key rename');
        });
    });

    describe('to iso string', function () {
        it('should convert an object to isostring', function () {
            let val = {a: {b: {c: 1, d: new Date('2017-01-01T23:45:45Z')}, x: '2017-01-01'}};
            const walkedVals = {};
            val = $json.convertDateTOISOString(val, function (value, path) {
                walkedVals[path] = value;
            });
            assert.deepStrictEqual(val, {a: {b: {c: 1, d: '2017-01-01T23:45:45.000Z'}, x: '2017-01-01'}}, 'Invalid walk');
        });

        it('should convert an array to isostring ', function () {
            let val = [
                {a: {b: {c: 1, d: new Date('2017-01-01T23:45:45Z')}, x: '2017-01-01'}},
                {
                    a: {
                        b: {
                            c: 1,
                            d: new Date('2017-01-01T23:45:45Z'),
                        },
                        x: '2017-01-01',
                    },
                },
            ];
            const walkedVals = {};
            val = $json.convertDateTOISOString(val, function (value, path) {
                walkedVals[path] = value;
            });
            assert.deepStrictEqual(
                val,
                [
                    {a: {b: {c: 1, d: '2017-01-01T23:45:45.000Z'}, x: '2017-01-01'}},
                    {
                        a: {
                            b: {
                                c: 1,
                                d: '2017-01-01T23:45:45.000Z',
                            },
                            x: '2017-01-01',
                        },
                    },
                ],
                'Invalid walk'
            );
        });
    });

    describe('fix for mongo', function () {
        it('should fix a object for mongo', function () {
            let val = {$a: {'b.a': {c: 1, d: 'xxx'}, x: '2017-01-01'}};
            const walkedVals = {};
            val = $json.fixForMongo(val, function (value, path) {
                walkedVals[path] = value;
            });
            assert.deepStrictEqual(val, {_a: {b_a: {c: 1, d: 'xxx'}, x: '2017-01-01'}}, 'Invalid fix for mongo');
        });

        it('should fix a object for mongo with array', function () {
            let val = {$a: {'b.a': {c: 1, d: 'xxx'}, $x: [{'$z.y': 35}, {'$z.y': 45}]}};
            const walkedVals = {};
            val = $json.fixForMongo(val, function (value, path) {
                walkedVals[path] = value;
            });
            assert.deepStrictEqual(
                val,
                {
                    _a: {
                        b_a: {c: 1, d: 'xxx'},
                        _x: [{_z_y: 35}, {_z_y: 45}],
                    },
                },
                'Invalid fix for mongo'
            );
        });

        it('should fix a object for mongo with array 2', function () {
            let val = [{$a: {'b.a': {c: 1, d: 'xxx'}}}, {$x: [{'$z.y': 35}, {'$z.y': 45}]}];
            const walkedVals = {};
            val = $json.fixForMongo(val, function (value, path) {
                walkedVals[path] = value;
            });
            assert.deepStrictEqual(
                val,
                [
                    {
                        _a: {
                            b_a: {
                                c: 1,
                                d: 'xxx',
                            },
                        },
                    },
                    {_x: [{_z_y: 35}, {_z_y: 45}]},
                ],
                'Invalid fix for mongo'
            );
        });

        it('should fix an Error for mongo', function () {
            class TestMongoError extends Error {
                constructor(message, details = {}) {
                    super(message);
                    for (const detailsKey in details) {
                        if (details.hasOwnProperty(detailsKey)) {
                            this[detailsKey] = details[detailsKey];
                        }
                    }
                }
            }

            const clusterTime = new Date();
            const error = new TestMongoError('Some error', {
                $clusterTime: clusterTime,
            });

            let val = error;
            val = $json.fixForMongo(val);
            assert.deepStrictEqual(val, {
                name: error.name,
                message: error.message,
                _clusterTime: error.$clusterTime.toISOString(),
                stack: error.stack,
            });
        });

        it('should fix an Error with circular properties for mongo', function () {
            class TestMongoError extends Error {
                constructor(message, details = {}) {
                    super(message);
                    for (const detailsKey in details) {
                        if (details.hasOwnProperty(detailsKey)) {
                            this[detailsKey] = details[detailsKey];
                        }
                    }
                }
            }

            const clusterTime = new Date();
            const error = new TestMongoError('Some error', {
                $clusterTime: clusterTime,
            });
            error.testProperty = {
                recursiveError: error,
            };

            let val = error;
            val = $json.fixForMongo(val);
            assert.deepStrictEqual(val, {
                name: error.name,
                message: error.message,
                _clusterTime: error.$clusterTime.toISOString(),
                stack: error.stack,
                testProperty: {
                    recursiveError: '[Circular]',
                },
            });
        });
    });

    describe('set property', function () {
        it('should set on null', function () {
            assert.deepStrictEqual($json.setProperty(null, 'val', 'value'), null, 'Invalid set property');
        });

        it('should set on string', function () {
            assert.deepStrictEqual($json.setProperty('xxx', 'val', 'value'), 'xxx', 'Invalid set property');
        });

        it('should set on object', function () {
            assert.deepStrictEqual($json.setProperty({a: 1}, 'val', 'value'), {a: 1, val: 'value'}, 'Invalid set property');
        });

        it('should set on object without no override', function () {
            assert.deepStrictEqual($json.setProperty({a: 1, val: 2}, 'val', 'value'), {a: 1, val: 2}, 'Invalid set property');
        });

        it('should set on object with override', function () {
            assert.deepStrictEqual(
                $json.setProperty({a: 1, val: 2}, 'val', 'value', true),
                {
                    a: 1,
                    val: 'value',
                },
                'Invalid set property'
            );
        });

        it('should set on object complex', function () {
            assert.deepStrictEqual(
                $json.setProperty({a: 1, b: {c: 2}, d: [{e: 1}, {e: 2}]}, 'val', 'value'),
                {
                    a: 1,
                    val: 'value',
                    b: {val: 'value', c: 2},
                    d: [
                        {e: 1, val: 'value'},
                        {e: 2, val: 'value'},
                    ],
                },
                'Invalid set property'
            );
        });
    });
});
