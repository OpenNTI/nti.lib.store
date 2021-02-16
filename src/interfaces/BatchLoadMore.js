import createInterface from './create-interface';
import LoadTracker from './common/LoadTracker';

const PrevBinding = Symbol('Previous Binding');
const BatchPointer = Symbol('Batch Pointer');
const InitialLoad = Symbol('Initial Load');

export default createInterface({
	[createInterface.ID]: 'BatchLoadMore',

	/**
	 * Controls when the initial batch needs to be reloaded
	 *
	 * @param {string} prevBinding the binding load was previously called with
	 * @returns {boolean} if the initial batch needs to be reloaded
	 */
	needsReload(prevBinding) {
		if (this.isSearchable && this.lastSearchTerm !== undefined) {
			return this.searchTerm !== this.lastSearchTerm;
		}

		return false;
	},

	async load() {
		if (this[InitialLoad] && !this.needsReload(this[PrevBinding])) {
			return;
		}

		this[PrevBinding] = this.binding;
		this[InitialLoad] = true;

		if (this.isSearchable) {
			this.lastSearchTerm = this.searchTerm;
		}

		const tracker = LoadTracker.for(this).startTracker();

		this.setImmediate({
			loading: true,
			items: null,
			error: null,
			hasMore: null,
		});

		try {
			const batch = await this.loadInitialBatch();

			if (!tracker.isCurrent()) {
				return;
			}

			this[BatchPointer] = batch;

			const items = this.getItemsFromBatch(batch);
			const hasMore = this.getHasMoreFromBatch(batch);

			this.set({
				loading: false,
				items: [...items],
				hasMore,
			});
		} catch (e) {
			if (!tracker.isCurrent()) {
				return;
			}

			this.set({
				loading: false,
				error: e,
				hasMore: false,
			});
		}
	},

	async loadMore() {
		const batch = this[BatchPointer];

		const tracker = LoadTracker.for(this).startTracker();

		this.set({
			loading: true,
		});

		try {
			const next = await this.loadNextBatch(batch);

			if (!tracker.isCurrent()) {
				return;
			}

			this[BatchPointer] = next;

			const existingItems = this.get('items');
			const newItems = this.getItemsFromBatch(next);
			const hasMore = this.getHasMoreFromBatch(next);

			this.set({
				loading: true,
				items: [...existingItems, ...newItems],
				hasMore,
			});
		} catch (e) {
			if (!tracker.isCurrent()) {
				return;
			}

			this.set({
				loading: false,
				error: e,
			});
		}
	},

	loadInitialBatch() {},
	loadNextBatch() {},

	getItemsFromBatch(batch) {
		return batch?.Items;
	},
	getHasMoreFromBatch(batch) {
		return batch?.hasLink('batch-next');
	},
});
