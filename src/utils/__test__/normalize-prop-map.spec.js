/* eslint-env jest */
import normalize from '../normalize-prop-map';

describe('normalize-prop-map', () => {
	test('array', () => {
		const normalized = normalize(['key1', 'key2']);

		expect((Object.keys(normalized)).length).toEqual(2);
		expect(normalized.hasOwnProperty('key1')).toBeTruthy();
		expect(normalized.hasOwnProperty('key2')).toBeTruthy();
	});

	test('object', () => {
		const propMap = {'key1': 'key1', 'key2': 'key2'};

		expect(normalize(propMap)).toEqual(propMap);
	});
});
