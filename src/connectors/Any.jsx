import React from 'react';
import {HOC} from '@nti/lib-commons';

import StoreContext from '../Context';

import MultipleInstance from './MultipleInstance';

export default class AnyStoreConnector extends React.Component {
	static connect (propMap) {
		return function decorator (Component) {
			// eslint-disable-next-line react/display-name
			const cmp = React.forwardRef((props, ref) => (
				<AnyStoreConnector propMap={propMap} component={Component} componentRef={ref} props={props} />
			));

			HOC.hoistStatics(cmp, Component, 'AnyStoreConnector');

			return cmp;
		};
	}


	render () {

		return (
			<StoreContext.Consumer>
				{
					(({stores}) => (
						<MultipleInstance
							stores={stores}
							{...this.props}
						/>
					))
				}
			</StoreContext.Consumer>
		);
	}
}
