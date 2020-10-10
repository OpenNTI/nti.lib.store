
import getValueFromStore from './get-value-from-store';
import normalizePropMap from './normalize-prop-map';

export default function getPropsForMap (stores, propMap) {
	if (!Array.isArray(stores)) {
		stores = [stores];
	}

	const normalized = normalizePropMap(propMap);
	const keys = Object.keys(normalized);

	const props = {};

	for (let key of keys) {
		if (typeof normalized[key] === 'string') {
			const propKey = normalized[key];
			props[propKey] = getValueFromStore(stores, key);
		} else if (typeof key === 'string' && normalized[key] != null) {
			props[key] = normalized[key];
		}
	}

	return props;
}
