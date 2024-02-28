import {
  MockImportHelper,
  testValues as _testValues,
} from "@vamship/test-utils";
import chai from "chai";
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
});
