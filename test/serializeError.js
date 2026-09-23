/**
 * Tests adapted from serialize-error v13.0.1 (https://github.com/sindresorhus/serialize-error/blob/v13.0.1/test.js)
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com) - MIT License
 *
 * Only the serializeError tests are ported. Tests for features that were not vendored are omitted:
 * deserializeError, isErrorLike, NonError, addKnownErrorConstructor and the maxDepth/useToJSON options.
 */
const assert = require('assert');
const Stream = require('stream');

const {serializeError} = require('../lib/serializeError.js');

describe('serializeError', function () {
    it('should include name, stack and message', function () {
        const serialized = serializeError(new Error('foo'));
        const properties = Object.keys(serialized);

        assert.ok(properties.includes('name'));
        assert.ok(properties.includes('stack'));
        assert.ok(properties.includes('message'));
    });

    it('should destroy circular references', function () {
        const object = {};
        object.child = {parent: object};

        const serialized = serializeError(object);
        assert.strictEqual(typeof serialized, 'object');
        assert.strictEqual(serialized.child.parent, '[Circular]');
    });

    it('should not affect the original object', function () {
        const object = {};
        object.child = {parent: object};

        const serialized = serializeError(object);
        assert.notStrictEqual(serialized, object);
        assert.strictEqual(object.child.parent, object);
    });

    it('should only destroy parent references', function () {
        const object = {};
        const common = {thing: object};
        object.one = {firstThing: common};
        object.two = {secondThing: common};

        const serialized = serializeError(object);
        assert.strictEqual(typeof serialized.one.firstThing, 'object');
        assert.strictEqual(typeof serialized.two.secondThing, 'object');
        assert.strictEqual(serialized.one.firstThing.thing, '[Circular]');
        assert.strictEqual(serialized.two.secondThing.thing, '[Circular]');
    });

    it('should work on arrays', function () {
        const object = {};
        const common = [object];
        const x = [common];
        const y = [['test'], common];
        y[0][1] = y;
        object.a = {x};
        object.b = {y};

        const serialized = serializeError(object);
        assert.ok(Array.isArray(serialized.a.x));
        assert.strictEqual(serialized.a.x[0][0], '[Circular]');
        assert.strictEqual(serialized.b.y[0][0], 'test');
        assert.strictEqual(serialized.b.y[1][0], '[Circular]');
        assert.strictEqual(serialized.b.y[0][1], '[Circular]');
    });

    it('should discard nested functions', function () {
        function a() {}
        function b() {}
        a.b = b;
        const object = {a};

        const serialized = serializeError(object);
        assert.deepStrictEqual(serialized, {});
    });

    it('should discard buffers', function () {
        const object = {a: Buffer.alloc(1)};
        const serialized = serializeError(object);
        assert.deepStrictEqual(serialized, {a: '[object Buffer]'});
    });

    it('should serialize BigInt as string', function () {
        const error = new Error('test');
        error.bigNumber = 123_456_789_012_345_678_901n;
        const serialized = serializeError(error);
        assert.strictEqual(serialized.bigNumber, '123456789012345678901n');
        assert.doesNotThrow(() => JSON.stringify(serialized));
    });

    it('should discard streams', function () {
        assert.deepStrictEqual(serializeError({s: new Stream.Stream()}), {s: '[object Stream]'}, 'Stream.Stream');
        assert.deepStrictEqual(serializeError({s: new Stream.Readable()}), {s: '[object Stream]'}, 'Stream.Readable');
        assert.deepStrictEqual(serializeError({s: new Stream.Writable()}), {s: '[object Stream]'}, 'Stream.Writable');
        assert.deepStrictEqual(serializeError({s: new Stream.Duplex()}), {s: '[object Stream]'}, 'Stream.Duplex');
        assert.deepStrictEqual(serializeError({s: new Stream.Transform()}), {s: '[object Stream]'}, 'Stream.Transform');
        assert.deepStrictEqual(serializeError({s: new Stream.PassThrough()}), {s: '[object Stream]'}, 'Stream.PassThrough');
    });

    it('should drop functions', function () {
        function a() {}
        a.foo = 'bar;';
        a.b = a;
        const object = {a};

        const serialized = serializeError(object);
        assert.deepStrictEqual(serialized, {});
        assert.ok(!Object.hasOwn(serialized, 'a'));
    });

    it('should not access deep non-enumerable properties', function () {
        const error = new Error('some error');
        const object = {};
        Object.defineProperty(object, 'someProp', {
            enumerable: false,
            get() {
                throw new Error('some other error');
            },
        });
        error.object = object;
        assert.doesNotThrow(() => serializeError(error));
    });

    it('should serialize nested errors', function () {
        const error = new Error('outer error');
        error.innerError = new Error('inner error');

        const serialized = serializeError(error);
        assert.strictEqual(serialized.message, 'outer error');
        assert.strictEqual(serialized.innerError.name, 'Error');
        assert.strictEqual(serialized.innerError.message, 'inner error');
        assert.ok(!(serialized.innerError instanceof Error));
    });

    it('should serialize the cause property', function () {
        const error = new Error('outer error', {
            cause: new Error('inner error', {
                cause: new Error('deeper error'),
            }),
        });

        const serialized = serializeError(error);
        assert.strictEqual(serialized.message, 'outer error');
        assert.strictEqual(serialized.cause.name, 'Error');
        assert.strictEqual(serialized.cause.message, 'inner error');
        assert.strictEqual(serialized.cause.cause.name, 'Error');
        assert.strictEqual(serialized.cause.cause.message, 'deeper error');
        assert.ok(!(serialized.cause instanceof Error));
        assert.ok(!(serialized.cause.cause instanceof Error));
    });

    it('should handle circular cause property', function () {
        const error = new Error('test');
        error.cause = error;

        const serialized = serializeError(error);
        assert.strictEqual(serialized.message, 'test');
        assert.strictEqual(serialized.cause, '[Circular]');
    });

    it('should handle circular errors property', function () {
        const error = new AggregateError([], 'test');
        error.errors.push(error);

        const serialized = serializeError(error);
        assert.strictEqual(serialized.errors[0], '[Circular]');
    });

    it('should handle plain object cause with circular reference', function () {
        const circular = {};
        circular.self = circular;
        const error = new Error('test');
        error.cause = circular;

        const serialized = serializeError(error);
        assert.strictEqual(serialized.cause.self, '[Circular]');
    });

    it('should serialize AggregateError', function () {
        const error = new AggregateError([new Error('inner error')]);

        const serialized = serializeError(error);
        assert.strictEqual(serialized.message, ''); // Default error message
        assert.ok(Array.isArray(serialized.errors));
        assert.strictEqual(serialized.errors[0].name, 'Error');
        assert.strictEqual(serialized.errors[0].message, 'inner error');
        assert.ok(!(serialized.errors[0] instanceof Error));
    });

    it('should serialize Date as ISO string', function () {
        const date = {date: new Date(0)};
        const serialized = serializeError(date);
        assert.deepStrictEqual(serialized, {date: '1970-01-01T00:00:00.000Z'});
    });

    it('should serialize custom error with `.toJSON`', function () {
        class CustomError extends Error {
            constructor() {
                super('foo');
                this.name = this.constructor.name;
                this.value = 10;
            }

            toJSON() {
                return {
                    message: this.message,
                    amount: `$${this.value}`,
                };
            }
        }

        const error = new CustomError();
        const serialized = serializeError(error);
        assert.deepStrictEqual(serialized, {
            message: 'foo',
            amount: '$10',
        });
        assert.strictEqual(serialized.stack, undefined);
    });

    it('should serialize custom error with a property having `.toJSON`', function () {
        class CustomError extends Error {
            constructor(value) {
                super('foo');
                this.name = this.constructor.name;
                this.value = value;
            }
        }
        const value = {
            amount: 20,
            toJSON() {
                return {
                    amount: `$${this.amount}`,
                };
            },
        };
        const error = new CustomError(value);
        const serialized = serializeError(error);
        const {stack, ...rest} = serialized;
        assert.deepStrictEqual(rest, {
            message: 'foo',
            name: 'CustomError',
            value: {
                amount: '$20',
            },
        });
        assert.notStrictEqual(stack, undefined);
    });

    it('should serialize custom error with `.toJSON` defined with `serializeError`', function () {
        class CustomError extends Error {
            constructor() {
                super('foo');
                this.name = this.constructor.name;
                this.value = 30;
            }

            toJSON() {
                return serializeError(this);
            }
        }
        const error = new CustomError();
        const serialized = serializeError(error);
        const {stack, ...rest} = serialized;
        assert.deepStrictEqual(rest, {
            message: 'foo',
            name: 'CustomError',
            value: 30,
        });
        assert.notStrictEqual(stack, undefined);
    });

    it('should serialize custom non-extensible error with custom `.toJSON` property', function () {
        class CustomError extends Error {
            constructor() {
                super('foo');
                this.name = this.constructor.name;
            }

            toJSON() {
                return this;
            }
        }

        const error = Object.preventExtensions(new CustomError());
        const serialized = serializeError(error);
        const {stack, ...rest} = serialized;
        assert.deepStrictEqual(rest, {
            name: 'CustomError',
        });
        assert.notStrictEqual(stack, undefined);
    });

    it('should serialize DOMException', function () {
        const serialized = serializeError(new DOMException('x'));
        assert.strictEqual(serialized.message, 'x');
    });

    it('should deep clone DOMException when it is in the cause property', function () {
        const domException = new DOMException('My domException', 'NotFoundError');
        const error = new Error('My error message', {
            cause: domException,
        });

        const serialized = serializeError(error);

        assert.strictEqual(serialized.message, 'My error message');
        assert.strictEqual(serialized.cause.message, 'My domException');
        assert.strictEqual(serialized.cause.name, 'NotFoundError');
        assert.strictEqual(serialized.cause.code, 8);
        // Should be a deep clone, not the same reference
        assert.notStrictEqual(serialized.cause, domException);
        assert.ok(!(serialized.cause instanceof DOMException));
        assert.ok(!(serialized.cause instanceof Error));
    });
});
