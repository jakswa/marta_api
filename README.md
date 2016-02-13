# marta_api

The grew a little since it was first written. In addition to serving as a proxy between MARTA's API and the browser
(because you shouldn't put your marta API key into the browser), there now exists a hook that fills in data gaps with schedule data.

## schedule data

Marta publishes its schedule data in [a zip file](http://www.itsmarta.com/developers/data-sources/general-transit-feed-specification-gtfs.aspx).
The files within conform to Google's [GTFS spec](https://developers.google.com/transit/gtfs/reference).
This git repo contains a `parse_gtfs.js` task within `/lib/tasks` that parses those files into some JSON files.
Those JSON files are used to fill gaps in the realtime data.

## parsing GTFS

I've committed the currently used JSON schedule files in `/lib/schedule`, but over time they will become outdated.
The process for updating them is:

1. extract the [zip file](http://www.itsmarta.com/developers/data-sources/general-transit-feed-specification-gtfs.aspx) to
a `/google_transit` directory (within the project root).
2. run `node lib/tasks/parse_gtfs.js` to run the task that generates the schedule files
