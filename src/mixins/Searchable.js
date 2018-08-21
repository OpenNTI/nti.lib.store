import {Load} from '../stores/Constants';

const SearchTerm = Symbol('SearchTerm');
const SearchTimeout = Symbol('SearchTimeout');

export default {
	initMixin () {
		if (this.addPropsChangeListener) {
			this.addPropsChangeListener((props) => {
				if (props.searchTerm !== this.searchTerm) {
					this.updateSearchTerm(props.searchTerm);
				}
			});
		}
	},

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
