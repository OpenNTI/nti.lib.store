import {useContext, useMemo} from 'react';
import {Array as ArrayUtils} from '@nti/lib-commons';

import ContextWrapper from '../Context';

const emptyToNull = x => !x || !x.length ? null : x;

const Identity = x => x;

const storeInterface = x => x && x.addChangeListener && x.removeChangeListener;

export function useResolvedStore (storeOrPredicate) {
	const {stores} = useContext(ContextWrapper.Context);
	const isPredicate = typeof storeOrPredicate === 'function';

	const storePredicate = isPredicate ? storeOrPredicate : Identity;
	const given = useMemo(() => isPredicate ? null : emptyToNull(ArrayUtils.ensure(storeOrPredicate).filter(Identity)), [storeOrPredicate]);
	const filtered = useMemo(() => stores.filter(storePredicate), [storePredicate]);

	if (given && !given.every(storeInterface)) {
		throw new Error('Invalid Store');
	}

	return given || filtered;
}
