/**
 * Type definition file for the json-magic library
 */

/**
 * A path into a JSON object, can be either a string (slash or dot notation) or array of string path segments
 */
type JSONPath = string | string[];

/**
 * Dictionary mapping paths to values
 */
type Dictionary<T = any> = Record<string, T>;

/**
 * An object with a path and value
 */
interface PathValuePair {
    path: string;
    value: any;
}

/**
 * A function that is called for each value in a walk operation
 */
type IteratorFunction = (value: any, path: string) => void;

/**
 * A function that determines if a key should be renamed
 */
type RenamerFunction = (key: string | number, path: string) => string | number | null | undefined;

/**
 * A function that changes a value
 */
type ChangerFunction = (value: any, path: string) => any;

/**
 * Magic JSON utility library
 */
declare const $json: {
    /**
     * Parse a string path to an array
     * @example
     * // Parse a slash-separated path
     * $json.parsePath('a/b/c'); // Returns ['a', 'b', 'c']
     *
     * @example
     * // Parse a dot-separated path
     * $json.parsePath('a.b.c'); // Returns ['a', 'b', 'c']
     *
     * @example
     * // Parse with a custom separator
     * $json.parsePath('a$$b$$c', '$$'); // Returns ['a', 'b', 'c']
     *
     * @example
     * // Parse ignoring separator
     * $json.parsePath('a$$b$$c', '$$', true); // Returns ['a$$b$$c']
     */
    parsePath(path: JSONPath, separator?: string | null, ignoreSeparator?: boolean): string[] | null;

    /**
     * Compiles an array to a path
     * @example
     * // Compile to slash-separated path
     * $json.compilePath(['a', 'b', 'c']); // Returns '/a/b/c'
     *
     * @example
     * // Compile to dot-separated path
     * $json.compilePath(['a', 'b', 'c'], '.'); // Returns 'a.b.c'
     *
     * @example
     * // Compile with custom separator and no leading separator
     * $json.compilePath(['a', 'b', 'c'], '$$', true); // Returns 'a$$b$$c'
     */
    compilePath(path: string[], separator?: string, ignoreLeading?: boolean): string | null;

    /**
     * Check if the path is in the object
     * @example
     * // Check if a path exists (slash notation)
     * $json.has({a: {b: {c: 1}}}, '/a/b/c'); // Returns true
     *
     * @example
     * // Check if a path exists (dot notation)
     * $json.has({a: {b: {c: 1}}}, 'a.b'); // Returns true
     *
     * @example
     * // Check non-existent path
     * $json.has({a: {b: null}}, '/a/b/c'); // Returns false
     */
    has(obj: any, path: JSONPath): boolean;

    /**
     * Lookup a value in an object by path
     * @example
     * // Get a value using dot notation
     * $json.get({a: {b: {c: 1}}}, '.a.b.c'); // Returns 1
     *
     * @example
     * // Get a value using slash notation
     * $json.get({a: {b: {c: 1}}}, '/a/b'); // Returns {c: 1}
     *
     * @example
     * // Get a value from an array
     * $json.get([{a: {b: {c: 1}}}], '0/a/b'); // Returns {c: 1}
     *
     * @example
     * // Get a value with a path containing special characters
     * $json.get({'b/c': 1}, '/b/c', null, true); // Returns 1
     */
    get(obj: any, path: JSONPath, separator?: string | null, ignoreSeparator?: boolean): any;

    /**
     * Set a value for the path on the specified object
     * @example
     * // Set a nested value using dot notation
     * const obj = {};
     * $json.set(obj, '.a.b.c', 1);
     * // obj is now {a: {b: {c: 1}}}
     *
     * @example
     * // Set a value using slash notation
     * const obj = {};
     * $json.set(obj, '/a/b', {c: 1});
     * // obj is now {a: {b: {c: 1}}}
     *
     * @example
     * // Set a value on an array
     * const arr = [];
     * $json.set(arr, '/0', 'Val1');
     * // arr is now ['Val1']
     *
     * @example
     * // Set a value ignoring separator
     * const obj = {};
     * $json.set(obj, '/a/b', 1, true);
     * // obj is now {'a/b': 1}
     */
    set(obj: any, path: JSONPath, value: any, ignoreSeparator?: boolean): any;

    /**
     * Removes the value at the specified path
     * @example
     * // Remove a nested value
     * const obj = {a: {b: {c: 1}}};
     * $json.remove(obj, '/a/b/c');
     * // obj is now {a: {b: {}}}
     */
    remove(obj: any, path: JSONPath): any;

    /**
     * Returns a dictionary of paths generated from the object
     * @example
     * // Get path dictionary with slash notation
     * $json.pathDict({a: {b: {c: 1, d: 2}}});
     * // Returns {'/a/b/c': 1, '/a/b/d': 2}
     *
     * @example
     * // Get path dictionary with dot notation
     * $json.pathDict({a: {b: {c: 1, d: 2}}}, 'dot');
     * // Returns {'a.b.c': 1, 'a.b.d': 2}
     */
    pathDict(obj: any, separator?: string): Dictionary;

    /**
     * Returns an array of paths defined in the object
     * @example
     * // Get path array with slash notation
     * $json.pathArray({a: {b: {c: 1, d: 2}}});
     * // Returns [{path: '/a/b/c', value: 1}, {path: '/a/b/d', value: 2}]
     *
     * @example
     * // Get path array with dot notation
     * $json.pathArray({a: {b: {c: 1, d: 2}}}, 'dot');
     * // Returns [{path: 'a.b.c', value: 1}, {path: 'a.b.d', value: 2}]
     */
    pathArray(obj: any, format?: string): PathValuePair[];

    /**
     * Walk an object or array and call an iterator function
     * @example
     * // Walk through an object
     * const obj = {a: {b: {c: 1, d: 2}, x: 'abc'}};
     * const walkedVals = {};
     * $json.walk(obj, function(value, path) {
     *   walkedVals[path] = value;
     * });
     * // walkedVals is now {'/a/b/c': 1, '/a/b/d': 2, '/a/x': 'abc'}
     *
     * @example
     * // Walk with dot notation
     * const obj = {a: {b: {c: 1, d: 2}, x: 'abc'}};
     * const walkedVals = {};
     * $json.walk(obj, function(value, path) {
     *   walkedVals[path] = value;
     * }, '.');
     * // walkedVals is now {'a.b.c': 1, 'a.b.d': 2, 'a.x': 'abc'}
     */
    walk(obj: any, iterator: IteratorFunction, separator?: string): void;

    /**
     * Renames a key by the renamer function
     * @example
     * // Rename a specific key
     * const obj = {a: {b: {c: 1, d: 2}, x: 'abc'}};
     * $json.renameKey(obj, (key, path) => {
     *   if (key === 'c') {
     *     return 'r';
     *   }
     *   return key;
     * });
     * // obj is now {a: {b: {r: 1, d: 2}, x: 'abc'}}
     *
     * @example
     * // Rename multiple keys
     * const obj = {a: {b: [{c: 1, d: 2}, {c: 4, d: 5}], x: 'abc'}};
     * $json.renameKey(obj, (key, path) => {
     *   if (key === 'c') return 'r';
     *   if (key === 'x') return 'x2';
     *   return key;
     * });
     * // obj is now {a: {b: [{r: 1, d: 2}, {r: 4, d: 5}], x2: 'abc'}}
     */
    renameKey(obj: any, renamer: RenamerFunction, separator?: string): any;

    /**
     * Changes a value in an object passing each value to the changer function
     * @example
     * // Change specific values
     * const obj = {a: {b: {c: 1, d: 2}, x: 'abc'}};
     * $json.changeValue(obj, (val, path) => {
     *   if (val === 2) {
     *     return 20;
     *   }
     *   return val;
     * });
     * // obj is now {a: {b: {c: 1, d: 20}, x: 'abc'}}
     */
    changeValue(obj: any, changer: ChangerFunction, separator?: string): any;

    /**
     * Converts all dates to ISOStrings
     * @example
     * // Convert Date objects to ISO strings
     * const obj = {a: {b: {c: 1, d: new Date('2017-01-01T23:45:45Z')}, x: '2017-01-01'}};
     * $json.convertDateTOISOString(obj);
     * // obj is now {a: {b: {c: 1, d: '2017-01-01T23:45:45.000Z'}, x: '2017-01-01'}}
     */
    convertDateTOISOString(obj: any): any;

    /**
     * Fixes an object or array to remove any fields starting with $ that can cause issues storing in mongo
     * @example
     * // Fix MongoDB incompatible field names
     * const obj = {$a: {'b.a': {c: 1, d: 'xxx'}, x: '2017-01-01'}};
     * $json.fixForMongo(obj);
     * // obj is now {_a: {b_a: {c: 1, d: 'xxx'}, x: '2017-01-01'}}
     */
    fixForMongo(obj: any): any;

    /**
     * Sets a property and value on each object and subObject
     * @example
     * // Set a property on all objects and sub-objects
     * const obj = {a: 1, b: {c: 2}, d: [{e: 1}, {e: 2}]};
     * $json.setProperty(obj, 'val', 'value');
     * // obj is now {a: 1, val: 'value', b: {val: 'value', c: 2}, d: [{e: 1, val: 'value'}, {e: 2, val: 'value'}]}
     *
     * @example
     * // Set with override
     * const obj = {a: 1, val: 2};
     * $json.setProperty(obj, 'val', 'value', true);
     * // obj is now {a: 1, val: 'value'}
     */
    setProperty(obj: any, property: string, value: any, override?: boolean): any;
};

export = $json;
