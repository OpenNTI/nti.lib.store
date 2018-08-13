const SortProperty = Symbol('Sort Property');
const SortDirection = Symbol('Sort Direction');

export default {
	ConnectorMethods = ['setStort', 'setSortProperty', 'setSortDiection'],

	setSort (property, direction) {
		this[SortProperty] = property;
		this[SortDirection] = direction;

		if (this.applySort) {
			this.applySort(property, direction);
		} else {
			this.emitChange('sortProperty', 'sortDirection');
		}

		this.load();
	},


	setSortProperty (property) {
		this[SortProperty] = property;

		if (this.applySort) {
			this.applySort(property, this.sortDirection);
		} else {
			this.emitChange('sortProperty');
		}

		this.load();
	},


	setSortDirection (direction) {
		this[SortDirection] = direction;

		if (this.applySort) {
			this.applySort(this.sortProperty, direction);
		} else {
			this.emitChange('sortDirection');
		}

		this.load();
	},


	get sortProperty () {
		return this[SortProperty];
	},


	get sortDirection () {
		return this[SortDirection];
	},

	/**
	 * Gets called whenever the sort is set
	 *
	 * @override
	 * @return {void}
	 */
	load () {}
};
