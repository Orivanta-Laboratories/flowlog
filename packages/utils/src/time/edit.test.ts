import assert from "node:assert/strict";
import { test } from "node:test";
import { splitTrackedSeconds } from "./index";

test("splitting distributes recorded time without billing gaps", () => {
	assert.deepEqual(splitTrackedSeconds(600, 900, 450), [300, 300]);
});
test("splitting preserves every whole second", () => {
	assert.deepEqual(splitTrackedSeconds(601, 900, 450), [300, 301]);
});
