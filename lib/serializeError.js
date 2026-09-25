/**
 * @file Serializes an Error into a plain object that can be stored or sent as JSON
 * Adapted from serialize-error v13.0.1 (https://github.com/sindresorhus/serialize-error)
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com) - MIT License
 */
'use strict';

const errorProperties = ['name', 'message', 'stack', 'code', 'cause', 'errors'];

const toJsonWasCalled = new WeakSet();

/**
 * Calls toJSON on an object, guarding against toJSON implementations that serialize themselves
 * @param {object} from - The object to call toJSON on
 * @returns {*} The result of toJSON
 */
function toJSON(from) {
    toJsonWasCalled.add(from);
    const json = from.toJSON();
    toJsonWasCalled.delete(from);
    return json;
}

/**
 * Recursively copies an object into a plain object, replacing circular references and non-serializable values
 * @param {object|Array} from - The object to copy
 * @param {Set<object>} seen - The objects on the current path, used to detect circular references
 * @returns {*} The plain copy of the object
 */
function destroyCircular(from, seen) {
    const to = Array.isArray(from) ? [] : {};

    seen.add(from);

    if (typeof from.toJSON === 'function' && !toJsonWasCalled.has(from)) {
        seen.delete(from);
        return toJSON(from);
    }

    const serializeValue = (value) => (seen.has(value) ? '[Circular]' : destroyCircular(value, seen));

    for (const key of Object.keys(from)) {
        const value = from[key];

        if (value instanceof Uint8Array && value.constructor.name === 'Buffer') {
            to[key] = '[object Buffer]';
            continue;
        }

        if (value !== null && typeof value === 'object' && typeof value.pipe === 'function') {
            to[key] = '[object Stream]';
            continue;
        }

        if (typeof value === 'function') {
            continue;
        }

        if (typeof value === 'bigint') {
            to[key] = `${value}n`;
            continue;
        }

        if (!value || typeof value !== 'object') {
            to[key] = value;
            continue;
        }

        to[key] = serializeValue(value);
    }

    for (const property of errorProperties) {
        const value = from[property];
        if (value === undefined || value === null) {
            continue;
        }

        to[property] = typeof value === 'object' ? serializeValue(value) : value;
    }

    seen.delete(from);
    return to;
}

/**
 * Serializes an Error into a plain object, including non-enumerable properties such as name, message and stack
 * @param {Error} error - The error to serialize
 * @returns {object} The serialized error
 */
function serializeError(error) {
    return destroyCircular(error, new Set());
}

module.exports = {serializeError};
