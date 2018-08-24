import {Load} from '../stores/Constants';

const SearchTimeout = Symbol('SearchTimeout');

export default {
	defaultSearchTerm: null,

	initMixin () {
		this.set('searchTerm', this.defaultSearchTerm);

		if (this.addPropsChangeListener) {
			this.addPropsChangeListener((props) => {
				if (props.searchTerm !== this.searchTerm) {
					this.updateSearchTerm(props.searchTerm || this.defaultSearchTerm);
				}
			});
		}
	},

	SEARCH_BUFFER: 300,

	setSearchTerm (term) {
		this.set('searchTerm', term);

		if (this.applySearchTerm) {
			this.applySearchTerm(term);
		} else {
			this.emitChange('searchTerm');
		}
	},


	get searchTerm () {
		return this.get('searchTerm') || this.defaultSearchTerm;
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
