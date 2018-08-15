import React from 'react';
import PropTypes from 'prop-types';

const StoreContext = React.createContext({stores: []});


export class Wrapper extends React.Component {
	static Consumer = StoreContext.Consumer

	static propTypes = {
		store: PropTypes.object.isRequired,
		children: PropTypes.any
	}


	render () {
		const {store, children} = this.props;

		return (
			<StoreContext.Consumer>
				{
					({stores}) => {
						const context = {stores: [...stores, store]};

						return (
							<StoreContext.Provider value={context}>
								{children}
							</StoreContext.Provider>
						);
					}
				}
			</StoreContext.Consumer>
		);
	}
}
