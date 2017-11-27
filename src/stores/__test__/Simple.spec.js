/* eslint-env jest */
import Simple from '../Simple';

class TestStore extends Simple {
	get foo () { return 'bar'; }
}

describe('Simple Store', () => {
	test('defines methods necessary for the store connector', () => {
		const test = new TestStore();

		expect(test.get).toBeDefined();
		expect(test.addChangeListener).toBeDefined();
		expect(test.removeChangeListener).toBeDefined();
	});

	test('get returns values that have been set', () => {
		const test = new TestStore();

		test.set('key', 'value');

		expect(test.get('key')).toEqual('value');
	});

	test('get returns class properties if they are not defined in data', () => {
		const test = new TestStore();

		expect(test.get('foo')).toEqual('bar');
	});

	test('adding a change listener gets called on emitChange', () => {
		const test = new TestStore();
		const handler = jest.fn();

		test.addChangeListener(handler);
		test.emitChange('prop');

		expect(handler.mock.calls.length).toEqual(1);
		expect(handler.mock.calls[0][0].type).toEqual('prop');
	});

	test('adding a change listener more than once only gets called once', () => {
		const test = new TestStore();
		const handler = jest.fn();

		test.addChangeListener(handler);
		test.addChangeListener(handler);
		test.emitChange('props');

		expect(handler.mock.calls.length).toEqual(1);
	});

	test('adding and removing a change listener does not get called', () => {
		const test = new TestStore();
		const handler = jest.fn();

		test.addChangeListener(handler);
		test.removeChangeListener(handler);
		test.emitChange('props');

		expect(handler.mock.calls.length).toEqual(0);
	});

	test('removes correct listener', () => {
		const test = new TestStore();
		const handlerA = jest.fn();
		const handlerB = jest.fn();

		test.addChangeListener(handlerA);
		test.addChangeListener(handlerB);
		test.removeChangeListener(handlerA);
		test.emitChange('props');

		expect(handlerA.mock.calls.length).toEqual(0);
		expect(handlerB.mock.calls.length).toEqual(1);
	});
});
