import React from 'react';

import {getPropsForMap, shouldUpdateForChange} from '../utils';

import { useResolvedStore } from './resolve-store';

export default function useMonitor (propMap, storePredicate = Boolean) {
	const monitoring = useResolvedStore(storePredicate);

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
