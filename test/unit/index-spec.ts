import { expect } from "chai";
import "mocha";

import { SelectiveCopy } from "../../src/selective-copy.js";
import * as _index from "../../src/index.js";

describe("index", function () {
  it("should export the expected modules and classes", () => {
    expect(_index.SelectiveCopy).to.equal(_index.SelectiveCopy);

    expect(_index.default).to.equal(SelectiveCopy);
  });
});
