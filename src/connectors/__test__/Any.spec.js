/* eslint-env jest */
import React from 'react';
import PropTypes from 'prop-types';
import TestRenderer from 'react-test-renderer';

import StoreContext from '../../Context';
import AnyConnector from '../Any';
import MultiConnector from '../MultipleInstance';

import { InnerCmp, buildStore } from './Common';

class TestCmp extends React.Component {
	static propTypes = {
		stores: PropTypes.array,
	};

	render() {
		const { stores } = this.props;

		return this.renderStores(stores);
	}

	renderStores(stores) {
		if (!stores.length) {
			const otherProps = { ...this.props };

			delete otherProps.stores;

			return (
				<AnyConnector {...otherProps}>
					<InnerCmp />
				</AnyConnector>
			);
		}

		return (
			<StoreContext store={stores[0]}>
				{this.renderStores(stores.slice(1))}
			</StoreContext>
		);
	}
}

describe('Any Connector', () => {
	describe('connect', () => {
		test('Connected component hoists statics', () => {
			const connected = AnyConnector.connect({})(InnerCmp);

			expect(connected.staticMethod).toEqual(InnerCmp.staticMethod);
		});

		test('Connected component passes ref to the inner cmp', () => {
			const propMap = {};

			let innerCmpRef = null;

			const Connected = AnyConnector.connect(propMap)(InnerCmp);

			const testRenderer = TestRenderer.create(
				<Connected ref={x => (innerCmpRef = x)} />
			);

			const innerCmp = testRenderer.root.findByType(InnerCmp);

			expect(innerCmp.instance).toEqual(innerCmpRef);
		});

		test('Connected component renders the any connector with appropriate props', () => {
			const propMap = {};

			const Connected = AnyConnector.connect(propMap)(InnerCmp);

			const testRenderer = TestRenderer.create(
				<Connected extraProp="foo" />
			);
			const testRoot = testRenderer.root;

			const connector = testRoot.findByType(AnyConnector);
			const innerCmp = testRoot.findByType(InnerCmp);

			expect(innerCmp).toBeDefined();
			expect(innerCmp.props.extraProp).toEqual('foo');

			expect(connector).toBeDefined();
			expect(connector.props.propMap).toEqual(propMap);
		});
	});

	describe('High Order Component', () => {
		test('Passes stores in the correct order to a MultiStoreConnector', () => {
			const stores = [buildStore({}), buildStore({}), buildStore({})];
			const propMap = {};

			const testRenderer = TestRenderer.create(
				<TestCmp stores={stores} propMap={propMap} extraProp="foo" />
			);

			const multiConnector = testRenderer.root.findByType(MultiConnector);

			expect(multiConnector).toBeDefined();
			expect(multiConnector.props.stores).toEqual(stores);
			expect(multiConnector.props.propMap).toEqual(propMap);
			expect(multiConnector.props.extraProp).toEqual('foo');
		});
	});
});
