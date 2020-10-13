export const ForwardIterator = x => x[Symbol.iterator](); // allows us to blow up early for non-iterables
export const ReverseIterator = x => {
	//Consume given iterable: (will blow up if not an iterable)
	const buffer = [...x];
	let index = buffer.length;
	return {
		[Symbol.iterator]: function () { return this; },
		next () {
			index--;
			return {
				done: index < 0,
				value: buffer[index]
			};
		}
	};
};

export default function findStoreWithValue (stores, key, inOrder = ReverseIterator) {
	for (let store of inOrder(stores)) {
		const value = store.get(key);

		if (value !== undefined) {
			return  {
				store,
				value
			};
		}
	}

	return {};
}
