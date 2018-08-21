const BOUND_MAP = new WeakMap();

export default function getBoundFunction (fn, scope) {
	if (!BOUND_MAP.has(scope)) {
		BOUND_MAP.set(scope, new WeakMap());
	}

	const cache = BOUND_MAP.get(scope);

	if (!cache.has(fn)) {
		cache.set(fn, fn.bind(scope));
	}

	return cache.get(fn);
}
