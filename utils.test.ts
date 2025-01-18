import {
  isSimpleQuestion,
  isValidConversation,
  getTexts,
  getFormattedText,
} from "./utils";

test("testIsSimpleQuestion", () => {
  expect(isSimpleQuestion("  hello  ")).toStrictEqual(true);
  expect(isSimpleQuestion("# Q\n####  hello  ")).toStrictEqual(false);
});

test("testIsValidConversation", () => {
  //expect(isValidConversation("  hello  ")).toStrictEqual(false);
  expect(isValidConversation("# Q\n####  hello  ")).toStrictEqual(true);
});

test("testGetTexts", () => {
  expect(
    getTexts(`# Q
####    hello  `)
  ).toStrictEqual([`hello`]);
  expect(
    getTexts(
      `# Q
#### hello

---
# A
hi

how are you?

---
# Q
#### i'm fine
`
    )
  ).toStrictEqual([
    `hello`,
    `hi

how are you?`,
    `i'm fine`,
  ]);
  expect(
    getTexts(
      `# Q
#### hello

---
# A
hi
---
how are you?

---
# Q
#### i'm fine
`
    )
  ).toStrictEqual([
    `hello`,
    `hi
---
how are you?`,
    `i'm fine`,
  ]);
  expect(
    getTexts(
      `# Q
#### a

---
# A
b

---
# Q
#### c

---
# A
d

---
# Q
#### e`
    )
  ).toStrictEqual([`a`, `b`, `c`, `d`, `e`]);
});

test("testGetFormattedText", () => {
  expect(getFormattedText(["a"])).toStrictEqual(`# Q
#### a`);
  expect(getFormattedText(["a", "b", "c"])).toStrictEqual(`# Q
#### a

---
# A
b

---
# Q
#### c`);
  expect(getFormattedText(["a", "b", "c", "d", "e"])).toStrictEqual(`# Q
#### a

---
# A
b

---
# Q
#### c

---
# A
d

---
# Q
#### e`);
});
