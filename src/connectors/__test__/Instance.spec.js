/* eslint-env jest */
import React from 'react';
// import PropTypes from 'prop-types';
import {mount} from 'enzyme';
import TestRenderer from 'react-test-renderer';

import InstanceConnector from '../Instance';

class InnerCmp extends React.Component {
	static staticMethod = () => {}

	componentDidUpdate (prevProps) {
		if (prevProps !== this.props) {
			this.updatedProps = this.props;//this is a workaround for enzyme being a jerk and not updating the prop
		}
	}

	render () {
		return (
			<div>
				{JSON.stringify(this.props)}
			</div>
		);
	}
}

class TestCmp extends React.Component {
	render () {
		return (
			<InstanceConnector {...this.props}>
				<InnerCmp />
			</InstanceConnector>
		);
	}
}


function buildStore (initialData) {
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

describe('Instance Connector', () => {
	describe('connect', () => {
		test('Connected component hoists statics', () => {
			const connected = InstanceConnector.connect(null, InnerCmp);

			expect(connected.staticMethod).toEqual(InnerCmp.staticMethod);
		});

		test('Connected component renders the instance connector with appropriate props', () => {
			const store = buildStore({});
			const propMap = {};
			const onMount = () => {};
			const onUnmount = () => {};

			const Connected = InstanceConnector.connect(store, InnerCmp, propMap, onMount, onUnmount);

			const testRenderer = TestRenderer.create((
				<Connected />
			));
			const testRoot = testRenderer.root;

			const instanceConnector = testRoot.findByType(InstanceConnector);
			const innerCmp = testRoot.findByType(InnerCmp);

			expect(innerCmp).toBeDefined();
			expect(instanceConnector).toBeDefined();
			expect(instanceConnector.props.store).toEqual(store);
			expect(instanceConnector.props.propMap).toEqual(propMap);
			expect(instanceConnector.props.onMount).toEqual(onMount);
			expect(instanceConnector.props.onUnmount).toEqual(onUnmount);
		});
	});


	describe('High Order Component', () => {
		test('onMount and onUnmount props get called', () => {
			const store = buildStore({});

			const onMount = jest.fn();
			const onUnmount = jest.fn();

			const testRenderer = TestRenderer.create((
				<TestCmp
					store={store}
					propMap={{}}
					onMount={onMount}
					onUnmount={onUnmount}
				/>
			));

			expect(onMount).toHaveBeenCalled();

			testRenderer.unmount();

			expect(onUnmount).toHaveBeenCalled();
		});

		test('Adds change listener to store and removes it on unmount', () => {
			const store = buildStore({});

			const testRenderer = TestRenderer.create((
				<TestCmp
					store={store}
					propMap={{}}
				/>
			));

			expect(store.getListenerCount()).toEqual(1);

			testRenderer.unmount();

			expect(store.getListenerCount()).toEqual(0);
		});

		test('Passes existing store props on initial render', () => {
			const store = buildStore({key1: 'value1', 'key2': 2});

			const testRenderer = TestRenderer.create((
				<TestCmp
					store={store}
					propMap={['key1', 'key2']}
				/>
			));
			const testRoot = testRenderer.root;

			const innerCmp = testRoot.findByType(InnerCmp);

			expect(innerCmp.props.key1).toEqual('value1');
			expect(innerCmp.props.key2).toEqual(2);
		});

		test('Passes new store props on change event', () => {
			const store = buildStore({key1: 'initial1', key2: 'initial2'});
			const testCmp = mount((
				<TestCmp
					store={store}
					propMap={['key1', 'key2']}
				/>
			));

			const innerCmp = testCmp.find(InnerCmp);

			expect(innerCmp.prop('key1')).toEqual('initial1');
			expect(innerCmp.prop('key2')).toEqual('initial2');

			store.set('key1', 'updated1');
			store.set('key2', 'updated2');
			store.fireChange(['key1', 'key2']);

			expect(innerCmp.instance().updatedProps.key1).toEqual('updated1');
			expect(innerCmp.instance().updatedProps.key2).toEqual('updated2');
		});
	});
});