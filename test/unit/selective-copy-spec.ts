import {
  MockImportHelper,
  testValues as _testValues,
} from "@vamship/test-utils";
import chai from "chai";
import { stub } from "sinon";
import chaiAsPromised from "chai-as-promised";
import _esmock from "esmock";
import sinonChai from "sinon-chai";
import { SelectiveCopy } from "../../src/selective-copy.js";

chai.use(sinonChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("SelectiveCopy", () => {
  // function createSelectiveCopy(props: string[] = []) {
  //     return new SelectiveCopy(props);
  // }
  type ImportResult = {
    testTarget: typeof SelectiveCopy;
  };
  async function _import(): Promise<ImportResult> {
    const importHelper = new MockImportHelper<SelectiveCopy>(
      "project://src/selective-copy.js",
      {},
      import.meta.resolve("../../../working")
    );

    const targetModule = await _esmock(
      importHelper.importPath,
      importHelper.getLibs(),
      importHelper.getGlobals()
    );
    return {
      testTarget: targetModule.SelectiveCopy,
    };
  }
  describe("[Static Methods]", async function () {
    it("should return a class with expected static methods", async function () {
      const { testTarget: TargetClass } = await _import();
      expect(TargetClass).to.be.a("function");
      expect(TargetClass.extractPropertyNames).to.be.a("function");
    });
  });

  describe("[STATIC] extractPropertyNames()", async function () {
    _testValues.allButObject().forEach((src: any) => {
      it(`should throw an error if invoked without a valid object (src=${src})`, async function () {
        const error = "Invalid object specified (arg #1)";
        const { testTarget: TargetClass } = await _import();
        const wrapper = () => {
          return TargetClass.extractPropertyNames(src);
        };
        expect(wrapper).to.throw(error);
      });
    });

    it("should return an array when invoked with a valid object", async function () {
      const { testTarget: TargetClass } = await _import();

      const ret = TargetClass.extractPropertyNames({
        foo: "bar",
      });
      expect(ret).to.be.an("array");
    });

    it("should return an empty array if the input object is empty", async function () {
      const { testTarget: TargetClass } = await _import();

      const ret = TargetClass.extractPropertyNames({});

      expect(ret).to.be.an("array").and.to.be.empty;
    });
    it("should return a simple list of property names for non nested objects", async function () {
      const src = {
        foo: "bar",
        abc: 123,
        baz: () => {},
        isOk: true,
      };
      const { testTarget: TargetClass } = await _import();

      const ret = TargetClass.extractPropertyNames(src);

      expect(ret).to.deep.equal(Object.keys(src));
    });

    it('should recursively process nested objects, returning "." separated property names where necessary', async function () {
      const src = {
        foo: "bar",
        abc: 123,
        baz: () => {},
        isOk: true,
        nest: {
          another: "prop",
          secondNest: {
            thisProp: "is deeper",
            count: 20,
          },
        },
      };
      const { testTarget: TargetClass } = await _import();

      const ret = TargetClass.extractPropertyNames(src);

      expect(ret).to.deep.equal([
        "foo",
        "abc",
        "baz",
        "isOk",
        "nest.another",
        "nest.secondNest.thisProp",
        "nest.secondNest.count",
      ]);
    });
    it("should recursively process nested arrays, using the array index as the property name", async function () {
      const src = {
        foo: "bar",
        abc: 123,
        baz: () => {},
        isOk: true,
        nest: {
          another: "prop",
          secondNest: {
            thisProp: "is deeper",
            count: 20,
          },
          items: [
            "test",
            123,
            false,
            null,
            undefined,
            {
              arrayProp: "foo",
              yetAnother: "bar",
              nestedArray: [1, 2, 3],
            },
            [5, 6, 7],
          ],
        },
      };
      const { testTarget: TargetClass } = await _import();

      const ret = TargetClass.extractPropertyNames(src);

      expect(ret).to.deep.equal([
        "foo",
        "abc",
        "baz",
        "isOk",
        "nest.another",
        "nest.secondNest.thisProp",
        "nest.secondNest.count",
        "nest.items.0",
        "nest.items.1",
        "nest.items.2",
        "nest.items.3",
        "nest.items.4",
        "nest.items.5.arrayProp",
        "nest.items.5.yetAnother",
        "nest.items.5.nestedArray.0",
        "nest.items.5.nestedArray.1",
        "nest.items.5.nestedArray.2",
        "nest.items.6.0",
        "nest.items.6.1",
        "nest.items.6.2",
      ]);
    });
    it("should only consider own properties, ignoring inherited props", async function () {
      const Parent = {
        foo: "bar",
        abc: "123",
      };

      class Child {
        baz: () => void;
        isOk: boolean;
        nest: {
          another: string;
          secondNest: {
            thisProp: string;
            count: number;
          };
        };

        constructor() {
          this.baz = () => {};
          this.isOk = true;
          this.nest = {
            another: "prop",
            secondNest: {
              thisProp: "is deeper",
              count: 20,
            },
          };
        }
      }

      // Assign prototype
      // Child.prototype = Parent;
      for (const key in Parent) {
        if (Parent.hasOwnProperty(key)) {
          (Child.prototype as any)[key] = (Parent as any)[key];
        }
      }

      // Usage
      const src = new Child();
      const { testTarget: TargetClass } = await _import();

      const ret = TargetClass.extractPropertyNames(src);

      expect(ret).to.deep.equal([
        "baz",
        "isOk",
        "nest.another",
        "nest.secondNest.thisProp",
        "nest.secondNest.count",
      ]);
    });
  });

  describe("ctor()", async function () {
    it("should return an object with expected methods and properties when invoked", async function () {
      const { testTarget: TargetClass } = await _import();
      const instance = new TargetClass();

      expect(instance).to.be.an("object");
      expect(instance.copy).to.be.a("function");
    });

    it("should make a copy of the properties passed via the constructor", async function () {
      const props = ["foo", "bar", "foo.bar", "foo.baz.0.chaz"];
      const { testTarget: TargetClass } = await _import();
      const instance = new TargetClass(props);

      expect(instance._properties).to.deep.equals(props);
      expect(instance._properties).to.not.equal(props);
    });

    _testValues.allButArray().forEach((props: any) => {
      it(`should ignore all non array arguments, and initialize properties with an empty array (props=${props})`, async function () {
        const { testTarget: TargetClass } = await _import();
        const instance = new TargetClass(props);
        expect(instance._properties).to.be.an("array").and.to.be.empty;
      });
    });
  });

  describe("copy()", async function () {
    async function _createSelectiveCopy(props: any = []) {
      props = props || [];
      const { testTarget: TargetClass } = await _import();
      return new TargetClass(props);
    }
    function _createSourceObject() {
      return {
        foo: "bar",
        abc: 123,
        list: [
          {
            prop1: "value",
            prop2: "another value",
          },
          13,
          null,
          () => {},
          [
            "foo",
            "bar",
            "baz",
            {
              nested: "prop",
              nested2: "prop2",
            },
          ],
          "abc",
          true,
        ],
        child: {
          another: "prop",
          candy: "lollipop",
          grandChild: {
            deep: "yes",
            secret: 42,
          },
        },
        isTrue: false,
        doSomething: () => {},
        notAssigned: null,
      };
    }

    it("should throw an error if invoked without a valid source object", async function () {
      const error = "Invalid source object specified (arg #1)";
      _testValues.allButObject().forEach(async function (src: any) {
        const wrapper = async function () {
          const instance = await _createSelectiveCopy(src);
          instance.copy(src);
        };

        expect(wrapper).to.throw(error);
      });
    });

    it("should throw an error if a transform function of an incorrect type is specified", async function () {
      _testValues
        .allButSelected("undefined", "function")
        .forEach(async function (transform: any) {
          const error = "Invalid transform function specified (arg #3)";
          const wrapper = async function () {
            const instance = await _createSelectiveCopy();
            instance.copy({}, {}, transform);
          };
          expect(wrapper).to.throw(error);
        });
    });

    it("should not throw an error if the transform function is omitted or a valid function is specified", async function () {
      [undefined, () => {}].forEach((transform) => {
        const wrapper = async function () {
          const instance = await _createSelectiveCopy();
          instance.copy({}, {}, transform);
        };
        expect(wrapper).to.not.throw();
      });
    });

    it("should return a reference to a destination object if a valid destination object was specified", async function () {
      [{}, []].forEach(async (dest) => {
        const instance = await _createSelectiveCopy();
        const ret = instance.copy({}, dest);
        expect(ret).to.equal(dest);
      });
    });

    it("should return an new object if a valid destination object was not specified", async function () {
      _testValues
        .allButSelected("object", "array")
        .forEach(async (dest: any) => {
          const instance = await _createSelectiveCopy();

          const ret = instance.copy({}, dest);

          expect(ret).to.be.an("object");
          expect(ret).to.not.equal(dest);
        });
    });

    it("should return an empty object if no props values are specified", async function () {
      const instance = await _createSelectiveCopy([]);
      const ret = instance.copy(_createSourceObject());

      expect(ret).to.be.an("object");
      expect(ret).to.be.empty;
    });

    it("should return an empty object if props values are specified, but the source does not define them", async function () {
      const instance = await _createSelectiveCopy([
        "missing",
        "nada",
        "nomatch",
      ]);
      const ret = instance.copy({
        foo: "bar",
        abc: "123",
      });

      expect(ret).to.be.an("object");
      expect(ret).to.be.empty;
    });

    it("should copy shallow properties from source to destination", async function () {
      const props = [
        "foo",
        "abc",
        "isTrue",
        "doSomething",
        "list",
        "child",
        "notAssigned",
      ];
      const src: any = _createSourceObject();
      const instance = await _createSelectiveCopy(props);

      const ret = instance.copy(src);

      props.forEach((prop) => {
        expect(ret[prop]).to.equal(src[prop]);
      });
    });

    it("should only copy the specified properties from source to destination", async function () {
      const props = ["foo", "isTrue"];
      const src: any = _createSourceObject();
      const instance = await _createSelectiveCopy(props);

      const ret = instance.copy(src);

      props.forEach((prop) => {
        expect(ret[prop]).to.equal(src[prop]);
        delete ret[prop];
      });

      expect(ret).to.be.an("object").and.to.be.empty;
    });

    it("should parse dot separated property names and copy source properties", async function () {
      const props = ["child.another", "child.grandChild.secret"];
      const src = _createSourceObject();
      const instance = await _createSelectiveCopy(props);

      const ret = instance.copy(src);

      expect(ret).to.deep.equal({
        child: {
          another: src.child.another,
          grandChild: {
            secret: src.child.grandChild.secret,
          },
        },
      });
    });

    it("should support deep copy within arrays", async function () {
      const src: any = _createSourceObject();
      const props = [
        "list.0.prop1",
        "list.1",
        "list.2",
        "list.3",
        "list.4.0",
        "list.4.3.nested",
        "list.5",
        "list.6",
      ];
      const instance = await _createSelectiveCopy(props);

      const ret = instance.copy(src);
      expect(ret.list).to.be.an("array");
      expect(ret.list[0]).to.be.an("object");
      expect(ret.list[0]).to.not.equal(src.list[0]);
      expect(ret.list[0]).to.deep.equal({
        prop1: src.list[0].prop1,
      });

      expect(ret.list[1]).to.equal(src.list[1]);
      expect(ret.list[2]).to.equal(src.list[2]);
      expect(ret.list[3]).to.equal(src.list[3]);

      expect(ret.list[4]).to.be.an("array");
      expect(ret.list[4]).to.not.equal(src.list[4]);
      expect(ret.list[4][0]).to.equal(src.list[4][0]);
      expect(ret.list[4][1]).to.be.undefined;
      expect(ret.list[4][2]).to.be.undefined;
      expect(ret.list[4][3]).to.be.an("object");
      expect(ret.list[4][3]).to.not.equal(src.list[4][3]);
      expect(ret.list[4][3]).to.deep.equal({
        nested: src.list[4][3].nested,
      });

      expect(ret.list[5]).to.equal(src.list[5]);
      expect(ret.list[6]).to.equal(src.list[6]);
    });

    it("should ignore deep copy properties if the source does not define them", async function () {
      const props = ["child.missingProp", "another.missing.property"];
      const src: any = _createSourceObject();
      const instance = await _createSelectiveCopy(props);

      const ret = instance.copy(src);

      expect(ret.child).to.be.undefined;
    });

    it("should invoke the transform function for every property that is being copied", async function () {
      const transform = stub();
      const props = ["foo", "abc", "child.grandChild.deep", "badProp"];
      const src = _createSourceObject();
      const instance = await _createSelectiveCopy(props);

      expect(transform).to.not.have.been.called;
      instance.copy(src, undefined, transform);

      expect(transform.callCount).to.equal(3);
      expect(transform.args[0][0]).to.equal("foo");
      expect(transform.args[0][1]).to.equal(src.foo);

      expect(transform.args[1][0]).to.equal("abc");
      expect(transform.args[1][1]).to.equal(src.abc);

      expect(transform.args[2][0]).to.equal("child.grandChild.deep");
      expect(transform.args[2][1]).to.equal(src.child.grandChild.deep);
    });

    it("should invoke use the return value from the transform function as the target property value", async function () {
      const transformResponse = 75;
      const transform = stub().returns(transformResponse);
      const props = ["foo", "abc", "child.grandChild.deep", "badProp"];
      const src = _createSourceObject();
      const instance = await _createSelectiveCopy(props);

      expect(transform).to.not.have.been.called;
      const ret = instance.copy(src, undefined, transform);

      expect(ret).to.deep.equal({
        foo: transformResponse,
        abc: transformResponse,
        child: {
          grandChild: {
            deep: transformResponse,
          },
        },
      });
    });
  });
});
