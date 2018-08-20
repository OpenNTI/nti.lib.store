/* eslint-env jest */
import React from 'react';
import TestRenderer from 'react-test-renderer';

import MultipleInstanceConnector from '../MultipleInstance';

import {InnerCmp, buildStore} from './Common';

class TestCmp extends React.Component {
	render () {
		return (
			<MultipleInstanceConnector {...this.props}>
				<InnerCmp />
			</MultipleInstanceConnector>
		);
	}
}

describe('Multiple Instance Connector', () => {
	describe('connect', () => {
		test('Connected component hoists statics', () => {
			const connected = MultipleInstanceConnector.connect([], {})(InnerCmp);

			expect(connected.staticMethod).toEqual(InnerCmp.staticMethod);
		});

		test('Connected component passes the ref to the inner cmp', () => {
			const stores = [buildStore({})];
			const propMap = {};

			let innerCmpRef = null;

			const Connected = MultipleInstanceConnector.connect(stores, propMap)(InnerCmp);

			const testRenderer = TestRenderer.create((
				<Connected ref={x => innerCmpRef = x} />
			));

			const innerCmp = testRenderer.root.findByType(InnerCmp);

			expect(innerCmp.instance).toEqual(innerCmpRef);
		});

		test('Connected component renders the multiple instance connector with appropriate props', () => {
			const stores = [
				buildStore({}),
				buildStore({}),
				buildStore({})
			];
			const propMap = {};

			const Connected = MultipleInstanceConnector.connect(stores, propMap)(InnerCmp);

			const testRenderer = TestRenderer.create((
				<Connected extraProp="foo" />
			));
			const testRoot = testRenderer.root;

			const connector = testRoot.findByType(MultipleInstanceConnector);
			const innerCmp = testRoot.findByType(InnerCmp);

			expect(innerCmp).toBeDefined();
			expect(innerCmp.props.extraProp).toEqual('foo');

			expect(connector).toBeDefined();
			expect(connector.props.stores).toEqual(stores);
			expect(connector.props.propMap).toEqual(propMap);
		});
	});

	describe('High Order Component', () => {
		test('Adds change listener to all stores and removes them on unmount', () => {
			const stores = [
				buildStore({}),
				buildStore({}),
				buildStore({})
			];

			const testRenderer = TestRenderer.create((
				<TestCmp
					stores={stores}
					propMap={{}}
				/>
			));

			for (let store of stores) {
				expect(store.getListenerCount()).toEqual(1);
			}

			testRenderer.unmount();

			for (let store of stores) {
				expect(store.getListenerCount()).toEqual(0);
			}

		});

		test('Passes existing store props with correct hierarchy (last to first) on initial render', () => {
			const stores = [
				buildStore({store1: 'store1', sharedKey1: 'sharedKey1-1', sharedKey2: 'sharedKey2-1'}),
				buildStore({store2: 'store2', sharedKey1: 'sharedKey1-2', sharedKey2: 'sharedKey2-2'}),
				buildStore({store3: 'store3', sharedKey1: 'sharedKey1-3'})
			];

			const testRenderer = TestRenderer.create((
				<TestCmp
					stores={stores}
					propMap={['store1', 'store2', 'store3', 'sharedKey1', 'sharedKey2']}
				/>
			));
			const testRoot = testRenderer.root;

			const innerCmp = testRoot.findByType(InnerCmp);

			expect(innerCmp.props.store1).toEqual('store1');
			expect(innerCmp.props.store2).toEqual('store2');
			expect(innerCmp.props.store3).toEqual('store3');
			expect(innerCmp.props.sharedKey1).toEqual('sharedKey1-3');
			expect(innerCmp.props.sharedKey2).toEqual('sharedKey2-2');
		});

		test('Passes new store props when any of the stores change', () => {
			const stores = [
				buildStore({key1: 'initial1'}),
				buildStore({key2: 'initial2'}),
				buildStore({key3: 'initial3'})
			];

			const testRenderer = TestRenderer.create((
				<TestCmp
					stores={stores}
					propMap={['key1', 'key2', 'key3']}
				/>
			));

			const innerCmp = testRenderer.root.findByType(InnerCmp);

			expect(innerCmp.props.key1).toEqual('initial1');
			expect(innerCmp.props.key2).toEqual('initial2');
			expect(innerCmp.props.key3).toEqual('initial3');

			stores[0].set('key1', 'updated1');
			stores[0].fireChange('key1');

			expect(innerCmp.props.key1).toEqual('updated1');
			expect(innerCmp.props.key2).toEqual('initial2');
			expect(innerCmp.props.key3).toEqual('initial3');

			stores[1].set('key2', 'updated2');
			stores[1].fireChange('key2');

			expect(innerCmp.props.key1).toEqual('updated1');
			expect(innerCmp.props.key2).toEqual('updated2');
			expect(innerCmp.props.key3).toEqual('initial3');

			stores[2].set('key3', 'updated3');
			stores[2].fireChange('key3');

			expect(innerCmp.props.key1).toEqual('updated1');
			expect(innerCmp.props.key2).toEqual('updated2');
			expect(innerCmp.props.key3).toEqual('updated3');
		});
	});
});
