import {useContext} from 'react';
import {ArrayUtils} from '@nti/lib-commons';

import ContextWrapper from '../Context';

const emptyToNull = x => !x || !x.length ? null : x;

const Identity = x => x;

const storeInterface = x => x && x.addChangeListener && x.removeChangeListener;

export function useResolvedStore (storeOrPredicate) {
	const {stores} = useContext(ContextWrapper.Context);
	const isPredicate = typeof storeOrPredicate === 'function';

	const storePredicate = isPredicate ? storeOrPredicate : Identity;
	const given = isPredicate ? null : emptyToNull(ArrayUtils.ensureArray(storeOrPredicate).filter(Identity));

	if (given && !given.every(storeInterface)) {
		throw new Error('Invalid Store');
	}

	return given || stores.filter(storePredicate);
}
