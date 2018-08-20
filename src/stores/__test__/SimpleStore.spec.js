/* eslint-env jest */
import SimpleStore from '../SimpleStore';
import {ChangeEvent} from '../Constants';

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

	});

	describe('Static', () => {
		describe('getStore', () => {
			test('Singleton stores return the same instance every time', () => {
				class TestStore extends SimpleStore {
					static Singleton = true
				}

				expect(TestStore.getStore()).toBeInstanceOf(TestStore);
				expect(TestStore.getStore()).toEqual(TestStore.getStore());
				expect(TestStore.getStore('store1')).toEqual(TestStore.getStore('store2'));
			});

			test('Passing the same key returns the same instance', () => {
				class TestStore extends SimpleStore {}

				expect(TestStore.getStore()).toBeInstanceOf(TestStore);
				expect(TestStore.getStore('store1')).toEqual(TestStore.getStore('store1'));
				expect(TestStore.getStore('store2')).toEqual(TestStore.getStore('store2'));
				expect(TestStore.getStore('store1')).not.toEqual(TestStore.getStore('store2'));
			});

			test('Passing no key returns a new instance everytime', () => {
				class TestStore extends SimpleStore {}

				expect(TestStore.getStore()).toBeInstanceOf(TestStore);
				expect(TestStore.getStore()).not.toBe(TestStore.getStore());
			});
		});
	});


	describe('connect', () => {

	});
});
