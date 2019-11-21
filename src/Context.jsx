import React from 'react';
import PropTypes from 'prop-types';

const StoreContext = React.createContext({stores: []});

StoreContextWrapper.Context = StoreContext;
StoreContextWrapper.Consumer = StoreContext.Consumer;
StoreContextWrapper.propTypes = {
	store: PropTypes.object.isRequired,
	children: PropTypes.any
};
export default function StoreContextWrapper ({store, children, ...otherProps}) {
	const {stores} = React.useContext(StoreContext);

	const context = {stores: [...stores, store]};

	return (
		<StoreContext.Provider value={context}>
			{React.cloneElement(React.Children.only(children), otherProps)}
		</StoreContext.Provider>
	);
}
