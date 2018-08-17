import React from 'react';
import PropTypes from 'prop-types';
import {HOC} from '@nti/lib-commons';

import {getPropsForMap} from '../utils';
import StoreContext from '../Context';

export default class AnyStoreConnector extends React.Component {
	static connect (propMap) {
		return function decorator (Component) {
			const cmp = React.forwardRef((props, ref) => {
				return (
					<AnyStoreConnector
						propMap={propMap}
					>
						<Component {...props} ref={ref} />
					</AnyStoreConnector>
				);
			});

			HOC.hoistStatics(cmp, Component, 'AnyStoreConnector');

			return cmp;
		};
	}


	static propTypes = {
		propMap: PropTypes.oneOfType([
			PropTypes.object,
			PropTypes.array
		]),

		children: PropTypes.element
	}


	render () {
		const {propMap, children, ...otherProps} = this.props;

		return (
			<StoreContext.Consumer>
				{
					({stores}) => {
						const storeProps = getPropsForMap(stores, propMap);

						return React.cloneElement(React.Children.only(children), {...storeProps, ...otherProps});
					}
				}
			</StoreContext.Consumer>
		);
	}
}
