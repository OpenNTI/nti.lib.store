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
const Set = Symbol('Set');

const Data = Symbol('Data');
const ChangedKeys = Symbol('ChangedKeys');

const LoadTimeout = Symbol('Load Timeout');

// turn (key, value) into {key: value}
const ensureObject = (key, value) => typeof key === 'object' ? key : {[key]: value};

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


	/**
	 * Create a component to render around the InstanceConnector
	 * it MUST render its children!
	 *
	 * @param  {Object} Component the class of the component that is being connected
	 * @return {Object}           the wrapper component to render
	 */
	static buildConnectorCmp (Component) {}

	static validateConnection (Component) {}

	static connect (propMap = {}, storeProp = 'store') {
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

				componentDidUpdate () {
					this.setupFor(this.props);
				}


				setupFor (props) {
					const {store} = this.state;

					if (!store || store[StoreKey] === Singleton) { return; }

					const key = getStoreKey(props);
					const keyChanged = (store[StoreKey] || key) ? store[StoreKey] !== key : false;

					if (keyChanged) {
						this.setState({
							store: getStore(key)
						});
					}
				}


				render () {
					const {forwardRef, ...componentProps} = this.props;
					const {store} = this.state;

					const child = React.createElement(
						InstanceConnector,
						{
							store,
							propMap,
							component: Component,
							componentRef: forwardRef,
							componentProps,
							[storeProp]: store
						},
					);

					return React.createElement(
						ContextWrapper,
						{store},
						Wrapper ?
							React.createElement(Wrapper, {store, ...componentProps}, child) :
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

	get storeKey () {
		return this[StoreKey];
	}

	clear (immediate) {
		const {length} = this[ChangedKeys] = Object.keys(this[Data]);

		if (length) {
			this[Data] = {};
			immediate ? this.emitChange() : this.scheduleEmit();
		}
	}

	get (key) {
		const data = this[Data][key];

		return data !== undefined ? data : this[key];
	}

	[Set] (props, immediate) {
		this[ChangedKeys] = this[ChangedKeys] || [];
		this[Data] = {...this[Data], ...props};
		this[ChangedKeys] = [...this[ChangedKeys], ...Object.keys(props)];

		immediate ? this.emitChange() : this.scheduleEmit();
	}

	/**
	 * Set store value(s) and emit change events immediately.
	 * @param {string | Object} key - String to store value under, or a mapping of properties to be stored
	 * @param {*} value - The value to be stored if key is a string, otherwise ignored.
	 * @return {void}
	 */
	setImmediate (key, value) {
		return this[Set](ensureObject(key, value), true);
	}

	/**
	 * Set store value(s). Change events may be deferred to allow multiple calls without triggering excessive updates.
	 * @param {string | Object} key - A string under which to store value; or a mapping of properties to be stored
	 * @param {*} value - The value to be stored if key is a string, otherwise ignored.
	 * @return {void}
	 */
	set (key, value) {
		return this[Set](ensureObject(key, value));
	}

	scheduleEmit (...args) {
		if (this.emitChangeTimeout) { return; }

		this.emitChangeTimeout = setTimeout(() => {
			this.emitChange(...args);
		}, 100);
	}


	emitChange (changedType) {
		clearTimeout(this.emitChangeTimeout);
		delete this.emitChangeTimeout;

		if (!changedType) {
			changedType = [];
		} else if (!Array.isArray(changedType)) {
			changedType = [changedType];
		}

		const type = this[ChangedKeys] ? [...changedType, ...this[ChangedKeys]] : changedType;

		this.emit(ChangeEvent, {
			type: type.length > 1 ? type : type[0]
		});

		this[ChangedKeys] = null;
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
