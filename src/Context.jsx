import React from 'react';
import PropTypes from 'prop-types';

const StoreContext = React.createContext({stores: []});


export default class StoreContextWrapper extends React.Component {
	static Consumer = StoreContext.Consumer

	static propTypes = {
		store: PropTypes.object.isRequired,
		children: PropTypes.any
	}


	render () {
		const {store, children, ...otherProps} = this.props;

		return (
			<StoreContext.Consumer>
				{
					({stores}) => {
						const context = {stores: [...stores, store]};

						return (
							<StoreContext.Provider value={context}>
								{React.cloneElement(React.Children.only(children), otherProps)}
							</StoreContext.Provider>
						);
					}
				}
			</StoreContext.Consumer>
		);
	}
}
