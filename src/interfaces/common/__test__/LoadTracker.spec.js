/* eslint-env jest */
import LoadTracker from '../LoadTracker';

describe('LoadTracker', () => {
	describe('Static', () => {
		test('returns the same instance for the same object', () => {
			const obj = {};

			expect(LoadTracker.for(obj)).toEqual(LoadTracker.for(obj));
		});
	});

	describe('Instance', () => {
		test('isCurrent returns truthy if no other tracker is started', () => {
			const obj =  {};
			const tracker = LoadTracker.for(obj).startTracker();

			expect(tracker.isCurrent()).toBeTruthy();
		});

		test('isCurrent returns truthy if another tracker is started', () => {
			const obj = {};
			const tracker = LoadTracker.for(obj).startTracker();

			LoadTracker.for(obj).startTracker();

			expect(tracker.isCurrent()).toBeFalsy();
		});
	});
});
