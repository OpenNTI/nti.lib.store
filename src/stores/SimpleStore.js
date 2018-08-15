import EventEmitter from 'events';

import React from 'react';
import Connector from '@nti/lib-store-connector';
import {HOC} from '@nti/lib-commons';

import {ChangeEvent, Load} from './Constants';
import ContextWrapper from './Context';

const Instances = Symbol('Instances');
const Singleton = Symbol('Singleton');

const Data = Symbol('Data');
const ChangeListeners = Symbol('ChangeListeners');
const ChangedKeys = Symbol('ChangedKeys');

const LoadTimeout = Symbol('Load Timeout');


export default class SimpleStore extends EventEmitter {
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

	static validateConnection (Component) {}


	static connect (propMap, storeProp = 'store') {
		return (Component) => {
			this.validateConnect(Component);

			const Wrapper = this.buildConnectorCmp(Component);

			const cmp = React.forwardRef((props, ref) => {
				const store = this.getStore(Component.deriveStoreKeyFromProps && Component.deriveStoreKeyFromProps(props));
				const extraProps = {[storeProp]: store};
				const child = React.createElement(
					ContextWrapper,
					{store},
					React.createElement(Component, {...extraProps, ref})
				);

				return React.createElement(
					Connector,
					{_store: store, _propMap: propMap},
					Wrapper ?
						React.createElement(Wrapper, {store}, child) :
						child
				);
			});

			const name = Wrapper ? Wrapper.displayName || Wrapper.name : 'SimpleStoreConnector';

			HOC.hoistStatics(cmp, Component, name);

			return cmp;
		};
	}

	constructor () {
		super();

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

		this.emit(ChangeEvent, {type: args});
	}


	addChangeListener (fn) {
		this.removeChangeListener(fn);
		this.addListener(ChangeEvent, fn);
	}


	removeChangeListener (fn) {
		this.removeListener(ChangeEvent, fn);
	}


	[Load] () {
		if (!this.load) { return; }

		if (!this[LoadTimeout]) {
			this[LoadTimeout] = setTimeout(() => {
				this.load();
				delete this[LoadTimeout];
			}, 100);
		}
	}
}
