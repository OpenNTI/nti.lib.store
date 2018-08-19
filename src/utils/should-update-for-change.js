import normalizePropMap from './normalize-prop-map';

export default function shouldUpdateForChange (change = {}, propMap) {
	const {type: changedTypes} = change;
	const normalized = propMap && normalizePropMap(propMap);

	if (!changedTypes && propMap) {
		throw new Error('No type on change');
	}

	if (!changedTypes) {
		return false;
	}

	const type = Array.isArray(changedTypes) ? changedTypes : [changedTypes];

	return !normalized || type.some(prop => normalized.hasOwnProperty(prop));
}
