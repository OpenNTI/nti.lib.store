import React from 'react';
import PropTypes from 'prop-types';
import {HOC} from '@nti/lib-commons';

import {getPropsForMap, shouldUpdateForChange} from '../utils';

export default class MultipleInstanceConnector extends React.Component {
	static connect (stores, propMap) {
		return function decorator (Component) {
			// eslint-disable-next-line react/display-name
			const cmp = React.forwardRef((props, ref) => (
				<MultipleInstanceConnector
					component={Component}
					componentRef={ref}
					stores={stores}
					propMap={propMap}
					props={props}
				/>
			));

			HOC.hoistStatics(cmp, Component, 'MultipleInstanceConnector');

			return cmp;
		};
	}


	static propTypes = {
		stores: PropTypes.arrayOf(
			PropTypes.shape({
				get: PropTypes.func.isRequired,
				addChangeListener: PropTypes.func.isRequired,
				removeChangeListener: PropTypes.func.isRequired
			})
		),
		propMap: PropTypes.oneOfType([
			PropTypes.object,
			PropTypes.array
		]),
		props: PropTypes.object,
		component: PropTypes.any,
		componentRef: PropTypes.any,

		children: PropTypes.element
	}

	constructor (props) {
		super(props);

		const {stores} = props;

		this.subscribe(stores);
	}


	componentWillUnmount () {
		this.unmounted = true;

		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}


	componentDidUpdate (prevProps) {
		const {stores} = this.props;
		const {stores: prevStores} = prevProps;

		if (stores !== prevStores) {
			this.subscribe(stores);
		}
	}


	subscribe (stores) {
		if (this.unsubscribe) {
			this.unsubscribe();
		}

		for (let store of stores) {
			store.addChangeListener(this.onStoreChange);
		}

		this.unsubscribe = () => {
			for (let store of stores) {
				store.removeChangeListener(this.onStoreChange);
			}

			delete this.unsubscribe;
		};
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
			props,
			stores,
			propMap,
			children,
			...otherProps
		} = this.props;
		const storeProps = getPropsForMap(stores, propMap);

		const p = {
			...storeProps,
			...otherProps,
			...props,
			ref
		};

		return component
			? React.createElement(component, p)
			: React.cloneElement(React.Children.only(children), p);
	}
}
