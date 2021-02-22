/* eslint-env jest */
import shouldUpdateForChange from '../should-update-for-change';

describe('should-update-for-change', () => {
	test('throws if there are no types on the change', () => {
		expect(shouldUpdateForChange({}, {})).toBeFalsy();
	});

	test('returns true if there is no propMap', () => {
		expect(shouldUpdateForChange({ type: 'key' })).toBeTruthy();
	});

	test('returns true if the type is in the propMap', () => {
		expect(shouldUpdateForChange({ type: ['key'] }, ['key'])).toBeTruthy();
	});

	test('returns false if the types is not in the propMap', () => {
		expect(shouldUpdateForChange({ type: 'no-key' }, ['key'])).toBeFalsy();
	});
});
