'use strict';

const _hasOwn = Object.prototype.hasOwnProperty;
const _toString = Object.prototype.toString;
const $check = require('check-types');

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

module.exports = api;

/**
 * Convenience wrapper around the api.
 * Calls `.get` when called with an `object` and a `pointer`.
 * Calls `.set` when also called with `value`.
 * If only supplied `object`, returns a partially applied function, mapped to the object.
 *
 * @param {Object} obj
 * @param {String|Array} pointer
 * @param value
 * @returns {*}
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
 *
 * @param {Object} obj
 * @param {String|Array} pointer
 * @return {*}
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
 *
 * @param {Object} obj
 * @param {String|Array} pointer
 * @param {*} value
 * @return {*}
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
 *
 * @param {Object} obj
 * @param {String|Array} pointer
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
 *
 * @param {object} obj
 * @param {function} descend
 * @return {object}
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
 * Iterator: function (value, pointer) {}
 *
 * @param {object} obj
 * @param {function} iterator
 * @param {function} descend
 */
api.walk = function walk(obj, iterator, descend) {
    const refTokens = [];

    descend =
        descend ||
        function (value) {
            const type = Object.prototype.toString.call(value);
            return type === '[object Object]' || type === '[object Array]';
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
 *
 * @param {Object} obj
 * @param {String|Array} pointer
 * @return {boolean}
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
 *
 * @param {string} str
 * @return {string}
 */
api.escape = function escape(str) {
    return str.toString().replace(/~/g, '~0').replace(/\//g, '~1');
};

/**
 * Unescapes a reference token
 *
 * @param {string} str
 * @return {string}
 */
api.unescape = function unescape(str) {
    return str.replace(/~1/g, '/').replace(/~0/g, '~');
};

/**
 * Converts a json pointer into a array of reference tokens
 *
 * @param {string} pointer
 * @return {Array}
 */
api.parse = function parse(pointer) {
    if (pointer === '') {
        return [];
    }
    if (pointer.charAt(0) !== '/') {
        throw new Error('Invalid JSON pointer: ' + pointer);
    }
    return pointer.substring(1).split(/\//).map(api.unescape);
};

/**
 * Builds a json pointer from a array of reference tokens
 *
 * @param {array} refTokens
 * @return {string}
 */
api.compile = function compile(refTokens) {
    if (refTokens.length === 0) {
        return '';
    }
    return '/' + refTokens.map(api.escape).join('/');
};
