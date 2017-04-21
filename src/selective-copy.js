'use strict';

/**
 * Identity transformation - returns the specified value unchanged.
 *
 * @param {String} propName The name of the source property
 * @param {Object} value The value of the source property
 *
 * @return {Object} The transformed value.
 */
function _identityTransform(propName, value) {
    return value;
}

/**
 * Allows selective deep copying of attributes from object to another
 */
class SelectiveCopy {
    /**
     * @param {Array} [properties=[]] An optional list of property names that
     *        identify the properties that will be copied from source to
     *        destination.
     *
     *        Property names can be single strings that reference top level
     *        properties, or dot separated values that reference child values.
     *        A numeric value can be used to reference indexed items within an
     *        array.
     */
    constructor(properties) {
        if (!(properties instanceof Array)) {
            properties = [];
        }
        this._properties = properties.map(item => item);
    }

    /**
     * Copies properties from the source to the destination object. The
     * properties to be copied are determined by the values passed to this
     * object via the constructor.
     *
     * @param {Object} src The source object to copy values from.
     * @param {Object} [dest={}] An optional destination object to copy values
     *        into. If omitted a new hash will be used.
     * @param {Function} [transform=(propName, value) => value] A transformation
     *        function that will be used to transform the source property before
     *        assigning it to the destination object. If omitted, an identity
     *        function will be used that copies values from source to destination
     *        without any transformation.
     *
     * @return {Object} The destination object that contains the copied values.
     */
    copy(src, dest, transform) {
        if (!src || (src instanceof Array) || typeof src !== 'object') {
            throw new Error('Invalid source object specified (arg #1)');
        }
        if (!dest || typeof dest !== 'object') {
            dest = {};
        }
        if (transform !== undefined && typeof transform !== 'function') {
            throw new Error('Invalid transform function specified (arg #3)');
        } else if (transform === undefined) {
            transform = _identityTransform;
        }

        return this._properties.reduce((aggregator, propName) => {
            const propKeys = propName.split('.');

            const srcPropValue = propKeys.reduce((parent, key) => {
                return (parent && typeof parent === 'object') ? parent[key] : undefined;
            }, src);

            if (srcPropValue !== undefined) {
                const leafKey = propKeys.pop();
                const target = propKeys.reduce((target, key) => {
                    let destChild = target.dest[key];
                    let srcChild = target.src[key];
                    if (!destChild || typeof destChild !== 'object') {
                        destChild = (srcChild instanceof Array) ? [] : {};
                        target.dest[key] = destChild;
                    }
                    return {
                        dest: destChild,
                        src: srcChild
                    };
                }, {
                    dest,
                    src
                });
                target.dest[leafKey] = transform(propName, srcPropValue);
            }

            return aggregator;
        }, dest);
    }
}

module.exports = SelectiveCopy;
