/* eslint-env jest */
import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';

import ContextWrapper from '../../Context';
import useStoreValue from '../use-store-value';

describe('useStoreValue Tests', () => {
	test('Returns a truthy object to de-structure, blocks reading after-the-fact', async () => {
		const dummyStore = {
			addChangeListener: jest.fn(),
			removeChangeListener: jest.fn(),
			get: name => (name === 'someProperty' ? 'foo' : dummyStore[name]),
			[Symbol.iterator]() {
				const snapshot = [1, 2, 3];
				const { length } = snapshot;
				let index = 0;

				return {
					[Symbol.iterator]() {
						return this;
					},
					next() {
						const done = index >= length;
						const value = snapshot[index++];

						return { value, done };
					},
				};
			},
		};

		const { result } = renderHook(() => {
			const intermediate = useStoreValue(dummyStore);
			return {
				intermediate,
				someProperty: intermediate.someProperty,
				iterator: intermediate[Symbol.iterator],
			};
		});
		expect(result.current.intermediate).toBeTruthy();
		expect(result.current.someProperty).toBe('foo');
		expect(result.current.iterator).toEqual(expect.any(Function));
		expect(result.current.iterator.source).toBe(
			dummyStore[Symbol.iterator].toString()
		);

		expect(() => result.current.intermediate.someProperty).toThrow();

		expect(Array.from(result.current.iterator())).toEqual([1, 2, 3]);
	});

	test('Spreading the proxy throws an error', async () => {
		const dummyStore = {
			addChangeListener: jest.fn(),
			removeChangeListener: jest.fn(),
			get() {},
		};

		const { result } = renderHook(() => {
			const { ...all } = useStoreValue(dummyStore);
			return all;
		});

		expect(() => result.current).toThrow(/Operation Not Allowed/);

		expect(result.error).toMatchInlineSnapshot(
			'[Error: Operation Not Allowed]'
		);
	});

	test('Does not update listener on re-render, cleans up on unmount', async () => {
		let handler;
		let value = 'foo';
		const dummyStore = {
			addChangeListener: jest.fn().mockImplementation(x => (handler = x)),
			removeChangeListener: jest.fn().mockImplementation(x => {
				if (x !== handler) {
					throw new Error(
						'Simple Test expects exactly the same handler as add'
					);
				}
				handler = null;
			}),
			get: name => (name === 'someProperty' ? value : undefined),
		};

		const { unmount, result } = renderHook(
			() => useStoreValue(dummyStore).someProperty
		);
		expect(result.current).toBe('foo');

		expect(dummyStore.addChangeListener).toHaveBeenCalledTimes(1);
		expect(dummyStore.removeChangeListener).toHaveBeenCalledTimes(0);

		act(() => {
			value = 'bar';
			handler({ type: 'someProperty' });
		});

		expect(result.current).toBe('bar');
		expect(dummyStore.addChangeListener).toHaveBeenCalledTimes(1);
		expect(dummyStore.removeChangeListener).toHaveBeenCalledTimes(0);

		unmount();

		expect(dummyStore.addChangeListener).toHaveBeenCalledTimes(1);
		expect(dummyStore.removeChangeListener).toHaveBeenCalledTimes(1);
	});

	test('Gets store from context', async () => {
		const dummyStore = {
			addChangeListener: jest.fn(),
			removeChangeListener: jest.fn(),
			get: name => (name === 'someProperty' ? 'foo' : undefined),
		};

		const wrapper = ({ children }) => (
			<ContextWrapper store={dummyStore}>{children}</ContextWrapper>
		);

		const { result } = renderHook(() => useStoreValue().someProperty, {
			wrapper,
		});

		expect(result.current).toBe('foo');
	});

	test('Gets store from context with predicate', async () => {
		const dummyStore1 = {
			addChangeListener: jest.fn(),
			removeChangeListener: jest.fn(),
			get() {},
		};

		const dummyStore2 = {
			someIdentifyingMark: true,
			addChangeListener: jest.fn(),
			removeChangeListener: jest.fn(),
			get: name => (name === 'someProperty' ? 'foo' : undefined),
		};

		const wrapper = ({ children }) => (
			<ContextWrapper store={dummyStore2}>
				<ContextWrapper store={dummyStore1}>{children}</ContextWrapper>
			</ContextWrapper>
		);

		const predicate = store => store?.someIdentifyingMark;

		const { result } = renderHook(
			() => useStoreValue(predicate).someProperty,
			{ wrapper }
		);

		expect(result.current).toBe('foo');
	});

	test('Gets values across stores', async () => {
		const dummyStore1 = {
			addChangeListener: jest.fn(),
			removeChangeListener: jest.fn(),
			get: name => (name === 'someProperty' ? 'foo' : undefined),
		};

		const dummyStore2 = {
			addChangeListener: jest.fn(),
			removeChangeListener: jest.fn(),
			get: name => (name === 'anotherProperty' ? 'bar' : undefined),
		};

		const wrapper = ({ children }) => (
			<ContextWrapper store={dummyStore2}>
				<ContextWrapper store={dummyStore1}>{children}</ContextWrapper>
			</ContextWrapper>
		);

		const { result } = renderHook(
			() => {
				const { someProperty, anotherProperty } = useStoreValue();
				return { someProperty, anotherProperty };
			},
			{ wrapper }
		);

		expect(result.current.someProperty).toBe('foo');
		expect(result.current.anotherProperty).toBe('bar');
	});
});
