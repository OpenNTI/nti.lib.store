import * as Mixins from '../mixins';

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

const Interfaces = {
	Stateful
};

for (let [key, mixin] of Object.entries(Mixins)) {
	if (Interfaces[key]) { continue; }
	Interfaces[key] = convertMixin(mixin);
}

export default Interfaces;
