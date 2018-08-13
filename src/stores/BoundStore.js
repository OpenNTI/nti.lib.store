import React from 'react';
import PropTypes from 'prop-types';

import SimpleStore from './SimpleStore';

const PropsChangeListeners = Symbol('Prop Change Listeners');

const SetBinding = Symbol('Set Binding');
const Binding = Symbol('Binding');

function callListener (listener, ...args) {
	try {
		listener(...args);
	} catch (e) {
		console.error('Error in BoundStore onPropsChangeListener: ', e.stack || e.message || e);//eslint-disable-line
	}
}

export default class BoundStore extends SimpleStore {
	static buildConnectorCmp (Component) {
		const deriveBinding = (props) => Component.deriveBindingFromProps ? Component.deriveBindingFromProps(props) : null;

		class BoundStoreWrapper extends React.Component {
			static propTypes = {
				store: PropTypes.shape({
					onPropsChange: PropTypes.func.isRequired
				}).isRequired
			}

			componentDidMount () {
				this.setupFor(this.props);
			}

			componentDidUpdate () {
				this.setupFor(this.props);
			}

			setupFor (props) {
				const {store} = props;
				const binding = deriveBinding(props);

				store[SetBinding](binding);
				store.onPropsChange(props);
			}

			render () {
				return (
					<Component {...this.props} />
				);
			}
		}

		return BoundStoreWrapper;
	}


	constructor () {
		super();

		this[PropsChangeListeners] = new Set([]);
	}


	[SetBinding] (binding) {
		const changed = this[Binding] !== binding;

		this[Binding] = binding;

		if (changed) {
			this.load();
		}
	}


	get binding () {
		return this[Binding];
	}


	load () {
		throw new Error('Load MUST be overridden by subclasses of BoundStore check: ', this.constructor.name);
	}


	onPropsChange (props) {
		for (let listener of this[PropsChangeListeners]) {
			callListener(listener, props);
		}
	}


	addPropsChangeListner (fn) {
		this[PropsChangeListeners].add(fn);
	}


	removePropsChangeListener (fn) {
		this[PropsChangeListeners].remove(fn);
	}
}
