import * as Mixins from '../mixins';

import BatchLoadMore from './BatchLoadMore';
import createInterface from './create-interface';
import Stateful from './Stateful';

function convertMixin (mixin) {
	return createInterface(
		Object.defineProperties({
			initInterface (...args) {
				if (mixin.initMixin) {
					return mixin.initMixin.apply(this, args);
				}
			}
		}, Object.getOwnPropertyDescriptors(mixin))
	);
}

function combineInterfaces (...interfaces) {
	return (target) => (
		interfaces.reduce((acc, interface) => interface(acc), target)
	);
}

const Interfaces = {
	combine: combineInterfaces,

	BatchLoadMore,
	Stateful
};

for (let [key, mixin] of Object.entries(Mixins)) {
	if (Interfaces[key]) { continue; }
	Interfaces[key] = convertMixin(mixin);
}

export default Interfaces;
