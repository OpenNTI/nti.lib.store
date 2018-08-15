import React from 'react';
import PropTypes from 'prop-types';

import SimpleStore from './SimpleStore';
import {PropsChangeEvent, Load} from './Constants';

const SetBinding = Symbol('Set Binding');
const Binding = Symbol('Binding');


export default class BoundStore extends SimpleStore {
	static validateConnection (Component) {
		if (Component.deriveStoreKeyFromProps) {
			throw new Error('Components connected to a bound store cannot define deriveStoreKeyFromProps. Check: ', Component.displayName || Component.name);
		}
	}

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
				return React.createElement(Component, this.props);
			}
		}

		return BoundStoreWrapper;
	}



	[SetBinding] (binding) {
		const changed = this[Binding] !== binding;

		this[Binding] = binding;

		if (changed) {
			this[Load]();
		}
	}


	get binding () {
		return this[Binding];
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
