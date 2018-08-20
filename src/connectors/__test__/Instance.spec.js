/* eslint-env jest */
import React from 'react';
import TestRenderer from 'react-test-renderer';

import InstanceConnector from '../Instance';

import {InnerCmp, buildStore} from './Common';

class TestCmp extends React.Component {
	render () {
		return (
			<InstanceConnector {...this.props}>
				<InnerCmp />
			</InstanceConnector>
		);
	}
}

describe('Instance Connector', () => {
	describe('connect', () => {
		test('Connected component hoists statics', () => {
			const connected = InstanceConnector.connect(null, InnerCmp);

			expect(connected.staticMethod).toEqual(InnerCmp.staticMethod);
		});

		test('Connected component passes ref to the inner cmp', () => {
			const store = buildStore({});
			const propMap = {};

			let innerCmpRef = null;

			const Connected = InstanceConnector.connect(store, InnerCmp, propMap);

			const testRenderer = TestRenderer.create((
				<Connected ref={x => innerCmpRef = x} />
			));

			const innerCmp = testRenderer.root.findByType(InnerCmp);

			expect(innerCmp.instance).toEqual(innerCmpRef);
		});

		test('Connected component renders the instance connector with appropriate props', () => {
			const store = buildStore({});
			const propMap = {};
			const onMount = () => {};
			const onUnmount = () => {};

			const Connected = InstanceConnector.connect(store, InnerCmp, propMap, onMount, onUnmount);

			const testRenderer = TestRenderer.create((
				<Connected extraProp="foo"/>
			));
			const testRoot = testRenderer.root;

			const connector = testRoot.findByType(InstanceConnector);
			const innerCmp = testRoot.findByType(InnerCmp);

			expect(innerCmp).toBeDefined();
			expect(innerCmp.props.extraProp).toEqual('foo');

			expect(connector).toBeDefined();
			expect(connector.props.store).toEqual(store);
			expect(connector.props.propMap).toEqual(propMap);
			expect(connector.props.onMount).toEqual(onMount);
			expect(connector.props.onUnmount).toEqual(onUnmount);
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

			const testRenderer = TestRenderer.create((
				<TestCmp
					store={store}
					propMap={['key1', 'key2']}
				/>
			));

			const innerCmp = testRenderer.root.findByType(InnerCmp);

			expect(innerCmp.props.key1).toEqual('initial1');
			expect(innerCmp.props.key2).toEqual('initial2');

			store.set('key1', 'updated1');
			store.set('key2', 'updated2');
			store.fireChange(['key1', 'key2']);

			expect(innerCmp.props.key1).toEqual('updated1');
			expect(innerCmp.props.key2).toEqual('updated2');
		});

		test('Doesn\'t update if the change event types aren\'t in the propMap', () => {
			const store = buildStore({key1: 'initial'});

			const testRenderer = TestRenderer.create((
				<TestCmp
					store={store}
					propMap={['key1']}
				/>
			));

			const innerCmp = testRenderer.root.findByType(InnerCmp);

			expect(innerCmp.props.key1).toEqual('initial');

			store.set('key1', 'updated');
			store.fireChange('key2');

			expect(innerCmp.props.key1).toEqual('initial');
		});
	});
});
