/* eslint-env jest */
import getBoundFunction from '../get-bound-function';

describe('get-bound-function', () => {
	test('actually calls the bound function', () => {
		let called = false;

		const fn = getBoundFunction(() => {
			called = true;
		}, {});

		fn();

		expect(called).toBeTruthy();
	});

	test('returns the same function for the same scope', () => {
		const fn = () => {};
		const scope = {};

		expect(getBoundFunction(fn, scope)).toEqual(
			getBoundFunction(fn, scope)
		);
	});
});
