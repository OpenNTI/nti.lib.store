import EventEmitter from 'events';

import React from 'react';
import PropTypes from 'prop-types';

import { HOC } from '@nti/lib-commons';

import { Instance as InstanceConnector } from '../connectors';
import ContextWrapper from '../Context';
import { useMonitor, useStoreValue } from '../hooks';

import { ChangeEvent, Load } from './Constants';

const Instances = Symbol('Instances');
const Singleton = Symbol('Singleton');
const StoreKey = Symbol('StoreKey');
const Set = Symbol('Set');

const Data = Symbol('Data');
const ChangedKeys = Symbol('ChangedKeys');

const LoadTimeout = Symbol('Load Timeout');

// turn (key, value) into {key: value}
const ensureObject = (key, value) =>
	typeof key === 'object' ? key : { [key]: value };

export default class SimpleStore extends EventEmitter {
	//set to true if you want any connected component to have the same store instance
	static Singleton = false;

	static getStore(key) {
		const Store = this;

		if (this.Singleton) {
			key = Singleton;
		}

		if (!key) {
			return new Store();
		}

		this[Instances] = this[Instances] || {};

		if (!this[Instances][key]) {
			this[Instances][key] = {
				count: 1,
				store: new Store(),
			};
			this[Instances][key].store[StoreKey] = key;
		} else {
			this[Instances][key].count++;
		}

		return this[Instances][key].store;
	}

	static freeStore(key) {
		if (
			this.Singleton ||
			!key ||
			!this[Instances] ||
			!this[Instances][key]
		) {
			return;
		}

		this[Instances][key].count--;

		setImmediate(() => {
			if (this[Instances][key].count <= 0) {
				delete this[Instances][key];
			}
		});
	}

	/**
	 * Create a component to render around the InstanceConnector
	 * it MUST render its children!
	 *
	 * @param  {Object} Component the class of the component that is being connected
	 * @returns {Object}           the wrapper component to render
	 */
	static buildConnectorCmp(Component) {}

	static validateConnection(Component) {}

	static useMonitor(propMap) {
		const instance = this;
		return useMonitor(propMap, s => s instanceof instance);
	}

	static useValue() {
		const StoreClass = this;
		const selector = React.useMemo(
			() => store => store instanceof StoreClass,
			[StoreClass]
		);
		return useStoreValue(selector);
	}

	static monitor(propMap = {}, storeProp = 'store') {
		const instance = this;
		const getClosestStore = stores => {
			for (let i = stores.length - 1; i >= 0; i--) {
				const store = stores[i];

				if (store instanceof instance) {
					return store;
				}
			}

			return null;
		};

		return Component => {
			const name = 'StoreMonitor';
			const MonitorWrapper = (props, ref) => {
				const { stores } = React.useContext(ContextWrapper.Context);
				const store = getClosestStore(stores);

				if (!store) {
					return React.createElement(Component, {
						...props,
						ref,
					});
				}

				return React.createElement(InstanceConnector, {
					store,
					propMap,
					component: Component,
					componentRef: ref,
					componentProps: { ...props, [storeProp]: store },
				});
			};
			const cmp = React.forwardRef(MonitorWrapper);

			HOC.hoistStatics(cmp, Component, name);

			return cmp;
		};
	}

	/** @deprecated */
	static WrapCmp = this.compose;

	static compose(Cmp, config = {}) {
		const { deriveStoreKeyFromProps } = config;

		this?.validateConfig?.(config);

		const getStoreKey = props => deriveStoreKeyFromProps?.(props) ?? null;
		const getStore = key => this.getStore(key);
		const freeStore = key => this.freeStore(key);

		const useWrapperEffects = (store, props) =>
			this?.useWrapperEffects?.(store, props, Cmp, config);

		function WrappedCmp(props, ref) {
			const key = getStoreKey(props);
			const initial = React.useRef(true);

			const [store, setStore] = React.useState(getStore(key));
			// TODO: check context for another instance and no-op if found & this.Singleton == true
			// const {stores} = React.useContext(ContextWrapper.Context);

			React.useEffect(() => {
				if (initial.current) {
					initial.current = false;
					return;
				}

				const newStore = getStore(key);

				if (store !== newStore) {
					setStore(newStore);
				}

				return () => (freeStore(key), store?.cleanup?.());
			}, [key]);

			useWrapperEffects(store, props);

			return React.createElement(
				ContextWrapper,
				{ store },
				React.createElement(Cmp, { ...props, ref })
			);
		}

		const forwarded = React.forwardRef(WrappedCmp);
		const name = `${this.name}(${Cmp.name || Cmp.displayName})`;

		HOC.hoistStatics(forwarded, Cmp, name);

		return forwarded;
	}

	static connect(propMap = {}, storeProp = 'store') {
		return Component => {
			this.validateConnection(Component);

			const Wrapper = this.buildConnectorCmp(Component);
			const getStoreKey = props =>
				Component.deriveStoreKeyFromProps
					? Component.deriveStoreKeyFromProps(props)
					: null;
			const getStore = key => this.getStore(key);
			const freeStore = key => this.freeStore(key);

			class StoreConnector extends React.Component {
				static propTypes = {
					forwardRef: PropTypes.func,
				};

				state = {};

				constructor(props) {
					super(props);

					this.state = {
						store: getStore(getStoreKey(props)),
					};
				}

				componentDidUpdate() {
					this.setupFor(this.props);
				}

				componentWillUnmount() {
					freeStore(getStoreKey(this.props));
				}

				setupFor(props) {
					const { store } = this.state;

					if (!store || store[StoreKey] === Singleton) {
						return;
					}

					const key = getStoreKey(props);
					const keyChanged =
						store[StoreKey] || key
							? store[StoreKey] !== key
							: false;

					if (keyChanged) {
						this.setState({
							store: getStore(key),
						});
					}
				}

				render() {
					const { forwardRef, ...componentProps } = this.props;
					const { store } = this.state;

					const child = React.createElement(InstanceConnector, {
						store,
						propMap,
						component: Component,
						componentRef: forwardRef,
						componentProps: {
							...componentProps,
							[storeProp]: store,
						},
					});

					return React.createElement(
						ContextWrapper,
						{ store },
						Wrapper
							? React.createElement(
									Wrapper,
									{ ...componentProps, store },
									child
							  )
							: child
					);
				}
			}

			const name = Wrapper
				? Wrapper.displayName || Wrapper.name
				: 'SimpleStoreConnector';
			const ConnectorWrapper = (props, ref) => {
				return React.createElement(StoreConnector, {
					...props,
					forwardRef: ref,
				});
			};
			const cmp = React.forwardRef(ConnectorWrapper);

			HOC.hoistStatics(cmp, Component, name);

			return cmp;
		};
	}

	constructor() {
		super();

		this.setMaxListeners(100);
		this[Data] = {};

		if (this.initInterfaces) {
			this.initInterfaces();
		}

		if (this.initMixins) {
			this.initMixins();
		}
	}

	get storeKey() {
		return this[StoreKey];
	}

	clear(immediate) {
		const { length } = (this[ChangedKeys] = Object.keys(this[Data]));

		if (length) {
			this[Data] = {};
			immediate ? this.emitChange() : this.scheduleEmit();
		}
	}

	get(key) {
		const data = this[Data][key];

		return data !== undefined ? data : this[key];
	}

	[Set](props, immediate) {
		this[ChangedKeys] = this[ChangedKeys] || [];
		this[Data] = { ...this[Data], ...props };
		this[ChangedKeys] = [...this[ChangedKeys], ...Object.keys(props)];

		immediate ? this.emitChange() : this.scheduleEmit();
	}

	/**
	 * Set store value(s) and emit change events immediately.
	 * @param {string | Object} key - String to store value under, or a mapping of properties to be stored
	 * @param {*} value - The value to be stored if key is a string, otherwise ignored.
	 * @returns {void}
	 */
	setImmediate(key, value) {
		return this[Set](ensureObject(key, value), true);
	}

	/**
	 * Set store value(s). Change events may be deferred to allow multiple calls without triggering excessive updates.
	 * @param {string | Object} key - A string under which to store value; or a mapping of properties to be stored
	 * @param {*} value - The value to be stored if key is a string, otherwise ignored.
	 * @returns {void}
	 */
	set(key, value) {
		return this[Set](ensureObject(key, value));
	}

	scheduleEmit(...args) {
		if (this.emitChangeTimeout) {
			return;
		}

		this.emitChangeTimeout = setImmediate(() => {
			this.emitChange(...args);
		});
	}

	emitChange(changedType) {
		clearImmediate(this.emitChangeTimeout);
		delete this.emitChangeTimeout;

		if (!changedType) {
			changedType = [];
		} else if (!Array.isArray(changedType)) {
			changedType = [changedType];
		}

		const type = this[ChangedKeys]
			? [...changedType, ...this[ChangedKeys]]
			: changedType;

		this.emit(ChangeEvent, {
			type: type.length > 1 ? type : type[0],
		});

		this[ChangedKeys] = null;
	}

	addChangeListener(fn) {
		this.removeChangeListener(fn);
		this.addListener(ChangeEvent, fn);
	}

	removeChangeListener(fn) {
		this.removeListener(ChangeEvent, fn);
	}

	[Load]() {
		if (!this.load) {
			return;
		}

		if (!this[LoadTimeout]) {
			this[LoadTimeout] = setImmediate(() => {
				// window.setImmediate, not this.setImmediate
				this.load();
				delete this[LoadTimeout];
			});
		}
	}
}
