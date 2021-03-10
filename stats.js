/*
 * prometheus-compatible stats store
 *
 * Copyright (C) 2021 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

module.exports = {
    Stats: Stats,
    // Stat: Stat,
};

function Stats( ) {
    this.stats = {};    // tracked stats indexed by tagged name
    this.names = {};    // defined stat names
    this.types = {};    // defined stat types
    this.helps = {};    // defined help descriptions

    this.reset = function() { for (var k in this.stats) this.stats[k].reset() }
    this.delete = function(name, tags) { delete this.stats[this._getName(name, tags)] }

    this.define = function(name, type, help) {
        this.names[name] = name;
        this.types[name] = type || '';
        this.helps[name] = help || '';
    }
    this.count = function(name, tags, n) {
        if (n === undefined && typeof this._getValue(name, tags) !== 'number') n = 1;
        this._getStat(name, tags, n).count(this._getValue(tags, n));
    }
    this.get = function(name, tags) {
        return this._getStat(name, tags, 1);
    }
    this.set = function(name, tags, n) {
        this._getStat(name, tags, n).set(this._getValue(tags, n));
    }
    this.min = function(name, tags, n) {
        this._getStat(name, tags, n).min(this._getValue(tags, n));
    }
    this.max = function(name, tags, n) {
        this._getStat(name, tags, n).max(this._getValue(tags, n));
    }
    this.avg = function(name, tags, n) {
        this._getStat(name, tags, n).avg(this._getValue(tags, n));
    }

    this.report = function( ) {
        var self = this;
        var keys = Object.keys(this.stats).sort();
        var stats = keys.map(function(key) { return self.stats[key] });
        var described = {};

        var output = '';
        for (var i = 0; i < stats.length; i++) {
            var name = stats[i].name;
            var type = this.types[name];
            var report = stats[i].report();
            if (!described[name] && report) {
                if (output) output += '\n';
                this.types[name] && (output += ('# TYPE ' + name + ' ' + this.types[name] + '\n'));
                this.helps[name] && (output += ('# HELP ' + name + ' ' + this.helps[name] + '\n'));
                described[stats[i].name] = true;
            }
            output += report;
            // most stats are transient and last only over the polling interval
            if (this.types[name] !== 'counter') stats[i].reset();
        }
        return output;
    }

    this._getStat = function(name, tags, n) {
        var statName = this._getName(name, tags);
        return this.stats[statName] || (this.stats[statName] = new Stat(name, statName));
    }
    this._getName = function(name, tags) {
        var label;
        return (typeof tags === 'number') ? name
            : (typeof tags === 'string' && tags) ? name + '{' + tags + '}'
            : (typeof tags === 'object' && (label = keyvals(tags))) ? name + '{' + label + '}'
            : name;
    }
    this._getValue = function(tags, n) {
        return n !== undefined ? n : tags;
    }
}


function Stat( name, statName, help, type ) {
    this.name = name;           // stat canonical name "metric"
    this.statName = statName;   // stat specific name "metric{k1=v1,k2=v2}"

    this.value = 0;
    this.valueCount = 0;
}

// aka current()
Stat.prototype.set = function set( v ) {
    if (v >= -Infinity) { this.valueCount += 1; this.value = +v }
}
Stat.prototype.reset = function reset( ) {
    this.value = 0;
    this.valueCount = 0;
}
Stat.prototype.count = function count( n ) {
    if (n >= -Infinity) { this.valueCount += 1; this.value += n }
}
// aka least()
Stat.prototype.min = function min( v ) {
    if (v >= -Infinity) { this.valueCount += 1; if (v < this.value || this.valueCount === 1) this.value = +v }
}
// aka most()
Stat.prototype.max = function min( v ) {
    if (v >= -Infinity) { this.valueCount += 1; if (v > this.value || this.valueCount === 1) this.value = +v }
}
// aka mean
Stat.prototype.avg = function avg( v ) {
    if (v >= -Infinity) { this.valueCount += 1;
        this.value = this.valueCount === 1 ? +v : (this.value * (this.valueCount - 1) + +v) / this.valueCount }
}
Stat.prototype.report = function report( ) {
    var output = '';
    if (this.valueCount > 0) {
        output += this.statName + ' ' + this.value + '\n';
    }
    return output;
}


function keyvals( obj ) {
    var keys = Object.keys(obj), tags = keys.length ? keys[0] + '=' + obj[keys[0]] : '';
    for (var i = 1; i < keys.length; i++) tags += ',' + keys[i] + '=' + obj[keys[i]];
    return tags;
}
