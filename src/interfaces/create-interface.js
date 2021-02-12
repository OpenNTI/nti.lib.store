const INTERFACES = Symbol('Interfaces');
const INTERFACE_ID = Symbol('Interface ID');

const { defineProperty, getOwnPropertyDescriptor, getOwnPropertyNames, getOwnPropertySymbols, hasOwnProperty: has } = Object;
const hasOwnProperty = (x, k) => has.call(x, k);

const getOwnProperties = getOwnPropertySymbols ?
	(object) => [...getOwnPropertyNames(object), ...getOwnPropertySymbols(object)] :
	getOwnPropertyNames;

const getOwnPropertyDescriptors = (object) => {
	const descs = {};

	for (let key of getOwnProperties(object)) {
		descs[key] = getOwnPropertyDescriptor(object, key);
	}

	return descs;
};

const inPrototype = (object, key) => {
	const base = Object.getPrototypeOf(object || {});
	const proto = (object || {}).prototype;

	return Boolean(proto && (hasOwnProperty(proto, key) || inPrototype(base, key)));
};

function getInterfaces (target) {
	let seen = [];
	let proto = target;

	while (proto) {
		if (proto && hasOwnProperty(proto, INTERFACES)) {
			seen.unshift(proto[INTERFACES]);
		}

		proto = Object.getPrototypeOf(proto);
	}

	//flatten and unique
	return seen.reduce((a, b) => !b ? a : [...a, ...b.filter(x => !a.includes(x))], []);
}


function hasBeenApplied (target, partial) {
	const interfaces = getInterfaces(target);

	if (!interfaces || !interfaces.length) { return false; }

	return interfaces.some((p) => {
		if (p[INTERFACE_ID] || partial[INTERFACE_ID]) {
			return p[INTERFACE_ID] === partial[INTERFACE_ID];
		}

		return p === partial;
	});
}


function initInterfaces (...args) {
	const list = getInterfaces(this.constructor);

	for (let partial of list) {
		const init = partial.initInterface;

		if (init) {
			init.apply(this, args);
		}
	}
}


function applyPartial (target, partial) {
	if (hasBeenApplied(target, partial)) {
		throw new SyntaxError('Interface: cannot use same interface more than once.');
	}

	if (inPrototype(target, 'initInterfaces') && target.prototype.initInterfaces !== initInterfaces) {
		throw new TypeError(`Interface: ${target.name} defins an initInterfaces property. This method must be defined by they interface decorator.`);
	}

	if (target[INTERFACES]) { target[INTERFACES] = [target[INTERFACES], partial]; }
	else { target[INTERFACES] = [partial]; }

	if (!target.prototype.initInterfaces) {
		target.prototype.initInterfaces = initInterfaces;
	}

	const descs = getOwnPropertyDescriptors(partial);
	const props = getOwnProperties(descs);

	for (let key of props) {
		const desc = descs[key];

		if (key === 'initInterface' || key === INTERFACE_ID) {
			continue;
		}

		if (target.prototype[key] == null || !inPrototype(target, key)) {
			defineProperty(target.prototype, key, desc);
		}
	}

	return target;
}


createInterface.ID = INTERFACE_ID;
export default function createInterface (partial) {
	if (typeof partial !== 'object') {
		throw new SyntaxError('Interface: must be an object');
	}

	return target => applyPartial(target, partial);
}
