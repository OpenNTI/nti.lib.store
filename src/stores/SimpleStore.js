import EventEmitter from 'events';

import React from 'react';
import PropTypes from 'prop-types';
import {HOC} from '@nti/lib-commons';

import {Instance as InstanceConnector} from '../connectors';
import ContextWrapper from '../Context';

import {ChangeEvent, Load} from './Constants';

const Instances = Symbol('Instances');
const Singleton = Symbol('Singleton');
const StoreKey = Symbol('StoreKey');

const Data = Symbol('Data');
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
			this[Instances][key][StoreKey] = key;
		}

		return this[Instances][key];
	}


	static buildConnectorCmp (Component) {}

	static validateConnection (Component) {}

	static connect (propMap, storeProp = 'store') {
		return (Component) => {
			this.validateConnection(Component);

			const Wrapper = this.buildConnectorCmp(Component);
			const getStoreKey = props => Component.deriveStoreKeyFromProps ? Component.deriveStoreKeyFromProps(props) : null;
			const getStore = key => this.getStore(key);

			class StoreConnector extends React.Component {
				static propTypes = {
					forwardRef: PropTypes.func
				}

				state = {}

				constructor (props) {
					super(props);

					this.state = {
						store: getStore(getStoreKey(props))
					};
				}

				componentDidUpdate (props) {
					this.setupFor(props);
				}


				setupFor (props) {
					const {store} = this.state;

					if (!store || store[StoreKey] === Singleton) { return; }

					const key = getStoreKey(props);
					const keyChanged = (store[StoreKey] || key) ? store[StoreKey] !== key : false;

					if (keyChanged) {
						console.log('Setting STORE');//eslint-disable-line
						this.setState({
							store: getStore(key)
						});
					}
				}


				render () {
					const {forwardRef, ...otherProps} = this.props;
					const {store} = this.state;

					const child = React.createElement(
						InstanceConnector,
						{store: store, propMap},
						React.createElement(
							Component,
							{...otherProps, [storeProp]: store, ref: forwardRef}
						)
					);

					return React.createElement(
						ContextWrapper,
						{store},
						Wrapper ?
							React.createElement(Wrapper, {store}, child) :
							child
					);
				}
			}

			const name = Wrapper ? Wrapper.displayName || Wrapper.name : 'SimpleStoreConnector';
			const cmp = React.forwardRef((props, ref) => {
				return React.createElement(StoreConnector, {...props, forwardRef: ref});
			});

			HOC.hoistStatics(cmp, Component, name);

			return cmp;
		};
	}


	constructor () {
		super();

		this[Data] = {};

		if (this.initMixins) {
			this.initMixins();
		}
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
