qstats
======

Simple Prometheus and `prom-client` compatible application metrics store.  Simple, fast,
very small, with minimal hand-holding or overhead.  Compatible with `prom-pushgateway`.


Quickstart
----------

Metrics are tabulated by annotated name, and persist until reported (except counters, which
retain their counts).  Name annotations are optional.  Type and Help defintions are
optional.

    var qstats = require('qstats');
    var metrics = new qstats.Stats();

    metrics.define('bar', 'gauge', 'test value');
    metrics.min('bar', {color: blue}, 7);
    metrics.min('bar', 'color=blue', 3);
    metrics.report();
    // => "# TYPE bar gauge" +
    //    "# HELP bar test value" +
    //    "bar{color=blue} 3\n" +


Api
---

### metrics = qstats.Metrics( )

Create a new metrics store.  Each store is independent of the others.

### metrics.reset( )

Reset all metrics values to their initial undefined unreported state.

### metrics.delete( name, tags )

Delete the metrics stored by the annotated name.  The `name` must be an ascii string without
whitespace, the optional `tags` can be a string with comma-separated name=value pairs or a
name-value hash.

    metrics.delete('foo', 'a=2');
    // remove `foo`, do not report it

### metrics.report( )

Report the values of all stored metrics.  Metrics that have not been updated since last
reset are omitted.  Returns a Prometheus metrics report string.
Most metrics are transient and are automatically cleared on report(), excpet `counter`
types that must be cleared explicitly.

    metrics.max('hit', {x:1, y:2}, 99);
    metrics.report()
    // => "hit{x=1,y=2} 99\n" -- reported value

    metrics.max('hit', {x:1, y:2}, 11);
    metrics.report();
    // => "hit{x=1,y=2} 11\n" -- report() reset the old max

    metrics.report()
    // => "" -- no updates since last time, nothing to report

Metrics Store
-------------

### metrics.define( name, type, help )

Define the `# TYPE` and `# HELP` information associated with metrics that have `name`.
Types are `gauge`, `counter`.  Help strings are free-form but must not contain newlines.

### metrics.undefine( name )

Forget the definition of metric `name`, report the metric bare without Type or Help.

### metrics.set( name, [tags,] value )

Set the reported value of the metric.  Non-numeric values are ignored.  The metric is stored
under the annotated name generated from `name` and the key-value pairs in `tags`.

### metrics.get( name, [tags] )

Return the current value of the metric.

### metrics.count( name, [tags,] [increment] )

Increase the current value of the metric by `increment`.  If `increment` not provided, adds
`1` one to the current value.

### metrics.min( name, [tags,], newValue )

Set the metric value to the lesser of `newValue` or the current value

### metrics.max( name, [tags,], newValue )

Set the metric value to the greater of `newValue` or the current value.

### metrics.avg( name, [tags,], newValue )

Average in `newValue` into the current value.  Computes the arithmetic mean (the non-weighted average)
of all values since the last reset.


Changelog
---------

- 0.1.0 - initial version


Related Work
------------

- `prom-pushgateway`
- `prom-client`
