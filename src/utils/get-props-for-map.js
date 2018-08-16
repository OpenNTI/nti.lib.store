import getBoundFunction from './get-bound-function';
import normalizePropmap from './normalize-prop-map';

function findStoreWithValue (stores, key) {
	for (let store of stores) {
		const value = store.get(key);

		if (value !== undefined) {
			return  {
				store,
				value
			};
		}
	}

	return null;
}

export default function getPropsForMap (stores, propMap) {
	if (!Array.isArray(stores)) {
		stores = [stores];
	}

	const check = stores.reverse();
	const normalized = normalizePropmap(propMap);
	const keys = Object.keys(normalized);

	const props = {};

	for (let key of keys) {
		if (typeof propMap[key] === 'string') {
			const propKey = propMap[key];
			const {store, value} = findStoreWithValue(check, key);

			if (typeof value === 'function') {
				props[propKey] = getBoundFunction(value, store);
			} else {
				props[propKey] = value;
			}
		} else if (typeof key === 'string' && propMap[key] != null) {
			props[key] = propMap[key];
		}
	}

	return props;
}
