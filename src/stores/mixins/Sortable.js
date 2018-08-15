import {Load} from '../Constants';

const SortProperty = Symbol('Sort Property');
const SortDirection = Symbol('Sort Direction');

export default {
	defaultSortProperty: null,
	defaultSortDirection: null,

	setSort (property, direction) {
		this[SortProperty] = property;
		this[SortDirection] = direction;

		if (this.applySort) {
			this.applySort(property, direction);
		} else {
			this.emitChange('sortProperty', 'sortDirection');
		}

		this[Load]();
	},


	setSortProperty (property) {
		this[SortProperty] = property;

		if (this.applySort) {
			this.applySort(property, this.sortDirection);
		} else {
			this.emitChange('sortProperty');
		}

		this[Load]();
	},


	setSortDirection (direction) {
		this[SortDirection] = direction;

		if (this.applySort) {
			this.applySort(this.sortProperty, direction);
		} else {
			this.emitChange('sortDirection');
		}

		this[Load]();
	},


	get sortProperty () {
		return this[SortProperty] || this.defaultSortProperty;
	},


	get sortDirection () {
		return this[SortDirection] || this.defaultSortDirection;
	}
};
