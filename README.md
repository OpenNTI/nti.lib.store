# nti-lib-store

Example usage:

Store.js:
```
import {LOADED} from './Constants'; //export const LOADED = 'my:unique:prefix:LOADED';

import StorePrototype from 'nti-lib-store';

class Store extends StorePrototype {

	constructor () {
		super();
		this.registerHandlers({
			[LOADED]: SetData
		});
	}


	get isLoaded () {
		return !!this[data];
	}


	[SetData] (payload) {
		this[data] = payload.action.response;
		this.emitChange({type: LOADED});
	}


	getData () { return this[data]; }

}

export default new Store();
```


Actions.js:
```
import {dispatch} from 'nti-lib-dispatcher';

import {getSomthing} from './Api';
import {LOADED} from './Constants';

export function load () {
	getSomething()
		.then(data => dispatch(LOADED, data));
}
```
