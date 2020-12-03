import {Load} from '../stores/Constants';

const SearchTimeout = Symbol('SearchTimeout');
const SearchBuffering = Symbol('SearchBuffering');

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

	get isBufferingSearch () {
		return this[SearchBuffering];
	},


	updateSearchTerm (term) {
		this.setSearchTerm(term);

		this[SearchBuffering] = true;
		clearTimeout(this[SearchTimeout]);

		if (!term) {
			this[SearchBuffering] = false;
			this[Load]();
		} else {
			this[SearchTimeout] = setTimeout(() => {
				this[SearchBuffering] = false;
				this[Load]();
			}, this.SEARCH_BUFFER);
		}
	}
};
