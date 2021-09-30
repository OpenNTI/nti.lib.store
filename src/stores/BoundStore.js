import React from 'react';
import PropTypes from 'prop-types';

import { equals } from '@nti/lib-commons';

import SimpleStore from './SimpleStore';
import { PropsChangeEvent, Load } from './Constants';

const SetBinding = Symbol('Set Binding');
const Binding = Symbol('Binding');

export default class BoundStore extends SimpleStore {
	static validateConnection(Component) {
		if (Component.deriveStoreKeyFromProps) {
			throw new Error(
				'Components connected to a bound store cannot define deriveStoreKeyFromProps. Check: ',
				Component.displayName || Component.name
			);
		}
	}

	static useWrapperEffects(store, props, Cmp, config) {
		const binding = config?.deriveBindingFromProps?.(props) ?? null;

		store?.[SetBinding](binding);

		React.useEffect(() => {
			store?.onPropsChange(props, Cmp);
		});
	}

	static buildConnectorCmp(Component) {
		const deriveBinding = props =>
			Component.deriveBindingFromProps
				? Component.deriveBindingFromProps(props)
				: null;

		class BoundStoreWrapper extends React.Component {
			static propTypes = {
				store: PropTypes.shape({
					onPropsChange: PropTypes.func.isRequired,
					cleanup: PropTypes.func,
				}).isRequired,
				children: PropTypes.any,
			};

			componentDidMount() {
				this.setupFor(this.props);
			}

			componentDidUpdate(old) {
				this.setupFor(this.props);
			}

			componentWillUnmount() {
				if (this.props.store.cleanup) {
					this.props.store.cleanup();
				}
			}

			setupFor(props) {
				const { store } = props;
				const binding = deriveBinding(props);

				store[SetBinding](binding);
				store.onPropsChange(props, Component);
			}

			render() {
				return this.props.children;
			}
		}

		return BoundStoreWrapper;
	}

	bindingDidUpdate(prevBinding) {
		// do a shallow equality test on the keys of "binding"
		return !equals(this[Binding], prevBinding);
	}

	[SetBinding](binding) {
		const oldBinding = this[Binding];

		this[Binding] = binding;

		if (!oldBinding || this.bindingDidUpdate(oldBinding)) {
			this[Load]();
		}
	}

	get binding() {
		return this[Binding];
	}

	onPropsChange(props, Component) {
		this.emit(PropsChangeEvent, props, Component);
	}

	addPropsChangeListener(fn) {
		this.removePropsChangeListener(fn);
		this.addListener(PropsChangeEvent, fn);
	}

	removePropsChangeListener(fn) {
		this.removeListener(PropsChangeEvent, fn);
	}
}
