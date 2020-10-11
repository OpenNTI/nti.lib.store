/* eslint-env jest */
import { act, renderHook } from '@testing-library/react-hooks';

import useStoreValue from '../use-store-value';

describe('useStoreValue Tests', () => {

	test ('Returns a truthy object to de-structure, blocks reading after-the-fact', async () => {
		const dummyStore = {
			addChangeListener: jest.fn(),
			removeChangeListener: jest.fn(),
			get: (name) => name === 'someProperty' ? 'foo' : undefined
		};

		const { result } = renderHook(() => {
			const intermediate = useStoreValue(dummyStore);
			return {
				intermediate,
				someProperty: intermediate.someProperty
			};
		});
		expect(result.current.intermediate).toBeTruthy();
		expect(result.current.someProperty).toBe('foo');

		expect(() => result.current.intermediate.someProperty).toThrow();
	});

	test ('Does not update listener on re-render, cleans ups', async () => {
		let handler;
		let value = 'foo';
		const dummyStore = {
			addChangeListener: jest.fn().mockImplementation(x => handler = x),
			removeChangeListener: jest.fn().mockImplementation(x => {
				if (x !== handler) {
					throw new Error('Simple Test expects exactly the same handler as add');
				}
				handler = null;
			}),
			get: (name) => name === 'someProperty' ? value : undefined
		};

		const { unmount, result } = renderHook(() => useStoreValue(dummyStore).someProperty);
		expect(result.current).toBe('foo');

		expect(dummyStore.addChangeListener).toHaveBeenCalledTimes(1);
		expect(dummyStore.removeChangeListener).toHaveBeenCalledTimes(0);

		act(() => {
			value = 'bar';
			handler({type: 'someProperty'});
		});

		expect(result.current).toBe('bar');
		expect(dummyStore.addChangeListener).toHaveBeenCalledTimes(1);
		expect(dummyStore.removeChangeListener).toHaveBeenCalledTimes(0);

		unmount();

		expect(dummyStore.addChangeListener).toHaveBeenCalledTimes(1);
		expect(dummyStore.removeChangeListener).toHaveBeenCalledTimes(1);
	});

});
