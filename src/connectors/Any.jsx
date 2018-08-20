import React from 'react';
import {HOC} from '@nti/lib-commons';

import StoreContext from '../Context';

import MultipleInstance from './MultipleInstance';

export default class AnyStoreConnector extends React.Component {
	static connect (propMap) {
		return function decorator (Component) {
			const cmp = React.forwardRef((props, ref) => {
				return (
					<AnyStoreConnector propMap={propMap}>
						<Component {...props} ref={ref} />
					</AnyStoreConnector>
				);
			});

			HOC.hoistStatics(cmp, Component, 'AnyStoreConnector');

			return cmp;
		};
	}


	render () {

		return (
			<StoreContext.Consumer>
				{
					(({stores}) => {
						return (
							<MultipleInstance
								stores={stores}
								{...this.props}
							/>
						);
					})
				}
			</StoreContext.Consumer>
		);
	}
}
