## selective-copy

> Provides deep copy of selected attributes from source to destination.

This library differs from other object copy libraries in that it allows the user to choose the attributes that are being copied from source to destination. Nested attributes and attributes within arrays can be targeted without including the entire parent object or array

### Installation

```sh
npm install selective-copy
```

### Usage

```js
const SelectiveCopy = require("selective-copy");
const src = {
  foo: "bar",
  child: {
    grandChild: {
      name: "little joe",
    },
  },
  list: ["apples", "oranges", "bananas"],
};
const copier = new SelectiveCopy(["foo", "child.grandChild.name", "list.0"]);
const dest = copier.copy(src);

console.log(dest);
/* OUTPUT:
{
    foo: 'bar',
    child: {
        grandChild: {
            name: 'little joe'
        }
    },
    list: [ 'apples' ] }
*/
```

### API

```js
const SelectiveCopy = require("selective-copy");
```

---

#### Constructor

```js
const copier = new SelectiveCopy([props]);
```

`props`: An optional array of containing the properties that will be copied from the source to the destination object. If omitted, an empty array will be used. Obviously, an empty array means that no properties will be copied to the destination.

---

#### copy

```js
const dest = copier.copy(src, [dest], [transform]);
```

`src`: The source object from which properties will be copied to the destination. If the source does not define a property that has been requested for copying, it will be ignored.
`dest`: An optional destination property/array into which the properties from the source will be copied. If omitted, an empty object will be used as the destination object.
`transform = (propName, value) =>  value`: An optional transform function that can be used to transform the source property value before it is copied to the destination. If omitted, an identity transform will be used (source values will be copied with no changes).

**_returns_**: The destination object containing the copied properties. If a `dest` parameter was specified, the return value will be the same as the `dest` parameter.

---

### Examples

#### Copy Top Level Properties

```js
const SelectiveCopy = require("selective-copy");
const copier = new SelectiveCopy(["foo", "bar"]);
const src = {
  foo: {
    prop: "value",
  },
  bar: "123",
  baz: false,
  ignore: "this",
};
const dest = copier.copy(src);

dest.foo === src.foo; // true
dest.bar === "123"; //true
dest.baz === undefined; //true
dest.ignore === undefined; //true
```

#### Copy Nested Properties

```js
const SelectiveCopy = require("selective-copy");
const copier = new SelectiveCopy(["child.grandChild.name"]);
const src = {
  child: {
    name: "joe",
    grandChild: {
      name: "little joe",
    },
  },
};
const dest = copier.copy(src);

dest.child.grandChild.name === "little joe"; //true
dest.child === src.child; // false
dest.child.grandChild === src.child.grandChild; //false
```

#### Copy Array Elements

```js
const SelectiveCopy = require("selective-copy");
const copier = new SelectiveCopy(["list.0.name"]);
const src = {
  list: [
    {
      name: "bananas",
      cost: 2.5,
    },
    {
      name: "apples",
      cost: 3,
    },
    {
      name: "oranges",
      cost: 1.2,
    },
  ],
};
const dest = copier.copy(src);

dest.list instanceof Array; //true
typeof dest.list[0] === "object"; //true
dest.list[0].name === "bananas"; //true
dest.list[0].cost === undefined; //true
```

#### Transform Values and Copy

```js
const SelectiveCopy = require("selective-copy");
const transform = (propName, value) => {
  return value + 10;
};
const copier = new SelectiveCopy(["list.0.cost", "list.1.cost"]);
const src = {
  list: [
    {
      name: "bananas",
      cost: 2.5,
    },
    {
      name: "apples",
      cost: 3,
    },
    {
      name: "oranges",
      cost: 1.2,
    },
  ],
};
const dest = copier.copy(src, {}, transform);

dest.list instanceof Array; //true
typeof dest.list[0] === "object"; //true
dest.list[0].cost === 12.5; //true
typeof dest.list[1] === "object"; //true
dest.list[1].cost === 13; //true
```
