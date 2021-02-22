import { useEffect, useReducer } from 'react';

import { shouldUpdateForChange } from '../utils';
import getValueFromStore from '../utils/get-value-from-store';

import { useResolvedStore } from './resolve-store';

const ALWAYS_NEW_VALUE = () => Date.now();
const BLANK_TARGET = Object.seal({});
const NOT_ALLOWED = () => {
	throw new Error('Operation Not Allowed');
};

const BASE_PROXY_TRAPS = {
	apply: NOT_ALLOWED,
	construct: NOT_ALLOWED,
	defineProperty: NOT_ALLOWED,
	deleteProperty: NOT_ALLOWED,
	get: NOT_ALLOWED,
	getOwnPropertyDescriptor: NOT_ALLOWED,
	getPrototypeOf: NOT_ALLOWED,
	has: NOT_ALLOWED,
	isExtensible: NOT_ALLOWED,
	ownKeys: NOT_ALLOWED,
	preventExtensions: NOT_ALLOWED,
	set: NOT_ALLOWED,
	setPrototypeOf: NOT_ALLOWED,
};

/**
 * Use store values and auto-re-render when they change.
 * Ex:
 * ```js
 * // Pass a store directly
 * const {loading, items} = useStoreValue(myStore);
 * // Select a store from context
 * const {loading, items, anyStoreValue} = useStoreValue(store => store.isMyFavoriteStore);
 * // Use the nearest store from context
 * const {loading, items, sort} = useStoreValue();
 * // Also: use computed names and label friendly for local use:
 * const {[Store.LOADING]: loading, [Store.SOME_VALUE]: data} = useStoreValue();
 * ```
 *
 * @param {Store|Store[]|function(Store): boolean} [source] A store, an array of stores, or a function to select a store. The default resolves the store(s) from context.
 * @returns {Record<string, any>} ephemeral store getter proxy. Do not retain a reference to this value. Pull values immediately and discard this proxy.
 */
export default function useStoreValue(source = Boolean) {
	let locked = false;

	const stores = useResolvedStore(source);
	const monitoredProperties = new Set();
	const [, updateView] = useReducer(ALWAYS_NEW_VALUE);

	useEffect(() => {
		// prevent reading values after the initial call.
		locked = true;

		const changed = change => {
			if (shouldUpdateForChange(change, monitoredProperties)) {
				updateView();
			}
		};

		addChangeListener(stores, changed);
		return () => {
			removeChangeListener(stores, changed);
		};
	}, [stores]);

	return new Proxy(BLANK_TARGET, {
		...BASE_PROXY_TRAPS,
		get(_, propertyName) {
			if (locked) {
				throw new Error(
					'Do not store a reference to this intermediate proxy. Get values as properties and discard.'
				);
			}

			monitoredProperties.add(propertyName);
			return getValueFromStore(stores, propertyName);
		},
	});
}

function addChangeListener(stores, handler) {
	for (const store of stores) {
		store.addChangeListener(handler);
	}
}

function removeChangeListener(stores, handler) {
	for (const store of stores) {
		store.removeChangeListener(handler);
	}
}
