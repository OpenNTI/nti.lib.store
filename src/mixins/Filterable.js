import {Load} from '../stores/Constants';

const Filter = Symbol('Filter');

export default {
	initMixin () {
		if (this.addPropsChangeListener) {
			this.addPropsChangeListener((props) => {
				if (props.filter !== this.filter) {
					this.updateFilter(props.filter);
				}
			});
		}
	},

	setFilter (term) {
		this[Filter] = term;

		if (this.applyFilter) {
			this.applyFilter(term);
		} else {
			this.emitChange('filter');
		}
	},


	get filter () {
		return this[Filter];
	},


	updateFilter (term) {
		this.setFilter(term);

		this[Load]();
	}
};
