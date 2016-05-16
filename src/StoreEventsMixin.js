import Logger from 'nti-util-logger';

const logger = Logger.get('nti:store:mixins:StoreEvents');

const getHandlers = Symbol('HandlersGetter');
const getStore = Symbol('StoreGetter');
const onStoreChange = Symbol('StoreChangedEventHandlerMapper');

const handlerMapKey = 'backingStoreEventHandlers';

export default {

	registerStoreEventHandler (eventId, handlerId) {
		if (!this.hasOwnProperty(handlerMapKey)) {
			this[handlerMapKey] = Object.create(this[getHandlers]({}) || {});
		}

		if (!eventId) {
			logger.error('eventId is %o. Are you using an undefined constant?', eventId);
		}

		let map = this[getHandlers]();

		if (map[eventId]) {
			let handlers = makeSet(map[eventId]);
			handlers.add(handlerId);
			map[eventId] = handlers;
		}
		else {
			map[eventId] = handlerId;
		}
	},


	registerStoreEventHandlers (eventIdToHandlerMap) {
		let eventIds = Object.getOwnPropertyNames(eventIdToHandlerMap)
			.concat(Object.getOwnPropertySymbols(eventIdToHandlerMap));

		for (let eventId of eventIds) {
			this.registerStoreEventHandler(eventId, eventIdToHandlerMap[eventId]);
		}
	},


	componentWillMount () {
		this[getStore] = getKey.bind(this, 'backingStore');
		this[getHandlers] = getKey.bind(this, handlerMapKey);
		this[onStoreChange] = onStoreChangeImpl.bind(this);
	},

	componentDidMount () {
		let store = this[getStore]();
		if (store) {
			store.addChangeListener(this[onStoreChange]);
		}
	},

	componentWillUnmount () {
		let store = this[getStore]();
		if (store) {
			store.removeChangeListener(this[onStoreChange]);
		}
	}
};


function makeSet (item) {
	return (!item || item instanceof Set) ? item : new Set([item]);
}

function getName () {
	try {
		return this.constructor.displayName;
	} catch (e) {
		return this;
	}
}


function getKey (key, fallbackAndDontWarn) {
	let componentName = getName.call(this);
	return this[key] || fallbackAndDontWarn || logger.error('%s property not set in: %s', key, componentName);
}


function onStoreChangeImpl (event) {
	if (typeof event === 'string') {
		logger.error('Wrapping deprecated string event into object: %s', event);
		event = {type: event};
	}

	if (!event || event.type == null) {
		logger.error('Bad Event: %o', event);
		return;
	}
	let componentName = getName.call(this);
	let handlers = this[getHandlers]() || {};
	let handlerSet = makeSet(handlers[event.type] || handlers.default);
	if (!handlerSet) {
		// logger.debug('Event %s does not have a handler in component: %s', event.type, componentName);
		return;
	}
	for (let handler of handlerSet) {
		if (typeof handler !== 'function') {
			if (!this[handler]) {
				logger.debug('Event Handler %s does not exist in component: %s', handler, componentName);
				return;
			}
			handler = this[handler];
		}
		handler.call(this, event);
	}
}
