import React from 'react';

import {getPropsForMap, shouldUpdateForChange} from '../utils';
import ContextWrapper from '../Context';

export default function useMonitor (propMap, storePredicate = Boolean) {
	const {stores} = React.useContext(ContextWrapper.Context);
	const monitoring = stores.filter(store => storePredicate(store));

	const [storeProps, setStoreProps] = React.useState(getPropsForMap(monitoring, propMap));

	React.useEffect(() => {
		const update = () => setStoreProps(getPropsForMap(monitoring, propMap));
		const onChange = (change) => {
			if (shouldUpdateForChange(change, propMap)) {
				update();
			}
		};

		for (let monitor of monitoring) {
			monitor.addChangeListener(onChange);
		}

		update();

		return () => {
			for (let monitor of monitoring) {
				monitor.removeChangeListener(onChange);
			}
		};
	}, [...monitoring]);

	return storeProps;
}