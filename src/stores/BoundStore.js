import React from 'react';
import PropTypes from 'prop-types';

import SimpleStore from './SimpleStore';
import {PropsChangeEvent} from './Constants';

const SetBinding = Symbol('Set Binding');
const Binding = Symbol('Binding');


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
		this.emit(PropsChangeEvent, props);
	}


	addPropsChangeListner (fn) {
		this.addListener(PropsChangeEvent, fn);
	}


	removePropsChangeListener (fn) {
		this.removeListener(PropsChangeEvent, fn);
	}
}
