import Storage from '@nti/web-storage';
import {getAppUsername} from '@nti/web-client';

const StateKey = Symbol('StateKey');
const UpdateState = Symbol('UpdateState');
const ApplyState = Symbol('ApplyState');

const State = {};

const baseKey = () => {
	baseKey.cached = baseKey.cached || btoa(getAppUsername());
	return baseKey.cached;
};
const getLocalStorageKey = (key) => `${baseKey()}-${key}`;
const writeToLocalStorage = (key, value) => Storage.setItem(getLocalStorageKey(key), value);
const readFromLocalStorage = (key) => Storage.getItem(getLocalStorageKey(key));


export default {
	StateKey: null,
	StatefulProperties: null,
	PersistState: false,


	initMixin () {
		const applyDefaultKey = () => {
			//This has to be an immediate for the class properties to be set up
			setImmediate(() => {
				if (this.StateKey) {
					this.setStateKey(this.StateKey);
				}
			});
		};

		if (this.addPropsChangeListener) {
			this.addPropsChangeListener((props, Component) => {
				if (Component.deriveStateKeyFromProps) {
					this.setStateKey(Component.deriveStateKeyFromProps(props));
				} else {
					applyDefaultKey();
				}
			});
		} else {
			applyDefaultKey();
		}

		if (this.addChangeListener) {
			this.addChangeListener(() => {
				this[UpdateState]();
			});
		}
	},


	get stateKey () {
		return this[StateKey];
	},


	setStateKey (stateKey) {
		const changed = this[StateKey] !== stateKey;

		this[StateKey] = stateKey;

		if (changed) {
			this[ApplyState]();
		}
	},


	serializeState (state) {
		return JSON.stringify(state);
	},

	deserializeState (state) {
		if (typeof state !== 'string') { return state; }

		try {
			const json = JSON.parse(state);

			return json;
		} catch (e) {
			return {};
		}
	},


	[UpdateState] () {
		if (!this.StatefulProperties) { return; }

		let state = {};

		for (let property of this.StatefulProperties) {
			state[property] = this.get(property);
		}

		if (this.PersistState) {
			writeToLocalStorage(this.stateKey, this.serializeState(state));
		} else {
			State[this.stateKey] = state;
		}
	},


	[ApplyState] () {
		if (!this.StatefulProperties) { return; }

		const state = this.PersistState ?
			this.deserializeState(readFromLocalStorage(this.stateKey)) :
			State[this.stateKey];

		if(!state) {
			return;
		}

		for (let property of this.StatefulProperties) {
			this.set(property, state[property]);
		}
	}
};
