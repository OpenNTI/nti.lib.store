export default class LoadTracker {
	static Key = Symbol('Load Tracker Key');

	static for(target) {
		if (!target[LoadTracker.Key]) {
			target[LoadTracker.Key] = new LoadTracker();
		}

		return target[LoadTracker.Key];
	}

	#current = null;
	#count = 0;

	getId() {
		this.#count += 1;

		return this.#count;
	}

	startTracker() {
		const id = this.getId();
		this.#current = id;

		return {
			isCurrent: () => this.#current === id,
		};
	}
}
