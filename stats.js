/*
 * prom-stats -- prometheus-compatible metrics store
 *
 * Copyright (C) 2021 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

module.exports = {
    Metrics: Metrics,
    // Metric: Metric,
};

function Metrics( ) {
    this.stats = {};    // tracked stats indexed by annotated name
    this.defs = {};     // metric Type and Help indexed by name
}

/*
 * metrics store methods
 */
Metrics.prototype.reset = function reset() {
    for (var k in this.stats) this.stats[k].reset();
}
Metrics.prototype.delete = function delete_(name, tags) {
    delete this.stats[this._getName(name, tags)];
}
var _blankDef = { name: '', type: '', help: '' };
Metrics.prototype.define = function define(name, type, help) {
    this.defs[name] = { name: name, type: type || '', help: help || '' };
}
Metrics.prototype.undefine = function undefine(name) {
    delete this.defs[name];
}

/*
 * metric update methods
 */
Metrics.prototype.set = function set(name, tags, n) {
    this._getMetric(name, tags, n).set(this._getValue(tags, n));
}
Metrics.prototype.get = function get(name, tags) {
    var stats = this.stats[this._getName(name, tags)];
    return stats ? stats.value : undefined;
}
Metrics.prototype.count = function count(name, tags, n) {
    if (n === undefined && typeof this._getValue(name, tags) !== 'number') n = 1;
    this._getMetric(name, tags, n).count(this._getValue(tags, n));
}
Metrics.prototype.min = function min(name, tags, n) {
    this._getMetric(name, tags, n).min(this._getValue(tags, n));
}
Metrics.prototype.max = function max(name, tags, n) {
    this._getMetric(name, tags, n).max(this._getValue(tags, n));
}
Metrics.prototype.avg = function avg(name, tags, n) {
    this._getMetric(name, tags, n).avg(this._getValue(tags, n));
}
Metrics.prototype.report = function report( ) {
    var self = this;
    var keys = Object.keys(this.stats).sort();
    var stats = keys.map(function(key) { return self.stats[key] });
    var described = {};

    var output = '';
    for (var i = 0; i < stats.length; i++) {
        var name = stats[i].metricName;
        var defs = this.defs[name] || _blankDef;
        var report = stats[i].report();
        if (!described[name] && report) {
            if (output) output += '\n';
            defs.type && (output += ('# TYPE ' + name + ' ' + defs.type + '\n'));
            defs.help && (output += ('# HELP ' + name + ' ' + defs.help + '\n'));
            described[stats[i].metricName] = true;
        }
        output += report;
        // most stats are transient and last only over the polling interval
        if (defs.type !== 'counter') stats[i].reset();
    }
    return output;
}
Metrics.prototype._getMetric = function _getMetric(name, tags, n) {
    // TODO: allow or disallow non-defined metrics?
    var statName = this._getName(name, tags);
    var defs = this.defs[name] || _blankDef;
    return this.stats[statName] || (this.stats[statName] = new Metric(name, statName, defs.type));
}
Metrics.prototype._getName = function _getName(name, tags) {
    var label;
    return (typeof tags === 'number') ? name
        : (typeof tags === 'string' && tags) ? name + '{' + tags + '}'
        : (typeof tags === 'object' && (label = keyvals(tags))) ? name + '{' + label + '}'
        : name;
}
Metrics.prototype._getValue = function _getValue(tags, n) {
    return n !== undefined ? n : tags;
}

Metrics.prototype = toStruct(Metrics.prototype)


function Metric( name, statName, help, type ) {
    this.metricName = name;     // stat canonical name "metric"
    this.statName = statName;   // stat specific name "metric{k1=v1,k2=v2}"
    this.metricType = type;     // type to support non-orthogonal stats

    this.value = 0;
    this.valueCount = 0;
}

// aka current()
Metric.prototype.set = function set( v ) {
    if (v >= -Infinity) { this.valueCount += 1; this.value = +v }
}
Metric.prototype.reset = function reset( ) {
    this.value = this.valueCount = 0;
}
Metric.prototype.count = function count( n ) {
    if (n >= -Infinity) { this.valueCount += 1; this.value += n }
}
// aka least()
Metric.prototype.min = function min( v ) {
    if (v >= -Infinity) { this.valueCount += 1; if (v < this.value || this.valueCount === 1) this.value = +v }
}
// aka most()
Metric.prototype.max = function min( v ) {
    if (v >= -Infinity) { this.valueCount += 1; if (v > this.value || this.valueCount === 1) this.value = +v }
}
// aka mean
Metric.prototype.avg = function avg( v ) {
    if (v >= -Infinity) { this.valueCount += 1;
        this.value = this.valueCount === 1 ? +v : (this.value * (this.valueCount - 1) + +v) / this.valueCount }
}
Metric.prototype.report = function report( ) {
    return (this.valueCount > 0) ? this.statName + ' ' + this.value + '\n' : '';
}
Metric.prototype = toStruct(Metric.prototype)


function toStruct(hash) { return toStruct.prototype = hash }

function keyvals( obj ) {
    var keys = Object.keys(obj), tags = keys.length ? keys[0] + '=' + obj[keys[0]] : '';
    for (var i = 1; i < keys.length; i++) tags += ',' + keys[i] + '=' + obj[keys[i]];
    return tags;
}
