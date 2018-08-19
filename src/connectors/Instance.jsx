import React from 'react';
import PropTypes from 'prop-types';
import {HOC} from '@nti/lib-commons';

import {getPropsForMap, normalizePropMap} from '../utils';

export default class StoreInstanceConnector extends React.Component {
	/**
	 * Used to compose a Component Class. This returns a new Component Type.
	 *
	 * @param  {Object}   store     The store to connect to.
	 * @param  {Class}    Component The component to compose & wire to store updates.
	 * @param  {Object}   propMap   mapping of key from store to a a prop name.
	 *                          Ex:
	 *                          {
	 *                              'AppUser': 'user',
	 *                              'AppName': 'title',
	 *                          }
	 * @param  {Function} onMount   A callback after the component mounts. Handy to dynamically build stores or load data.
	 * @param  {Function} onUnmount A callback before the component unmounts.
	 * @return {Function}           A Composed Component
	 */
	static connect (store, Component, propMap, onMount, onUnmount) {
		const cmp = React.forwardRef((props, ref) => (
			<StoreInstanceConnector
				store={store}
				propMap={propMap}
				onMount={onMount}
				onUnmount={onUnmount}
			>
				<Component {...props} ref={ref} />
			</StoreInstanceConnector>
		));

		return HOC.hoistStatics(cmp, Component, 'StoreInstanceConnector');
	}

	static propTypes = {
		/*
		 * A store should implement at minimum three methods:
		 *
		 *     get(string): any
		 *         Used to retrieve a prop-mapping value from the store.
		 *
		 *     addChangeListener(function): void
		 *         Used to subscribe to updates.
		 *
		 *     removeChangeListener(function): void
		 *         Used to unsubscribe from updates.
		 */
		store: PropTypes.shape({
			get: PropTypes.func.isRequired,
			addChangeListener: PropTypes.func.isRequired,
			removeChangeListener: PropTypes.func.isRequired
		}).isRequired,

		/*
		 * A mapping of Store-Key to propName.
		 * Keys present will be retrieved form the store and assigned to a prop passed to our Component/child.
		 */
		propMap: PropTypes.oneOfType([
			PropTypes.object,
			PropTypes.array
		]),

		/*
		 * A function to call when this component mounts. Useful for triggering loads/constructing stores.
		 */
		onMount: PropTypes.func,

		/*
		 * A function to call when this component unmounts.
		 */
		onUnmount: PropTypes.func,

		/*
		 * Optional/Required: This, or _component must be specified... not both.
		 * A single child... will clone and add props.
		 */
		children: PropTypes.element
	}

	constructor (props) {
		super(props);

		const {store} = props;

		this.subscribe(store);
	}


	componentDidMount () {
		const {onMount} = this.props;

		if (onMount) {
			onMount();
		}
	}


	componentWillUnmount () {
		const {onUnmount} = this.props;

		this.unmounted = true;

		if (this.unsubscribe) {
			this.unsubscribe();
		}

		if (onUnmount) {
			onUnmount();
		}
	}


	subscribe (store) {
		if (this.unsubscribe) {
			this.ubsubscribe();
		}

		store.addChangeListener(this.onStoreChange);

		this.unsubscribe = () => (store.removeChangeListener(this.onStoreChange), delete this.unsubscribe);
	}


	onStoreChange = ({type} = {}) => {

		if (this.unmounted) {
			if (this.unsubscribe) {
				this.unsubscribe();
			}

			return;
		}

		const {propMap} = this.props;

		if (!type && propMap) {
			throw new Error('No type on change');
		}

		if (type && !Array.isArray(type)) {
			type = [type];
		}

		const normalized = propMap && normalizePropMap(propMap);

		const shouldUpdate = !normalized || type.some(prop => normalized.hasOwnProperty(prop));

		if (shouldUpdate) {
			this.forceUpdate();
		}
	}


	render () {
		const {children, store, propMap, ...otherProps} = this.props;
		const storeProps = getPropsForMap(store, propMap);

		delete otherProps.onMount;
		delete otherProps.onUnmount;

		return React.cloneElement(React.Children.only(children), {...storeProps, ...otherProps});
	}
}
