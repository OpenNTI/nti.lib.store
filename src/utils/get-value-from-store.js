import findStoreWithValue, { ForwardIterator, ReverseIterator } from './find-store-with-value';
import getBoundFunction from './get-bound-function';

export {
	ForwardIterator,
	ReverseIterator
};

export function getValue (store, value) {
	if (typeof value === 'function') {
		return getBoundFunction(value, store);
	}

	return value;
}

export default function getValueFromStore (stores, key, inOrder = ReverseIterator) {
	const {store, value} = findStoreWithValue(stores, key, inOrder);
	return getValue(store, value);
}
