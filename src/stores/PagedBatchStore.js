import SimpleStore from './SimpleStore';

const Load = Symbol('load');

export default class PagedBatchStore extends SimpleStore {
	constructor () {
		super();

		this.set('batch', null);
		this.set('options', {});
		this.set('href', null);

		this.set('loading', false);
		this.set('error', null);
	}


	get batchSize () {
		const options = this.get('options');

		return options.batchSize;
	}


	get hasNextPage () {
		const {batchSize, items} = this;

		//If we have items, check that there are as many items as we requested
		return (items && items.length >= batchSize) && !!getNextLink(this.get('batch'));
	}


	get hasPrevPage () {
		return !!getPrevLink(this.get('batch'));
	}


	get items () {
		const batch = this.get('batch');

		return batch ? batch.Items : null;
	}


	setHref (href) {
		this.set('href', href);

		//If we already have a batch re-load
		if (this.get('batch')) {
			this.load();
		}
	}


	addOptions (newOptions) {
		const options = this.get('options');

		this.set('options', {...options, ...newOptions});

		//If we already have a batch re-load
		if (this.get('batch')) {
			this.load();
		}
	}


	removeOption (option) {
		const options = this.get('options');

		delete options[option];

		//If we already have a batch re-load
		if (this.get('batch')) {
			this.load();
		}
	}


	async [Load] (href, options = {}) {
		this.set('loading', true);
		this.emitChange('loading');

		try {
			const batch = await this.loadBatch(href, options);

			this.set('batch', batch);
			this.emitChange('items', 'hasNextPage', 'hasPrevPage');
		} catch (e) {
			this.set('error', e);
			this.emitChange('error');
		} finally {
			this.set('loading', false);
			this.emitChange('loading');
		}
	}


	load () {
		this[Load](this.get('href'), this.get('options'));
	}


	loadNextPage () {
		if (!this.hasNextPage) { return; }

		this[Load](getNextLink(this.get('batch')));
	}


	loadPrevPage () {
		if (!this.hasPrevPage) { return; }

		this[Load](getPrevLink(this.get('batch')));
	}


	/**
	 * Provide a method to load a batch given a href and options
	 *
	 * @override
	 * @param  {String} href    the href of the batch to load
	 * @param  {Object} options the options to load the batch with
	 * @return {Promise}       	fulfills with a batch model
	 */
	loadBatch (href, options) {}
}


function getNextLink (batch) {
	return batch && batch.getLink('batch-next');
}


function getPrevLink (batch) {
	return batch && batch.getLink('batch-prev');
}
