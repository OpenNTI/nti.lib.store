import {Load} from '../stores/Constants';

export default {
	defaultSortProperty: null,
	defaultSortDirection: null,

	initMixin () {
		this.set('sortProperty', this.defaultSortProperty);
		this.set('sortDirection', this.defaultSortDirection);
	},

	setSort (property, direction) {
		this.set('sortProperty', property);
		this.set('sortDirection', direction);

		if (this.applySort) {
			this.applySort(property, direction);
		} else {
			this.emitChange('sortProperty', 'sortDirection');
		}

		this[Load]();
	},


	setSortProperty (property) {
		this.set('sortProperty', property);

		if (this.applySort) {
			this.applySort(property, this.sortDirection);
		} else {
			this.emitChange('sortProperty');
		}

		this[Load]();
	},


	setSortDirection (direction) {
		this.set('sortDirection', direction);

		if (this.applySort) {
			this.applySort(this.sortProperty, direction);
		} else {
			this.emitChange('sortDirection');
		}

		this[Load]();
	},


	get sortProperty () {
		return this.get('sortProperty') || this.defaultSortProperty;
	},


	get sortDirection () {
		return this.get('sortDirection') || this.defaultSortDirection;
	}
};
