const SearchTerm = Symbol('SearchTerm');
const SearchTimeout = Symbol('SearchTimeout');

export default {
	ConnectorMethods: ['updateSearchTerm'],

	SEARCH_BUFFER: 300,

	setSearchTerm (term) {
		this[SearchTerm] = term;

		if (this.applySearchTerm) {
			this.applySearchTerm(term);
		} else {
			this.emitChange('searchTerm');
		}
	},


	get searchTerm () {
		return this[SearchTerm];
	},


	updateSearchTerm (term) {
		this.setSearchTerm(term);

		clearTimeout(this[SearchTimeout]);

		if (!term) {
			this.load();
		} else {
			this[SearchTimeout] = setTimeout(() => {
				this.load();
			}, this.SEARCH_BUFFER);
		}
	},


	/**
	 * Gets called whenever the buffer on searching finishes
	 * @override
	 * @return {void}
	 */
	load() {}
};
