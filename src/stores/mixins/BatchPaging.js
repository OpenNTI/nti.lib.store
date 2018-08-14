const Batch = Symbol('batch');

export default {
	setBatch (batch) {
		this[Batch] = batch;

		if (this.applyBatch) {
			this.applyBatch(batch);
		} else {
			this.set('items', this.getItemsFromBatch(batch));
			this.set('total', this.getTotalFromBatch(batch));
			this.set('currentPage', this.getCurrentPageFromBatch(batch));
			this.set('hasNextPage', this.getHasNextPageFromBatch(batch));
			this.set('getHasPrevPageFromBatch', this.getHasPrevPageFromBatch(batch));
		}
	},

	getItemsFromBatch (batch) {
		if (!batch) { return null; }

		return batch.Items;
	},

	getTotalFromBatch (batch) {
		if (!batch) { return null; }

		return batch.FilteredTotalItemCount != null ? batch.FilteredTotalItemCount : batch.TotalCount;
	},

	getCurrentPageFromBatch (batch) {
		if (!batch) { return null; }

		return batch.BatchPage;
	},

	getHasNextPageFromBatch (batch) {
		if (!batch) { return null; }

		return batch.hasLink('batch-next');
	},

	getHasPrevPageFromBatch (batch) {
		if (!batch) { return null; }

		return batch.hasLink('batch-prev');
	},

	/**
	 * Load the next page.
	 *
	 * @return {void}
	 */
	loadNextPage () {
		this.loadPage(this.get('currentPage') + 1);
	},

	/**
	 * Load the prev page.
	 *
	 * @return {void}
	 */
	loadPrevPage () {
		this.loadPage(this.get('currentPage') - 1);
	},

	/**
	 * Load  page at a given index
	 *
	 * @abstract
	 * @param  {Number} index the page to load
	 * @return {void}
	 */
	loadPage (index) {}
};
