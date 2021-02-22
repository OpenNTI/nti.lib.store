import { Load } from '../stores/Constants';

export default {
	defaultFilter: null,

	initMixin() {
		this.set('filter', this.defaultFilter);

		if (this.addPropsChangeListener) {
			this.addPropsChangeListener((props, Component) => {
				if (props.filter !== this.filter) {
					if (Component.deriveFilterFromProps) {
						const newFilter = Component.deriveFilterFromProps(
							props
						);

						if (newFilter !== this.filter) {
							this.updateFilter(
								Component.deriveFilterFromProps(props)
							);
						}
					} else if (props.filter !== this.filter) {
						this.updateFilter(props.filter);
					}
				}
			});
		}
	},

	setFilter(term) {
		this.set('filter', term);

		if (this.applyFilter) {
			this.applyFilter(term);
		} else {
			this.emitChange('filter');
		}
	},

	get filter() {
		return this.get('filter') || this.defaultFilter;
	},

	updateFilter(term) {
		this.setFilter(term);

		this[Load]();
	},
};
