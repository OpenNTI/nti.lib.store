const StateKey = Symbol('StateKey');
const UpdateState = Symbol('UpdateState');
const ApplyState = Symbol('ApplyState');

const State = {};

export default {
	StatefulProperties: null,

	initMixin() {
		if (this.addPropsChangeListener) {
			this.addPropsChangeListener((props, Component) => {
				if (Component.deriveStateKeyFromProps) {
					this.setStateKey(Component.deriveStateKeyFromProps(props));
				}
			});
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
		const changed = this[StateKey] !== stateKey;

		this[StateKey] = stateKey;

		if (changed) {
			this[ApplyState]();
		}
	},

	[UpdateState]() {
		if (!this.StatefulProperties) {
			return;
		}

		let state = {};

		for (let property of this.StatefulProperties) {
			state[property] = this.get(property);
		}

		State[this.stateKey] = state;
	},

	[ApplyState]() {
		if (!this.StatefulProperties) {
			return;
		}

		const state = State[this.stateKey];

		if (!state) {
			return;
		}

		for (let property of this.StatefulProperties) {
			this.set(property, state[property]);
		}
	},
};
