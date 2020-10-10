function convertArray (props) {
	return props.reduce((acc, prop) => {
		acc[prop] = prop;

		return acc;
	}, {});
}

export default function normalizePropMap (propMap) {
	if (propMap instanceof Set) {
		return convertArray([...propMap]);
	}
	if (Array.isArray(propMap)) {
		return convertArray(propMap);
	}

	return propMap;
}
