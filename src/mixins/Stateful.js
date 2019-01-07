import Storage from '@nti/web-storage';
import {getAppUsername} from '@nti/web-client';
//TODO: don't depend on web repos in a lib!

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
		let initialized = false;

		this.stateInitialized = new Promise ((fulfill) => {
			const applyDefaultKey = () => {
				setImmediate(() => {
					if (this.StateKey && !initialized) {
						initialized = true;
						this.setStateKey(this.StateKey);
						fulfill();
					}
				});
			};

			if (this.addPropsChangeListener) {
				this.addPropsChangeListener((props, Component) => {
					if (Component.deriveStateKeyFromProps) {
						this.setStateKey(Component.deriveStateKeyFromProps(props));

						if (!initialized) {
							initialized = true;
							fulfill();
						}
					} else {
						applyDefaultKey();
					}
				});
			} else {
				applyDefaultKey();
			}
		});

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
