import React from 'react';
import Connector from '@nti/lib-store-connector';
import {HOC} from '@nti/lib-commons';

const Instance = Symbol('Instance');
const Data = Symbol('Data');
const Listeners = Symbol('Listeners');

export default class SimpleStore {
	static getInstance () {
		const Store = this;

		this[Instance] = this[Instance] || new Store();

		return this[Instance];
	}

	static connect (propMap, storeProp = 'store') {
		const store = this.getInstance();
		const extraProps = {
			[storeProp]: store
		};

		return function (component) {
			class StoreConnector extends React.Component {
				render () {
					return React.createElement(component, {...extraProps, ...this.props});
				}
			}

			HOC.hoistStatics(StoreConnector, component, 'SimpleStoreConnector');

			return Connector.connect(
				store,
				StoreConnector,
				propMap
			);
		};
	}


	constructor () {
		this[Listeners] = [];
		this[Data] = {};
	}


	get (key) {
		const data = this[Data][key];

		return data !== undefined ? data : this[key];
	}


	set (key, value) {
		this[Data][key] = value;
	}


	emitChange (type) {
		for (let listener of this[Listeners]) {
			listener({type});
		}
	}


	addChangeListener (fn) {
		if (!hasListener(fn, this[Listeners])) {
			this[Listeners].push(fn);
		}
	}


	removeChangeListener (fn) {
		this[Listeners] = this[Listeners].filter(listener => listener !== fn);
	}
}


function hasListener (fn, listeners) {
	for (let listener of listeners) {
		if (listener === fn) {
			return true;
		}
	}

	return false;
}
