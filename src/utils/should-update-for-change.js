import normalizePropMap from './normalize-prop-map';

export default function shouldUpdateForChange (change = {}, propMap) {
	const {type: changedTypes} = change;
	const normalized = propMap && normalizePropMap(propMap);

	if (!changedTypes) {
		throw new Error('No type on change');
	}

	if (!normalized) {
		return true;
	}

	const type = Array.isArray(changedTypes) ? changedTypes : [changedTypes];

	return type.some(prop => normalized.hasOwnProperty(prop));
}
