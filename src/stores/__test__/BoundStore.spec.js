/* eslint-env jest */
import BoundStore from '../BoundStore';

describe('BoundStore', () => {
	describe('Instance', () => {
		describe('propsChanged', () => {});
	});

	describe('Static', () => {
		describe('validateConnection', () => {
			test('throws if the param defined deriveStoreKeyFromProps', () => {
				expect(() => {
					BoundStore.validateConnection({
						deriveStoreKeyFromProps: () => {},
					});
				}).toThrow();
			});

			test('does not throw if the param does not define deriveStoreKeyFromProps', () => {
				expect(() => {
					BoundStore.validateConnection({});
				}).not.toThrow();
			});
		});
	});
});
