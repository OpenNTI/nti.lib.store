import createInterface from './create-interface';

const StateKey = Symbol('State Key');
const UpdateState = Symbol('Update State');
const ApplyState = Symbol('Apply State');

function MemoryStorage() {
	const state = {};

	return {
		read: key => state[key],
		write: (key, value) => (state[key] = value),
	};
}

Stateful.InMemoryStorage = MemoryStorage();
export default function Stateful(key, properties, storage) {
	storage = storage || Stateful.InMemoryStorage;

	if (!storage.read || !storage.write) {
		throw new Error('Invalid Storage Passed: ', storage);
	}

	return createInterface({
		[createInterface.ID]: 'Stateful',

		initInterface() {
			let initialized = false;

			const applyDefaultKey = () => {
				if (key && !initialized) {
					initialized = true;
					this.setStateKey(typeof key === 'function' ? key() : key);
				}
			};

			if (this.addPropsChangeListener) {
				this.addPropsChangeListener((props, Component) => {
					if (Component.deriveStateKeyFromProps) {
						this.setStateKey(
							Component.deriveStateKeyFromProps(props)
						);
						initialized = true;
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

		get stateKey() {
			return this[StateKey];
		},

		setStateKey(stateKey) {
			const changed = this.stateKey !== stateKey;

			this[StateKey] = stateKey;

			if (changed) {
				this[ApplyState]();
			}
		},

		[UpdateState]() {
			if (!properties) {
				return;
			}

			const state = {};

			for (let property of properties) {
				state[property] = this.get(property);
			}

			storage.write(this.stateKey, state);
		},

		[ApplyState]() {
			if (!properties) {
				return;
			}

			const state = storage.read(this.stateKey);

			if (!state) {
				return;
			}

			this.set(
				properties.reduce((acc, prop) => {
					acc[prop] = state[prop];

					return acc;
				}, {})
			);
		},
	});
}
