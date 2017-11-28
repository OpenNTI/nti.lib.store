import SimpleStore from './SimpleStore';

export default class SearchablePagedStore extends SimpleStore {
	constructor () {
		super();

		this.set('searchTerm', null);

		this.set('items', null);
		this.set('loading', false);
		this.set('error', null);

		this.set('loadingNextPage', false);
		this.set('loadNextPage', null);
	}

	get hasNextPage () {
		return !!this.get('loadNextPage');
	}


	async load () {
		this.set('loading', true);
		this.emitChange('loading');

		this.set('items', []);
		this.set('loadNextPage', null);

		try {
			const {items, loadNext} = await (this.get('searchTerm') ? this.loadSearchTerm(this.get('searchTerm')) : this.loadInitial());

			this.set('items', items);
			this.set('loadNextPage', loadNext);
			this.emitChange('items', 'hasNextPage');
		} catch (e) {
			this.set('error', e);
			this.emitChange('error');
		} finally {
			this.set('loading', false);
			this.emitChange('loading');
		}
	}


	async loadNextPage () {
		const loadNextPage = this.get('loadNextPage');

		if (!loadNextPage) { return; }

		this.set('loadingNextPage', true);
		this.set('loadNextPage', null);
		this.emitChange('loadingNextPage', 'hasNextPage');

		try {
			const {items, loadNext} = await loadNextPage();

			//append the items to the current set
			this.set('items', [...this.get('items'), ...items]);
			this.set('loadNextPage', loadNext);
			this.emitChange('items', 'hasNextPage');
		} catch (e) {
			this.set('error', e);
			this.emitChange('error');
		} finally {
			this.set('loadingNextPage', false);
			this.emitChange('loadingNextPage');
		}
	}


	updateSearchTerm (term) {
		this.set('loading', true);
		this.set('searchTerm', term);
		this.emitChange('loading', 'searchTerm');

		clearTimeout(this.doSearchTimeout);

		if (!term) {
			this.load();
		} else {
			this.doSearchTimeout = setTimeout(() => {
				this.load();
			}, 300);
		}
	}

	/**
	 * Return the items and loadNext function for a given search term
	 * @override
	 * @param  {String} term term to search on
	 * @return {Object}      with the items and loadNext function if there is a next page
	 */
	loadSearchTerm (term) {}

	/**
	 * Return the items and loadNext function for a given search term
	 * @override
	 * @return {Object}      with the items and loadNext function if there is a next page
	 */
	loadInitial () {}
}
