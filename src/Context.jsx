import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

const StoreContext = React.createContext({ stores: [] });

StoreContextWrapper.Context = StoreContext;
StoreContextWrapper.Consumer = StoreContext.Consumer;
StoreContextWrapper.propTypes = {
	store: PropTypes.object.isRequired,
	children: PropTypes.any,
};
export default function StoreContextWrapper({
	store,
	children,
	...otherProps
}) {
	const { stores } = useContext(StoreContext);
	const context = useMemo(() => ({ stores: [...stores, store] }), [
		...stores,
		store,
	]);

	return (
		<StoreContext.Provider value={context}>
			{React.cloneElement(React.Children.only(children), otherProps)}
		</StoreContext.Provider>
	);
}

FakeStore.propTypes = {
	mock: PropTypes.object.isRequired,
	children: PropTypes.any.isRequired,
};
/**
 * Mock Store for tests
 * @param {Object} props - props
 * @param {Object} props.mock - The Mock store implementation
 * @param {*} props.children - The children the mock store is for
 * @returns {*} FakeStore wrapped component.
 */
export function FakeStore({ mock, children }) {
	return <StoreContextWrapper store={mock}>{children}</StoreContextWrapper>;
}
