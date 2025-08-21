/**
 * @file Implementation of JSON Pointer (RFC 6901)
 * @see https://tools.ietf.org/html/rfc6901
 */
'use strict';

const _hasOwn = Object.prototype.hasOwnProperty;
const _toString = Object.prototype.toString;
const $check = require('check-types');

/**
 * Iterates over an object or array and calls a function for each item
 * @param {object | Array} obj - The object or array to iterate over
 * @param {Function} fn - The function to call for each item
 * @param {*} [ctx] - The context to use for the function
 * @throws {TypeError} If the iterator is not a function
 */
function each(obj, fn, ctx) {
    if (_toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }

    const l = $check.array(obj) ? obj.length : null;
    if (l === +l) {
        for (let i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (const k in obj) {
            if (_hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
}

/** @type {JsonPointerAPI} */
module.exports = api;

/**
 * @typedef {object} JsonPointerAPI
 * @property {function(object, (string[] | string), *=): *} get - Get a value from an object
 * @property {function(object, (string[] | string), *): object} set - Set a value on an object
 * @property {function(object, (string[] | string)): void} remove - Remove a value from an object
 * @property {function(object, Function=): Object<string, *>} dict - Get a dictionary of path-value pairs
 * @property {function(object, Function, Function=): void} walk - Walk through an object
 * @property {function(object, (string[] | string)): boolean} has - Check if a path exists in an object
 * @property {function(string): string} escape - Escape a reference token
 * @property {function(string): string} unescape - Unescape a reference token
 * @property {function(string): string[]} parse - Parse a JSON pointer
 * @property {function(string[]): string} compile - Compile a JSON pointer
 */

/**
 * Convenience wrapper around the api.
 * Calls `.get` when called with an `object` and a `pointer`.
 * Calls `.set` when also called with `value`.
 * If only supplied `object`, returns a partially applied function, mapped to the object.
 * @param {object | Array} obj - The object to operate on
 * @param {string[]|string} [pointer] - The pointer to the property
 * @param {*} [value] - The value to set
 * @returns {*|JsonPointerAPI} The value or a partially applied function
 */
function api(obj, pointer, value) {
    // .set()
    if (arguments.length === 3) {
        return api.set(obj, pointer, value);
    }
    // .get()
    if (arguments.length === 2) {
        return api.get(obj, pointer);
    }
    // Return a partially applied function on `obj`.
    const wrapped = api.bind(api, obj);

    // Support for oo style
    for (const name in api) {
        if (api.hasOwnProperty(name)) {
            wrapped[name] = api[name].bind(wrapped, obj);
        }
    }
    return wrapped;
}

/**
 * Lookup a json pointer in an object
 * @param {object | Array} obj - The object to search in
 * @param {string[]|string} pointer - The pointer to the property
 * @returns {*} The value at the pointer
 * @throws {Error} If the pointer doesn't exist
 */
api.get = function get(obj, pointer) {
    const refTokens = Array.isArray(pointer) ? pointer : api.parse(pointer);

    for (let i = 0; i < refTokens.length; ++i) {
        const tok = refTokens[i];
        if (!(typeof obj == 'object' && tok in obj)) {
            throw new Error('Invalid reference token: ' + tok);
        }
        obj = obj[tok];
    }
    return obj;
};

/**
 * Sets a value on an object
 * @param {object | Array} obj - The object to modify
 * @param {string[]|string} pointer - The pointer to the property
 * @param {*} value - The value to set
 * @returns {object} This API instance for chaining
 */
api.set = function set(obj, pointer, value) {
    const refTokens = Array.isArray(pointer) ? pointer : api.parse(pointer);
    let nextTok = refTokens[0];

    for (let i = 0; i < refTokens.length - 1; ++i) {
        let tok = refTokens[i];
        if (tok === '-' && Array.isArray(obj)) {
            tok = obj.length;
        }
        nextTok = refTokens[i + 1];

        if (!(tok in obj)) {
            if (nextTok.match(/^(\d+|-)$/)) {
                obj[tok] = [];
            } else {
                obj[tok] = {};
            }
        }
        obj = obj[tok];
    }
    if (nextTok === '-' && Array.isArray(obj)) {
        nextTok = obj.length;
    }
    obj[nextTok] = value;
    return this;
};

/**
 * Removes an attribute
 * @param {object | Array} obj - The object to modify
 * @param {string[]|string} pointer - The pointer to the property
 * @throws {Error} If the pointer is invalid
 */
api.remove = function (obj, pointer) {
    const refTokens = Array.isArray(pointer) ? pointer : api.parse(pointer);
    const finalToken = refTokens[refTokens.length - 1];
    if (finalToken === undefined) {
        throw new Error('Invalid JSON pointer for remove: "' + pointer + '"');
    }

    const parent = api.get(obj, refTokens.slice(0, -1));
    if (Array.isArray(parent)) {
        const index = +finalToken;
        if (finalToken === '' && isNaN(index)) {
            throw new Error('Invalid array index: "' + finalToken + '"');
        }

        Array.prototype.splice.call(parent, index, 1);
    } else {
        delete parent[finalToken];
    }
};

/**
 * Returns a (pointer -> value) dictionary for an object
 * @param {object | Array} obj - The object to process
 * @param {Function} [descend] - A function to determine if a value should be descended into
 * @returns {Object<string, *>} A dictionary mapping JSON pointers to values
 */
api.dict = function dict(obj, descend) {
    const results = {};
    api.walk(
        obj,
        function (value, pointer) {
            results[pointer] = value;
        },
        descend
    );
    return results;
};

/**
 * Iterates over an object
 * @param {object | Array} obj - The object to iterate over
 * @param {function(*, string): void} iterator - The function to call for each value
 * @param {function(*): boolean} [descend] - A function to determine if a value should be descended into
 */
api.walk = function walk(obj, iterator, descend) {
    const refTokens = [];

    descend =
        descend ||
        function (value) {
            const type = Object.prototype.toString.call(value);
            if (type === '[object Object]') {
                // descend if the value is not a BSONValue
                // todo: this should rather be (value instanceof BSONValue) if we didn't have to support node 12
                if (!!value._bsontype && !!value[Symbol.for('@@mdb.bson.version')]) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return type === '[object Array]';
            }
        };

    (function next(cur) {
        each(cur, function (value, key) {
            refTokens.push(String(key));
            if (descend(value)) {
                next(value);
            } else {
                iterator(value, api.compile(refTokens));
            }
            refTokens.pop();
        });
    })(obj);
};

/**
 * Tests if an object has a value for a json pointer
 * @param {object | Array} obj - The object to test
 * @param {string[]|string} pointer - The pointer to the property
 * @returns {boolean} Whether the pointer exists in the object
 */
api.has = function has(obj, pointer) {
    try {
        api.get(obj, pointer);
    } catch (e) {
        return false;
    }
    return true;
};

/**
 * Escapes a reference token
 * @param {string} str - The reference token to escape
 * @returns {string} The escaped reference token
 */
api.escape = function escape(str) {
    return str.toString().replace(/~/g, '~0').replace(/\//g, '~1');
};

/**
 * Unescapes a reference token
 * @param {string} str - The reference token to unescape
 * @returns {string} The unescaped reference token
 */
api.unescape = function unescape(str) {
    return str.replace(/~1/g, '/').replace(/~0/g, '~');
};

/**
 * Converts a json pointer into a array of reference tokens
 * @param {string} pointer - The pointer to parse
 * @returns {string[]} An array of reference tokens
 * @throws {Error} If the pointer is invalid
 */
api.parse = function parse(pointer) {
    if (pointer === null || pointer === '') {
        return [];
    }
    if (pointer.charAt(0) !== '/') {
        throw new Error('Invalid JSON pointer: ' + pointer);
    }
    return pointer.substring(1).split(/\//).map(api.unescape);
};

/**
 * Builds a json pointer from a array of reference tokens
 * @param {string[]} refTokens - The reference tokens
 * @returns {string} A JSON pointer
 */
api.compile = function compile(refTokens) {
    if (refTokens.length === 0) {
        return '';
    }
    return '/' + refTokens.map(api.escape).join('/');
};
