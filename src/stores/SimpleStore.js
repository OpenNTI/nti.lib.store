import React from 'react';
import Connector from '@nti/lib-store-connector';
import {HOC} from '@nti/lib-commons';

const Instances = Symbol('Instances');
const Singleton = Symbol('Singleton');

const Data = Symbol('Data');
const ChangeListeners = Symbol('ChangeListeners');
const ChangedKeys = Symbol('ChangedKeys');

function callListener (listener, ...args) {
	try {
		listener(...args);
	} catch (e) {
		console.error('Error in Store onChangeListener: ', e.stack || e.message || e);//eslint-disable-line
	}
}

export default class SimpleStore {
	//set to true if you want any connected component to have the same store instance
	static Singleton = false

	static getStore (key) {
		const Store = this;

		if (this.Singleton) {
			key = Singleton;
		}

		if (!key) {
			return new Store();
		}

		this[Instances] = this[Instances] || {};

		if (!this[Instances][key]) {
			this[Instances][key] = new Store();
		}

		return this[Instances][key];
	}


	static buildConnectorCmp (Component) {}


	static connect (propMap, storeProp = 'store') {
		return function decorator (Component) {
			const Wrapper = this.buildConnectorCmp(Component);

			const cmp = React.forwardRef((props, ref) => {
				const store = this.getStore(Component.deriveStoreKeyFromProps && Component.deriveStoreKeyFromProps(props));
				const extraProps = {[storeProp]: store};
				const child = (<Component {...extraProps} ref={ref} />);


				return (
					<Connector _store={store} _propMap={propMap}>
						{Wrapper ?
							<Wrapper store={store}>{child}</Wrapper> :
							{child}
						}
					</Connector>
				);
			});

			const name = Wrapper ? Wrapper.displayName || Wrapper.name : 'SimpleStoreConnector';

			HOC.hoistStatics(cmp, Component, name);

			return cmp;
		};
	}

	constructor () {
		this[ChangeListeners] = new Set([]);
		this[Data] = {};
	}


	get (key) {
		const data = this[Data][key];

		return data !== undefined ? data : this[key];
	}


	set (key, value) {
		this[Data][key] = value;

		this[ChangedKeys] = this[ChangedKeys] || [];

		if (this.emitChangeTimeout) { return; }

		this.emitChangeTimeout = setTimeout(() => {
			this.emitChange(...this[ChangedKeys]);
			this[ChangedKeys] = null;
		}, 100);
	}


	emitChange (...args) {
		clearTimeout(this.emitChangeTimeout);

		for (let listener of this[ChangeListeners]) {
			callListener(listener, ...args);
		}
	}


	addChangeListener (fn) {
		this[ChangeListeners].add(fn);
	}


	removeChangeListener (fn) {
		this[ChangeListeners].delete(fn);
	}
}
