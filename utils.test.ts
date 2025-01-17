import { getWrittenMessages } from "./utils";

test("test_func", () => {
  expect(getWrittenMessages("hello")).toStrictEqual(["hello"]);
});
