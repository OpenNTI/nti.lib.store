import {Load} from '../Constants';

const SearchTerm = Symbol('SearchTerm');
const SearchTimeout = Symbol('SearchTimeout');

export default {
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
			this[Load]();
		} else {
			this[SearchTimeout] = setTimeout(() => {
				this[Load]();
			}, this.SEARCH_BUFFER);
		}
	}
};
