/* jshint node:true, expr:true */
'use strict';

const _chai = require('chai');
_chai.use(require('sinon-chai'));
_chai.use(require('chai-as-promised'));
const expect = _chai.expect;

const _index = require('../../src/index');
const SelectiveCopy = require('../../src/selective-copy');

describe('index', function() {
    it('should implement methods required by the interface', function() {
        expect(_index).to.be.a('function');
        expect(_index).to.equal(SelectiveCopy);
    });
});
