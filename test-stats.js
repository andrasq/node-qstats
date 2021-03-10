/*
 * 2021-03-09 - AR.
 *
 * Copyright (C) 2021 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var qstats = require('./');
var Metrics = qstats.Metrics;

module.exports = {
    beforeEach: function(done) {
        this.uut = new Metrics();
        done();
    },

    'exports': {
        'expected classes': function(t) {
            t.equal(typeof qstats.Metrics, 'function');
            // t.equal(typeof stats.Metric, 'function');
            t.done();
        },
    },

    'Metrics': {
        'constructor': {
            'constructor creates a Metrics store': function(t) {
                t.ok(new Metrics() instanceof Metrics);
                t.done();
            },
        },
        'define': {
            'sets type and help': function(t) {
                this.uut.define('stat-name', 'stat-type', 'stat-help');
                t.contains(this.uut.defs['stat-name'], { type: 'stat-type', help: 'stat-help' });
                this.uut.define('stat-name2');
                t.strictContains(this.uut.defs['stat-name2'], { type: '', help: '' });
                t.done();
            },
            'does not alter value': function(t) {
                this.uut.set('x', 123);
                this.uut.define('x', 'gauge', 'test value');
                t.equal(this.uut._getMetric('x').value, 123);
                t.done();
            },
        },
        'undefine': {
            'unsets type and help': function(t) {
                this.uut.define('stat-name', 'stat-type', 'stat-help');
                this.uut.undefine('stat-name');
                t.strictEqual(this.uut.defs['stat-name'], undefined);
                t.done();
            },
        },
        'set': {
            'sets the value': function(t) {
                this.uut.set('x', 99);
                this.uut.set('x', 1);
                t.equal(this.uut._getMetric('x').value, 1);
                t.done();
            },
            'sets the annotated value': function(t) {
                this.uut.set('x', 'a=1,b=2', 99);
                this.uut.set('x', 'a=1', 2);
                this.uut.set('x', 'a=2', 3);
                t.equal(this.uut._getMetric('x', {a:1}).value, 2);
                t.equal(this.uut._getMetric('x', {a:2}).value, 3);
                t.equal(this.uut._getMetric('x', {b:2}).value, 0);
                t.done();
            },
            'ignores a non-numeric count': function(t) {
                this.uut.set('x', '', 1);
                this.uut.set('x', '', 'ZZ');
                t.equal(this.uut._getMetric('x', '').value, 1);
                t.done();
            },
        },
        'get': {
            'retrieves the current value': function(t) {
                t.strictEqual(this.uut.get('x'), undefined);
                this.uut.avg('x', 1);
                t.strictEqual(this.uut.get('x'), 1);
                this.uut.avg('x', 2);
                t.equal(this.uut.get('x'), 1.5);
                this.uut.avg('x', 3);
                t.equal(this.uut.get('x'), 2);
                this.uut.avg('x', 4);
                t.equal(this.uut.get('x'), 2.5);
                this.uut.avg('x', 5);
                t.equal(this.uut.get('x'), 3);
                t.done();
            },
        },
        'count': {
            'defaults to 0': function(t) {
                t.equal(this.uut._getMetric('xyz').value, 0);
                this.uut.count('xyz');
                t.equal(this.uut._getMetric('xyz').value, 1);
                t.done();
            },
            'adds to the count': function(t) {
                this.uut.define('x');
                this.uut.count('x', 1);
                t.equal(this.uut._getMetric('x').value, 1);
                this.uut.count('x', 2);
                t.equal(this.uut._getMetric('x').value, 3);
                this.uut.count('x', -4);
                t.equal(this.uut._getMetric('x').value, -1);
                t.done();
            },
            'adds 1 by default': function(t) {
                this.uut.set('x', 123);
                this.uut.count('x');
                this.uut.count('x');
                t.equal(this.uut._getMetric('x').value, 125);
                t.done();
            },
            'resets to 0': function(t) {
                this.uut.count('x');
                this.uut.reset();
                t.equal(this.uut._getMetric('x').value, 0);
                t.done();
            },
            'ignores a non-numeric count': function(t) {
                this.uut.set('x', '', 1);
                this.uut.count('x', '', 'ZZ');
                t.equal(this.uut._getMetric('x', '').value, 1);
                t.done();
            },
        },
        'min': {
            'tracks the lowest seen value': function(t) {
                this.uut.min('x', 5);
                this.uut.min('x', 6);
                this.uut.min('x', 3);
                this.uut.min('x', 4);
                t.equal(this.uut._getMetric('x').value, 3);

                this.uut.reset();
                this.uut.min('x', 99);
                t.equal(this.uut._getMetric('x').value, 99);

                t.done();
            },
            'ignores a non-numeric count': function(t) {
                this.uut.min('x', '', 1);
                this.uut.min('x', '', 'ZZ');
                t.equal(this.uut._getMetric('x', '').value, 1);
                t.done();
            },
        },
        'max': {
            'tracks the lowest seen value': function(t) {
                this.uut.max('x', 5);
                this.uut.max('x', 6);
                this.uut.max('x', 3);
                this.uut.max('x', 4);
                t.equal(this.uut._getMetric('x').value, 6);

                this.uut.reset();
                this.uut.min('x', 99);
                t.equal(this.uut._getMetric('x').value, 99);

                t.done();
            },
            'ignores a non-numeric count': function(t) {
                this.uut.max('x', '', 1);
                this.uut.max('x', '', 'ZZ');
                t.equal(this.uut._getMetric('x', '').value, 1);
                t.done();
            },
        },
        'avg': {
            'tracks the average of the seen values': function(t) {
                this.uut.avg('x', 5);
                this.uut.avg('x', 6);
                this.uut.avg('x', 3);
                this.uut.avg('x', 4);
                t.equal(this.uut._getMetric('x').value, 4.5);

                this.uut.reset();
                this.uut.avg('x', 99);
                t.equal(this.uut._getMetric('x').value, 99);

                t.done();
            },
            'ignores a non-numeric count': function(t) {
                this.uut.avg('x', '', 1);
                this.uut.avg('x', '', 'ZZ');
                t.equal(this.uut._getMetric('x', '').value, 1);
                t.done();
            },
        },
        'reset': {
            'runs reset on stats': function(t) {
                this.uut.set('x', 1);
                this.uut.set('y', 2);
                this.uut.reset();
                t.equal(this.uut._getMetric('x').value, 0);
                t.equal(this.uut._getMetric('y').value, 0);
                t.done();
            },
        },
        'delete': {
            'removes a stat': function(t) {
                this.uut.set('x', 1);
                this.uut.set('x', {a:1}, 2);
                this.uut.set('x', {a:2}, 3);
                this.uut.delete('x', {a:1});
                t.deepEqual(Object.keys(this.uut.stats).sort(), ['x', 'x{a=2}']);
                t.done();
            },
        },
        'report': {
            'reports values of all stats': function(t) {
                this.uut.set('a', 1);
                this.uut.set('b', 2);
                this.uut.set('c', 3);
                this.uut._getMetric('c').reset();
                this.uut.define('b', 'gauge', 'test value');
                t.equal(this.uut.report(), 'a 1\n\n# TYPE b gauge\n# HELP b test value\nb 2\n');
                t.done();
            },
            'resets values': function(t) {
                this.uut.set('x', 1);
                this.uut.define('x', 'gauge');
                this.uut.report();
                t.equal(this.uut._getMetric('x').value, 0);
                t.done();
            },
            'does not reset a count': function(t) {
                this.uut.set('x', 1);
                this.uut.define('x', 'counter');
                this.uut.report();
                t.equal(this.uut._getMetric('x').value, 1);
                t.done();
            },
        },
    },

    'helpers': {
        'getMetric': {
            'returns a found stat': function(t) {
                this.uut.define('x');
                this.uut.set('x', 123);
                t.equal(this.uut._getMetric('x', 1).value, 123);
                t.equal(this.uut._getMetric('x', '', 2).value, 123);
                t.done();
            },
            'returns a new stat if not found': function(t) {
                var a = this.uut._getMetric('x');
                var b = this.uut._getMetric('x');
                t.equal(a, b);
                t.equal(this.uut._getMetric('x'), a);
                t.done();
            },
        },
        'getName': {
            'returns the name': function(t) {
                t.equal(this.uut._getName('x'), 'x');
                t.equal(this.uut._getName('x', 2), 'x');
                t.done();
            },
            'returns the tagged name': function(t) {
                t.equal(this.uut._getName('x', ''), 'x');
                t.equal(this.uut._getName('x', {}), 'x');
                t.equal(this.uut._getName('x', 'a=1,b=2'), 'x{a=1,b=2}');
                t.equal(this.uut._getName('x', {a:1, b:2}), 'x{a=1,b=2}');
                t.done();
            },
            'returns the name if unsupported tag': function(t) {
                t.equal(this.uut._getName('x', 1234), 'x');
                t.equal(this.uut._getName('x', new Date()), 'x');
                t.done();
            },
        },
        'getValue': {
            'returns the number': function(t) {
                t.strictEqual(this.uut._getValue(1), 1);
                t.strictEqual(this.uut._getValue('a=1,b=2', 2), 2);
                t.strictEqual(this.uut._getValue(-Infinity), -Infinity);
                t.done();
            },
        },
    },
}
