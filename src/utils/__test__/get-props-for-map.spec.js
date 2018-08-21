/* eslint-env jest */
import getPropsForMap from '../get-props-for-map';

function buildStore (data) {
	return {
		get (key) {
			return data[key];
		}
	};
}

describe('get-props-for-map', () => {
	test('Only returns data in the prop map', () => {
		const store = buildStore({key1: 'key1', key2: 'key2', key3: 'key3'});
		const propMap = ['key1', 'key2'];

		const props = getPropsForMap(store, propMap);

		expect((Object.keys(props)).length).toEqual(2);
		expect(props.hasOwnProperty('key1')).toBeTruthy();
		expect(props.hasOwnProperty('key2')).toBeTruthy();
		expect(props.hasOwnProperty('key3')).toBeFalsy();
	});

	test('Returns value from the last store that defines it', () => {
		const store1 = buildStore({
			'store1Key': 'store1Key',
			'sharedKey': 'sharedKeyStore1'
		});
		const store2 = buildStore({
			'store2Key': 'store2Key',
			'sharedKey': 'sharedKeyStore2'
		});
		const propMap = ['store1Key', 'sharedKey', 'store2Key'];

		const props1 = getPropsForMap([store1, store2], propMap);

		expect(props1.store1Key).toEqual('store1Key');
		expect(props1.sharedKey).toEqual('sharedKeyStore2');
		expect(props1.store2Key).toEqual('store2Key');

		const props2 = getPropsForMap([store2, store1], propMap);

		expect(props2.store1Key).toEqual('store1Key');
		expect(props2.sharedKey).toEqual('sharedKeyStore1');
		expect(props2.store2Key).toEqual('store2Key');
	});
});
