const Batch = Symbol('batch');

export default {
	setBatch (batch) {
		this[Batch] = batch;

		this.applyBatch(batch);
	},




	/**
	 * Give the subclasses a place to update state for a batch
	 *
	 * @param  {[type]} batch [description]
	 * @return {[type]}       [description]
	 */
	applyBatch (batch) {}
};
