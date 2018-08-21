/* eslint-env jest */
import React from 'react';
import TestRenderer from 'react-test-renderer';

import SimpleStore from '../SimpleStore';
import {ChangeEvent, Load} from '../Constants';
import StoreContext from '../../Context';
import {Instance as InstanceConnector} from '../../connectors';

describe('SimpleStore', () => {
	describe('Instance', () => {
		class TestStore extends SimpleStore {
			classProperty = 'classProperty'
		}

		test('defines methods necessary for the connectors', () => {
			const store = new TestStore();

			expect(store.get).toBeDefined();
			expect(store.addChangeListener).toBeDefined();
			expect(store.removeChangeListener).toBeDefined();
		});

		test('calls initMixins if defined', () => {
			let initCalled = false;

			class MixinStore extends SimpleStore {
				initMixins () {
					initCalled = true;
				}
			}

			const store = new MixinStore();

			//This looks stupid, but eslint complains if I don't use the instance
			expect(store).toBeInstanceOf(MixinStore);
			expect(initCalled).toBeTruthy();
		});

		describe('get', () => {
			test('returns values that have been set', () => {
				const store = new TestStore();

				store.set('key', 'value');

				expect(store.get('key')).toEqual('value');
			});

			test('returns class properties', () => {
				const store = new TestStore();

				expect(store.get('classProperty')).toEqual('classProperty');
			});

			test('prefers set data over class properties', () => {
				const store = new TestStore();

				store.set('classProperty', 'setProperty');

				expect(store.get('classProperty')).toEqual('setProperty');
			});
		});

		describe('set', () => {
			beforeEach (() => {
				jest.useFakeTimers();
			});

			afterEach (() => {
				jest.useRealTimers();
			});

			test('handles a key/value', () => {
				const store = new TestStore();

				store.set('key', 'value');
				store.set('foo', 'bar');

				expect(store.get('key')).toEqual('value');
				expect(store.get('foo')).toEqual('bar');
			});

			test('handles an object', () => {
				const store = new TestStore();

				store.set({
					key: 'value',
					foo: 'bar'
				});

				expect(store.get('key')).toEqual('value');
				expect(store.get('foo')).toEqual('bar');
			});

			test('starts a timeout', () => {
				const store = new TestStore();

				store.set('key', 'value');

				expect(setTimeout).toHaveBeenCalled();
			});

			test('only starts one timeout at a time', () => {
				const store = new TestStore();

				store.set('key', 'value');
				store.set('foo', 'bar');

				expect(setTimeout).toHaveBeenCalledTimes(1);
			});

			test('calls emitChange with all the keys that have been changed', () => {
				const store = new TestStore();

				jest.spyOn(store, 'emitChange');

				store.set('key', 'value');
				store.set({
					foo: 'bar'
				});

				jest.runAllTimers();

				expect(store.emitChange).toHaveBeenCalled();
			});
		});

		describe('changes', () => {
			beforeEach (() => {
				jest.useFakeTimers();
			});

			afterEach (() => {
				jest.useRealTimers();
			});

			test('emitChange cancels the emitChangeTimeout', () => {
				const store = new TestStore();

				store.emitChangeTimeout = 300;

				store.emitChange('type');
				expect(clearTimeout).toHaveBeenCalledTimes(1);
				expect(clearTimeout).toHaveBeenLastCalledWith(store.emitChangeTimeout);
			});

			test('emitChange fires the change event with the arguments as the type', () => {
				const store = new TestStore();

				jest.spyOn(store, 'emit');

				store.emitChange('key');

				expect(store.emit).toHaveBeenCalledTimes(1);
				expect(store.emit).toHaveBeenLastCalledWith(ChangeEvent, {type: 'key'});
			});

			test('emitChange include any changed keys', () => {
				const store = new TestStore();

				jest.spyOn(store, 'emit');

				store.set('key', 'value');
				store.set({
					'foo': 'bar',
					'prop': 'value'
				});

				store.emitChange('change');

				expect(store.emit).toHaveBeenCalledTimes(1);
				//unfortunately the order of the type array matters...
				expect(store.emit).toHaveBeenLastCalledWith(ChangeEvent, {type: ['change', 'key', 'foo', 'prop']});
			});

			test('emitChange emits changed keys even if no argument is passed', () => {
				const store = new TestStore();

				jest.spyOn(store, 'emit');

				store.set('key', 'value');
				store.set({
					'foo': 'bar',
					'prop': 'value'
				});

				store.emitChange();

				expect(store.emit).toHaveBeenCalledTimes(1);
				//unfortunately the order of the type array matters...
				expect(store.emit).toHaveBeenLastCalledWith(ChangeEvent, {type: ['key', 'foo', 'prop']});
			});

			test('emitChange nulls out any changed keys', () => {
				const store = new TestStore();

				jest.spyOn(store, 'emit');

				store.set('key', 'value');
				store.emitChange();

				expect(store.emit).toHaveBeenCalledTimes(1);
				expect(store.emit).toHaveBeenLastCalledWith(ChangeEvent, {type: 'key'});

				store.set('foo', 'bar');
				store.emitChange();

				expect(store.emit).toHaveBeenCalledTimes(2);
				expect(store.emit).toHaveBeenLastCalledWith(ChangeEvent, {type: 'foo'});
			});

			test('emitting the change event calls change listeners', () => {
				const listeners = [
					jest.fn(),
					jest.fn()
				];
				const arg = 'arg';

				const store = new TestStore();

				store.addChangeListener(listeners[0]);
				store.addChangeListener(listeners[1]);

				store.emit(ChangeEvent, arg);

				expect(listeners[0]).toHaveBeenCalledTimes(1);
				expect(listeners[1]).toHaveBeenCalledTimes(1);

				expect(listeners[0]).toHaveBeenLastCalledWith(arg);
				expect(listeners[1]).toHaveBeenLastCalledWith(arg);
			});

			test('removed change listener does not get called', () => {
				const listener = jest.fn();
				const store = new TestStore();

				store.addChangeListener(listener);
				store.removeChangeListener(listener);

				store.emit(ChangeEvent);

				expect(listener).not.toHaveBeenCalled();
			});

			test('change listeners do not get added more than once', () => {
				const listener = jest.fn();
				const store = new TestStore();

				store.addChangeListener(listener);
				store.addChangeListener(listener);
				store.addChangeListener(listener);

				store.emit(ChangeEvent);

				expect(listener).toHaveBeenCalledTimes(1);
			});
		});

		describe('[Load]', () => {
			class LoadStore extends SimpleStore {
				load () {}
			}

			beforeEach (() => {
				jest.useFakeTimers();
			});

			afterEach (() => {
				jest.useRealTimers();
			});

			test('if load is not defined on the subclass [Load] does nothing', () => {
				const store = new TestStore();

				store[Load]();

				expect(setTimeout).not.toHaveBeenCalled();
			});

			test('only calls load once if [Load] is called in quick succession', () => {
				const store = new LoadStore();

				jest.spyOn(store, 'load');

				store[Load]();
				store[Load]();
				store[Load]();

				jest.runAllTimers();

				expect(store.load).toHaveBeenCalledTimes(1);
			});

			test('calls load again if enough time passes between [Load]', () => {
				const store = new LoadStore();

				jest.spyOn(store, 'load');

				store[Load]();
				store[Load]();

				jest.runAllTimers();
				expect(store.load).toHaveBeenCalledTimes(1);

				store[Load]();
				store[Load]();

				jest.runAllTimers();
				expect(store.load).toHaveBeenCalledTimes(2);
			});
		});

	});

	describe('Static', () => {
		describe('getStore', () => {
			test('Singleton stores return the same instance every time', () => {
				class TestStore extends SimpleStore {
					static Singleton = true
				}

				expect(TestStore.getStore()).toBeInstanceOf(TestStore);
				expect(TestStore.getStore()).toBe(TestStore.getStore());
				expect(TestStore.getStore('store1')).toBe(TestStore.getStore('store2'));
			});

			test('Passing the same key returns the same instance', () => {
				class TestStore extends SimpleStore {}

				expect(TestStore.getStore()).toBeInstanceOf(TestStore);
				expect(TestStore.getStore('store1')).toBe(TestStore.getStore('store1'));
				expect(TestStore.getStore('store2')).toBe(TestStore.getStore('store2'));
				expect(TestStore.getStore('store1')).not.toBe(TestStore.getStore('store2'));
			});

			test('Passing no key returns a new instance everytime', () => {
				class TestStore extends SimpleStore {}

				expect(TestStore.getStore()).toBeInstanceOf(TestStore);
				expect(TestStore.getStore()).not.toBe(TestStore.getStore());
			});
		});
	});

	//Yes this is a static, but I figured it was complicated enough to warrant its own block
	describe('connect', () => {
		class TestStore extends SimpleStore {}

		class InnerCmp extends React.Component {
			static staticMethod = () => {}

			render () {
				return (
					<div>
						Inner Cmp
					</div>
				);
			}
		}

		test('Connected component hoists statics', () => {
			const connected = TestStore.connect({})(InnerCmp);

			expect(connected.staticMethod).toEqual(InnerCmp.staticMethod);
		});

		test('Connected component forwards the ref to the inner cmp', () => {
			const Connected = TestStore.connect({})(InnerCmp);

			let innerCmpRef = null;

			const testRenderer = TestRenderer.create((
				<Connected ref={x => innerCmpRef = x} />
			));

			const innerCmp = testRenderer.root.findByType(InnerCmp);

			expect(innerCmp.instance).toEqual(innerCmpRef);
		});

		test('Throws if validateConnection throws', () => {
			class InvalidStore extends SimpleStore {
				static validateConnection () {
					throw new Error('Invalid Connection');
				}
			}

			expect(() => {
				InvalidStore.connect({})(InnerCmp);
			}).toThrow();
		});

		test('Calls buildConnectorCmp with the Component', () => {
			jest.spyOn(TestStore, 'buildConnectorCmp');

			TestStore.connect({})(InnerCmp);

			expect(TestStore.buildConnectorCmp).toHaveBeenCalledTimes(1);
			expect(TestStore.buildConnectorCmp).toHaveBeenLastCalledWith(InnerCmp);
		});

		describe('No connectorCmp, No deriveStoreKeyFromProps', () => {
			const propMap = ['key'];
			const storeProp = 'store-prop';
			const extraProp = 'extra-prop';

			let testRenderer = null;
			let update = null;

			beforeEach(() => {
				const Connector = TestStore.connect(propMap, storeProp)(InnerCmp);

				testRenderer = TestRenderer.create((
					<Connector extraProp={extraProp} />
				));

				update = () => {
					testRenderer.update((
						<Connector extraProp={extraProp} updated />
					));
				};
			});

			test('passes same instance of the store to context, connector, and innerCmp', () => {
				const context = testRenderer.root.findByType(StoreContext);
				const connector = testRenderer.root.findByType(InstanceConnector);
				const innerCmp = testRenderer.root.findByType(InnerCmp);

				const contextStore = context.props.store;
				const connectorStore = connector.props.store;
				const innerCmpStore = innerCmp.props[storeProp];

				expect(contextStore).toBeDefined();
				expect(contextStore).toBe(connectorStore);
				expect(connectorStore).toBe(innerCmpStore);
			});

			test('renders the correct hierarchy (context > connector > innerCmp)', () => {
				const context = testRenderer.root.findByType(StoreContext);
				const connector = testRenderer.root.findByType(InstanceConnector);
				const innerCmp = testRenderer.root.findByType(InnerCmp);

				const getChild = cmp => React.Children.only(cmp.props.children);

				expect(getChild(context).type).toBe(connector.type);
				expect(getChild(connector).type).toBe(innerCmp.type);
			});

			test('passes the correct prop map to the store connector', () => {
				const connector = testRenderer.root.findByType(InstanceConnector);

				expect(connector.props.propMap).toBe(propMap);
			});

			test('passes the store prop to the innerCmp', () => {
				const innerCmp = testRenderer.root.findByType(InnerCmp);

				expect(innerCmp.props[storeProp]).toBeDefined();
			});

			test('passes extra props to the innerCmp', () => {
				const innerCmp = testRenderer.root.findByType(InnerCmp);

				expect(innerCmp.props.extraProp).toEqual(extraProp);
			});

			test('updates do not trigger a new store', () => {
				const connector = testRenderer.root.findByType(InstanceConnector);
				const store = connector.props.store;

				update();

				const updatedConnector = testRenderer.root.findByType(InstanceConnector);
				const updatedStore = updatedConnector.props.store;

				expect(store).toBe(updatedStore);
			});
		});

		describe('No connectorCmp, with deriveStoreKeyFromProps', () => {
			class KeyCmp extends React.Component {
				static deriveStoreKeyFromProps (props) {
					return props.storeKey;
				}

				render () {
					return (
						<div>
							Key Component
						</div>
					);
				}
			}

			test('passes store with correct key', () => {
				const key = 'store-key';
				const Connector = TestStore.connect({})(KeyCmp);
				const testRenderer = TestRenderer.create((
					<Connector storeKey={key} />
				));

				const connector = testRenderer.root.findByType(InstanceConnector);

				expect(connector.props.store.storeKey).toEqual(key);
			});

			test('updating the key passes a new store', () => {
				const Connector = TestStore.connect({})(KeyCmp);
				const testRenderer = TestRenderer.create((
					<Connector storeKey="store-key" />
				));

				const connector = testRenderer.root.findByType(InstanceConnector);
				const store = connector.props.store;

				testRenderer.update((
					<Connector storeKey="store-key-updated" />
				));

				expect(connector.props.store).not.toBe(store);
			});
		});

		describe('With connectorCmp', () => {
			class Wrapper extends React.Component {
				render () {
					return (
						<div {...this.props} />
					);
				}
			}

			class WrapperStore extends SimpleStore {
				static buildConnectorCmp () {
					return Wrapper;
				}
			}

			test('renders the connectorCmp with InstanceConnector and InnerCmp as children', () => {
				const Connector = WrapperStore.connect({})(InnerCmp);
				const testRenderer = TestRenderer.create((
					<Connector />
				));

				const getChild = cmp => React.Children.only(cmp.props.children);

				const wrapperCmp = testRenderer.root.findByType(Wrapper);
				const instanceConnectorCmp = testRenderer.root.findByType(InstanceConnector);
				const innerCmp = testRenderer.root.findByType(InnerCmp);

				expect(wrapperCmp).toBeDefined();

				expect(getChild(wrapperCmp).type).toBe(instanceConnectorCmp.type);
				expect(getChild(instanceConnectorCmp).type).toBe(innerCmp.type);
			});
		});
	});
});
