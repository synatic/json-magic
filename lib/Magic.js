const $check = require('check-types');
const jsonPointer = require('./JSONPointer.js');

class Magic {
    constructor() {}

    /** Parse a string path to an array
     *
     * @param {string} path - the path to parse
     * @param {string|null} [separator] - the separator to use. Either . or / or dot
     * @param {boolean} [ignoreSeparator] - whether to ignore the separation or not
     * @return {null|*[]|string[]|*}
     */
    static parsePath(path, separator, ignoreSeparator) {
        if (!path) return null;
        if ($check.array(path)) return path;
        if (!$check.string(path)) throw new Error('Invalid type for path');

        let sep = '/';
        if (separator) {
            sep = separator === 'dot' ? '.' : separator;
        } else {
            if (count(path, '.') > count(path, '/')) {
                sep = '.';
            } else {
                sep = '/';
            }
        }

        if (path.indexOf(sep) > -1) {
            if (path.indexOf(sep) === 0) {
                path = path.substring(sep.length);
            }

            if (ignoreSeparator)
                return [path];
            return path.split(sep);
        } else {
            return [path];
        }
    }

    /** Compiles an array to a path
     *
     * @param {array} path - the path to compile
     * @param {string} [separator] - the separator to use
     * @param {boolean} [ignoreLeading] - ignore the leading separator unless dot notation
     * @return {string|*}
     */
    static compilePath(path, separator, ignoreLeading) {
        if (!path) return path;
        if (!$check.array(path)) throw new Error('Invalid type for path');
        const sep = separator || '/';

        if (sep === '.' || sep === 'dot') {
            return path.join('.');
        } else {
            return (ignoreLeading ? '' : sep) + path.join(sep);
        }
    }

    /**
     * Check if the path is in the object
     *
     * @param {object|array} obj - The object to check
     * @param {string|array} path - The path to check
     * @return {boolean}
     */
    static has(obj, path) {
        if (!obj) return false;
        const pathArr = Magic.parsePath(path);
        let curObj = obj;

        for (const attr of pathArr) {
            if (!curObj[attr]) {
                return false;
            } else {
                curObj = curObj[attr];
            }
        }
        return true;
    }

    /**
     * Lookup a value in an object by path
     *
     * @param {object|array} obj - the object to check
     * @param {string|array} path - the path to retreive
     * @param {string|null} [separator] - the path separator, either slash or dot
     * @param {boolean} [ignoreSeparator] - whether to ignore the separation or not
     * @return {*}
     */
    static get(obj, path, separator, ignoreSeparator) {
        if (!obj) throw new Error('Invalid object for get');
        if (!$check.object(obj) && !$check.array(obj)) throw new Error('Invalid object for get');
        return jsonPointer.get(obj, Magic.parsePath(path, separator, ignoreSeparator));
    }

    /** Set a value for the path on the specified object
     *
     * @param {object|array} obj - the object to set the value on
     * @param {string|array} path - the path to set the value on
     * @param {*} value - the value to set
     * @param {boolean} [ignoreSeparator] - whether to ignore the separation or not
     * @return {*}
     */
    static set(obj, path, value, ignoreSeparator) {
        if (!obj) throw new Error('Invalid object for set');
        if (!$check.object(obj) && !$check.array(obj)) throw new Error('Invalid object for set');
        return jsonPointer.set(obj, Magic.parsePath(path, null, ignoreSeparator), value);
    }

    /** Removes the value at the specified path
     *
     * @param {object|array} obj - the object to set the value on
     * @param {string|array} path - the path to set the value on
     * @return {*}
     */
    static remove(obj, path) {
        if (!obj) throw new Error('Invalid object for remove');
        if (!$check.object(obj) && !$check.array(obj)) throw new Error('Invalid object for remove');
        return jsonPointer.remove(obj, Magic.parsePath(path));
    }

    /** Returns a dictionary of paths generated from the object
     *
     * @param {object|array} obj - The object to generate a set of paths from
     * @param {string} [separator] - The separator to show on the paths
     * @return {{}}
     */
    static pathDict(obj, separator) {
        if (separator && separator.toLowerCase() !== '/') {
            const dict = jsonPointer.dict(obj);
            const newDict = {};
            for (const k in dict) {
                if (!dict.hasOwnProperty(k)) continue;
                const newK = k.split('/');
                newK.shift();
                newDict[newK.join('.')] = dict[k];
            }
            return newDict;
        } else {
            return jsonPointer.dict(obj);
        }
    }

    /** Returns an array of paths defined in the object
     *
     * @param {object|array} obj -
     * @param {string} [format] - the format for the path, e.g. . or /
     * @return {[]}
     */
    static pathArray(obj, format) {
        const dict = jsonPointer.dict(obj);
        const newDict = [];

        for (const k in dict) {
            if (!dict.hasOwnProperty(k)) continue;
            if (format && (format.toLowerCase() === 'dot' || format === '.')) {
                const newK = k.split('/');
                newK.shift();
                newDict.push({
                    path: newK.join('.'),
                    value: dict[k],
                });
            } else {
                newDict.push({
                    path: k,
                    value: dict[k],
                });
            }
        }

        return newDict;
    }

    /** Walk an object or array and call an iterator function
     *
     * @param {object|array} obj - The object or array to walk
     * @param {function} iterator - the iterator
     * @param {string} [separator] - the path separator
     * @return {void|*}
     */
    static walk(obj, iterator, separator) {
        if (!obj) return obj;
        const sep = separator || '/';

        // if not an object or array, then base path
        if (!$check.object(obj) && !$check.array(obj)) {
            if (sep === '.') {
                return iterator(obj, '');
            } else {
                return iterator(obj, sep);
            }
        }

        return jsonPointer.walk(obj, (value, path) => {
            let newPath = path;

            if (sep !== '/') {
                newPath = Magic.compilePath(Magic.parsePath(path, '/'), separator);
            }
            return iterator(value, newPath);
        });
    }

    /** Renames a key by the renamer function
     *
     * @param {object|array} obj - object to rename key on
     * @param {function} renamer - the function to call for each key
     * @param {string} [separator] - the path separator
     * @return {*}
     */
    static renameKey(obj, renamer, separator) {
        if (!obj) return obj;
        const sep = separator || '/';
        if (!renamer) return obj;

        // if not an object or array, then base path
        if (!$check.object(obj) && !$check.array(obj)) {
            return obj;
        }

        const renamePaths = [];

        const inner = (curObj, curPath, curKey) => {
            if ($check.assigned(curKey)) {
                const newKey = renamer(curKey, Magic.compilePath(curPath, sep));
                if (newKey && newKey !== curKey) {
                    renamePaths.push({
                        curPath: curPath,
                        newKey: newKey,
                        newPath: curPath.slice(0, curPath.length - 1).concat([newKey]),
                    });
                }
            }

            if ($check.array(curObj)) {
                for (let i = 0; i < curObj.length; i++) {
                    inner(curObj[i], curPath.concat(i), i);
                }
            } else if ($check.object(curObj)) {
                for (const k in curObj) {
                    if (!curObj.hasOwnProperty(k)) continue;
                    inner(curObj[k], curPath.concat(k), k);
                }
            }
        };

        inner(obj, [], null);

        for (const renamePath of renamePaths) {
            Magic.set(obj, renamePath.newPath, Magic.get(obj, renamePath.curPath));
        }

        const removePaths = renamePaths.sort((a, b) => {
            if (a.curPath.length > b.curPath.length) return -1;
            if (a.curPath.length < b.curPath.length) return 1;
            return 0;
        });
        for (const removePath of removePaths) {
            Magic.remove(obj, removePath.curPath);
        }

        return obj;
    }

    /** Changes a value in an object passing each value to the changer function
     *
     * @param {object|array} obj - object to rename key on
     * @param {function} changer - the function to call for each key
     * @param {string} [separator] - the path separator
     * @return {*}
     */
    static changeValue(obj, changer, separator) {
        if (!obj) return obj;
        const sep = separator || '/';
        if (!changer) return obj;

        // if not an object or array, then base path
        if (!$check.object(obj) && !$check.array(obj)) {
            return obj;
        }

        const setPaths = [];

        Magic.walk(
            obj,
            (val, path) => {
                const newVal = changer(val, path);
                if (newVal !== val) {
                    setPaths.push({
                        path: path,
                        newVal: newVal,
                    });
                }
            },
            sep
        );

        for (const setPath of setPaths) {
            Magic.set(obj, setPath.path, setPath.newVal);
        }

        return obj;
    }

    /** Converts all dates to ISOStrings
     *
     * @param {object|array} obj - object to rename key on
     * @return {*}
     */
    static convertDateTOISOString(obj) {
        Magic.walk(obj, function (value, path) {
            if ($check.date(value)) {
                Magic.set(obj, path, value.toISOString());
            }
        });

        return obj;
    }

    /** Fixes an object or array to remove any fields starting with $ that can cause issues storing in mongo
     *
     * @param {array|object} obj - the object to convert
     * @return {*}
     */
    static fixForMongo(obj) {
        return Magic.renameKey(obj, (key, path) => {
            if (!key) return key;
            if (!$check.string(key)) return key;
            if (key.startsWith('$')) {
                key = '_' + key.substring(1);
            }
            key = key.replace(/\./g, '_');

            return key;
        });
    }

    /**
     * Sets a property and value on each object and subObject
     *
     * @param {array|object} obj - the object to convert
     * @param {string} property - the property name to set
     * @param {*} value - the value to set
     * @param {boolean} override - override the value
     * @return {*}
     */
    static setProperty(obj, property, value, override) {
        if (!obj) return obj;

        // if not an object or array, then base path
        if (!$check.object(obj) && !$check.array(obj)) {
            return obj;
        }

        const setPaths = [];

        const inner = (curObj, curPath, curKey) => {
            if ($check.array(curObj)) {
                for (let i = 0; i < curObj.length; i++) {
                    inner(curObj[i], curPath.concat(i), i);
                }
            } else if ($check.object(curObj)) {
                if (!curObj[property] || override) {
                    setPaths.push({
                        path: curPath.concat(property),
                    });
                }

                for (const k in curObj) {
                    if (!curObj.hasOwnProperty(k)) continue;
                    inner(curObj[k], curPath.concat(k), k);
                }
            }
        };

        inner(obj, [], null);

        for (const setPath of setPaths) {
            Magic.set(obj, setPath.path, value);
        }

        return obj;
    }
}

function makeString(object) {
    if (object == null) return '';
    return '' + object;
}

function count(str, substr) {
    str = makeString(str);
    substr = makeString(substr);

    if (str.length === 0 || substr.length === 0) return 0;

    return str.split(substr).length - 1;
}

module.exports = Magic;
