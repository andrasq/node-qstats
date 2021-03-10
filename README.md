prom-stats
==========

Simple set of nodejs and custom stats store to report to Prometheus.
Compatible with `prom-pushgateway`.


Quickstart
----------

### To report default stats:

### To report custom stats:

    metrics = new PromStats.Metrics();
    metrics.set('my-stat-a', 1.1);
    metrics.set('my-stat-b', 2);
    metrics.report();

### To report prom-client stats:



Related Work
------------

- `prom-pushgateway`
- `prom-client`
