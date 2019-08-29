import React from 'react';
import PropTypes from 'prop-types';
import {HOC} from '@nti/lib-commons';

import {getPropsForMap, shouldUpdateForChange} from '../utils';

export default class StoreInstanceConnector extends React.Component {
	/**
	 * Used to compose a Component Class. This returns a new Component Type.
	 *
	 * TODO: change the connect to be a decorator like the other connectors
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
		// eslint-disable-next-line react/display-name
		const cmp = React.forwardRef((props, ref) => (
			<StoreInstanceConnector
				store={store}
				propMap={propMap}
				onMount={onMount}
				onUnmount={onUnmount}
				component={Component}
				componentRef={ref}
				componentProps={props}
			/>
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
		 * Optional/Required: This, or component must be specified... not both.
		 * A single child... will clone and add props.
		 */
		children: PropTypes.element,

		component: PropTypes.any,
		componentRef: PropTypes.any,

		/*
		 * Props to be passed to the child component
		 */
		componentProps: PropTypes.any
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

	componentDidUpdate (prevProps) {
		const {store} = this.props;
		const {store: prevStore} = prevProps;

		if (store !== prevStore) {
			this.subscribe(store);
		}
	}


	subscribe (store) {
		if (this.unsubscribe) {
			this.unsubscribe();
		}

		store.addChangeListener(this.onStoreChange);

		this.unsubscribe = () => (store.removeChangeListener(this.onStoreChange), delete this.unsubscribe);
	}


	onStoreChange = (change) => {

		if (this.unmounted) {
			if (this.unsubscribe) {
				this.unsubscribe();
			}

			return;
		}

		if (shouldUpdateForChange(change, this.props.propMap)) {
			this.forceUpdate();
		}
	}


	render () {
		const {
			component,
			componentRef: ref,
			componentProps = {},
			children,
			store,
			propMap,
			...otherProps
		} = this.props;
		const storeProps = getPropsForMap(store, propMap);

		delete otherProps.onMount;
		delete otherProps.onUnmount;

		const props = {
			...storeProps,
			...componentProps,
			...otherProps,
			ref
		};

		return component
			? React.createElement(component, props)
			: React.cloneElement(React.Children.only(children), props);
	}
}
