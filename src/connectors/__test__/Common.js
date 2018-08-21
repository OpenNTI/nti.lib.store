import React from 'react';

export class InnerCmp extends React.Component {
	static staticMethod = () => {}

	render () {
		return (
			<div>
				Inner Cmp
			</div>
		);
	}
}

export function buildStore (initialData) {
	const data = {...initialData};
	let listeners = [];

	return {
		get (key) {
			return data[key];
		},


		set (key, value) {
			data[key] = value;
		},


		addChangeListener (fn) {
			listeners.push(fn);
		},


		removeChangeListener (fn) {
			listeners = listeners.filter(handler => handler !== fn);
		},


		getListenerCount () {
			return listeners.length;
		},


		fireChange (type) {
			for (let listener of listeners) {
				listener({type});
			}
		}
	};
}
