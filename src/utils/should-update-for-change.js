import normalizePropMap from './normalize-prop-map';

export default function shouldUpdateForChange (change = {}, propMap) {
	const {type: changedTypes} = change;
	const normalized = propMap && normalizePropMap(propMap);

	if (!changedTypes) {
		return false;
	}

	if (!normalized) {
		return true;
	}

	const type = Array.isArray(changedTypes) ? changedTypes : [changedTypes];

	return type.some(prop => Object.prototype.hasOwnProperty.call(normalized, prop));
}
