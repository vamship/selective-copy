/* jshint node:true, expr:true */
'use strict';

const _sinon = require('sinon');
const _chai = require('chai');
_chai.use(require('sinon-chai'));
_chai.use(require('chai-as-promised'));
const expect = _chai.expect;

const _testHelper = require('wysknd-test');
const _testValueProvider = _testHelper.testValueProvider;
let SelectiveCopy = null;

describe('SelectiveCopy', () => {

    function _createSelectiveCopy(props) {
        props = props || [];
        return new SelectiveCopy(props);
    }

    beforeEach(() => {
        SelectiveCopy = require('../../src/selective-copy');
    });

    describe('ctor()', () => {
        it('should return an object with expected methods and properties when invoked', () => {
            const instance = new SelectiveCopy();

            expect(instance).to.be.an('object');
            expect(instance.copy).to.be.a('function');

            expect(instance._properties).to.be.an('array').and.to.be.empty;
        });

        it('should make a copy of the properties passed via the constructor', () => {
            const props = ['foo', 'bar', 'foo.bar', 'foo.baz.0.chaz'];
            const instance = new SelectiveCopy(props);

            expect(instance._properties).to.deep.equals(props);
            expect(instance._properties).to.not.equal(props);
        });

        it('should ignore all non array arguments, and initialize properties with an empty array', () => {
            _testValueProvider.allButArray().forEach((props) => {
                const instance = new SelectiveCopy(props);

                expect(instance._properties).to.be.an('array').and.to.be.empty;
            });
        });
    });

    describe('copy()', () => {
        function _createSourceObject() {
            return {
                foo: 'bar',
                abc: 123,
                list: [{
                    prop1: 'value',
                    prop2: 'another value'
                }, 13, null, () => {
                }, ['foo', 'bar', 'baz', {
                    nested: 'prop',
                    nested2: 'prop2'
                }], 'abc', true],
                child: {
                    another: 'prop',
                    candy: 'lollipop',
                    grandChild: {
                        deep: 'yes',
                        secret: 42
                    }
                },
                isTrue: false,
                doSomething: () => {
                },
                notAssigned: null
            };
        }

        it('should throw an error if invoked without a valid source object', () => {
            const error = 'Invalid source object specified (arg #1)';
            _testValueProvider.allButObject().forEach((src) => {
                const wrapper = () => {
                    const instance = _createSelectiveCopy();
                    instance.copy(src);
                };

                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if a transform function of an incorrect type is specified', () => {
            const error = 'Invalid transform function specified (arg #3)';
            _testValueProvider.allButSelected('undefined', 'function').forEach((transform) => {
                const wrapper = () => {
                    const instance = _createSelectiveCopy();
                    instance.copy({}, {}, transform);
                };

                expect(wrapper).to.throw(error);
            });
        });

        it('should not throw an error if the transform function is omitted or a valid function is specified', () => {
            [undefined, () => {
            }].forEach((transform) => {
                const wrapper = () => {
                    const instance = _createSelectiveCopy();
                    instance.copy({}, {}, transform);
                };

                expect(wrapper).to.not.throw();
            });
        });

        it('should return a reference to a destination object if a valid destination object was specified', () => {
            [{}, []].forEach((dest) => {
                const instance = _createSelectiveCopy();
                const ret = instance.copy({}, dest);

                expect(ret).to.equal(dest);
            });
        });

        it('should return an new object if a valid destination object was not specified', () => {
            _testValueProvider.allButSelected('object', 'array').forEach((dest) => {
                const instance = _createSelectiveCopy();

                const ret = instance.copy({}, dest);

                expect(ret).to.be.an('object');
                expect(ret).to.not.equal(dest);
            });
        });

        it('should return an empty object if no props values are specified', () => {
            const instance = _createSelectiveCopy([]);
            const ret = instance.copy(_createSourceObject());

            expect(ret).to.be.an('object');
            expect(ret).to.be.empty;
        });

        it('should return an empty object if props values are specified, but the source does not define them', () => {
            const instance = _createSelectiveCopy(['missing', 'nada', 'nomatch']);
            const ret = instance.copy({
                foo: 'bar',
                abc: '123'
            });

            expect(ret).to.be.an('object');
            expect(ret).to.be.empty;
        });

        it('should copy shallow properties from source to destination', () => {
            const props = ['foo', 'abc', 'isTrue', 'doSomething', 'list', 'child', 'notAssigned'];
            const src = _createSourceObject();
            const instance = _createSelectiveCopy(props);

            const ret = instance.copy(src);

            props.forEach((prop) => {
                expect(ret[prop]).to.equal(src[prop]);
            });
        });

        it('should only copy the specified properties from source to destination', () => {
            const props = ['foo', 'isTrue'];
            const src = _createSourceObject();
            const instance = _createSelectiveCopy(props);

            const ret = instance.copy(src);

            props.forEach((prop) => {
                expect(ret[prop]).to.equal(src[prop]);
                delete ret[prop];
            });

            expect(ret).to.be.an('object').and.to.be.empty;
        });

        it('should parse dot separated property names and copy source properties', () => {
            const props = ['child.another', 'child.grandChild.secret'];
            const src = _createSourceObject();
            const instance = _createSelectiveCopy(props);

            const ret = instance.copy(src);

            expect(ret).to.deep.equal({
                child: {
                    another: src.child.another,
                    grandChild: {
                        secret: src.child.grandChild.secret
                    }
                }
            });
        });

        it('should support deep copy within arrays', () => {
            const src = _createSourceObject();
            const props = [
                'list.0.prop1',
                'list.1',
                'list.2',
                'list.3',
                'list.4.0',
                'list.4.3.nested',
                'list.5',
                'list.6'
            ];
            const instance = _createSelectiveCopy(props);

            const ret = instance.copy(src);
            expect(ret.list).to.be.an('array');
            expect(ret.list[0]).to.be.an('object');
            expect(ret.list[0]).to.not.equal(src.list[0]);
            expect(ret.list[0]).to.deep.equal({
                prop1: src.list[0].prop1
            });

            expect(ret.list[1]).to.equal(src.list[1]);
            expect(ret.list[2]).to.equal(src.list[2]);
            expect(ret.list[3]).to.equal(src.list[3]);

            expect(ret.list[4]).to.be.an('array');
            expect(ret.list[4]).to.not.equal(src.list[4]);
            expect(ret.list[4][0]).to.equal(src.list[4][0]);
            expect(ret.list[4][1]).to.be.undefined;
            expect(ret.list[4][2]).to.be.undefined;
            expect(ret.list[4][3]).to.be.an('object');
            expect(ret.list[4][3]).to.not.equal(src.list[4][3]);
            expect(ret.list[4][3]).to.deep.equal({
                nested: src.list[4][3].nested
            });

            expect(ret.list[5]).to.equal(src.list[5]);
            expect(ret.list[6]).to.equal(src.list[6]);
        });

        it('should ignore deep copy properties if the source does not define them', () => {
            const props = ['child.missingProp', 'another.missing.property'];
            const src = _createSourceObject();
            const instance = _createSelectiveCopy(props);

            const ret = instance.copy(src);

            expect(ret.child).to.be.undefined;
        });

        it('should invoke the transform function for every property that is being copied', () => {
            const transform = _sinon.stub();
            const props = ['foo', 'abc', 'child.grandChild.deep', 'badProp'];
            const src = _createSourceObject();
            const instance = _createSelectiveCopy(props);

            expect(transform).to.not.have.been.called;
            instance.copy(src, undefined, transform);

            expect(transform.callCount).to.equal(3);
            expect(transform.args[0][0]).to.equal('foo');
            expect(transform.args[0][1]).to.equal(src.foo);

            expect(transform.args[1][0]).to.equal('abc');
            expect(transform.args[1][1]).to.equal(src.abc);

            expect(transform.args[2][0]).to.equal('child.grandChild.deep');
            expect(transform.args[2][1]).to.equal(src.child.grandChild.deep);
        });

        it('should invoke use the return value from the transform function as the target property value', () => {
            const transformResponse = 75;
            const transform = _sinon.stub().returns(transformResponse);
            const props = ['foo', 'abc', 'child.grandChild.deep', 'badProp'];
            const src = _createSourceObject();
            const instance = _createSelectiveCopy(props);

            expect(transform).to.not.have.been.called;
            const ret = instance.copy(src, undefined, transform);

            expect(ret).to.deep.equal({
                foo: transformResponse,
                abc: transformResponse,
                child: {
                    grandChild: {
                        deep: transformResponse
                    }
                }
            });
        });
    });
});
