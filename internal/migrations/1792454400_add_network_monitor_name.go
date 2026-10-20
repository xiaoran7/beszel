package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Adds an optional display name to network monitors.
//
// The UI previously had only the raw target (an IP or hostname) to label a
// probe with, so a dashboard row read "218.76.0.1" instead of "湖南电信".
// The field is optional: monitors without a name keep rendering their target,
// and the table/search/chart code all read through one helper.
func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("network_monitors")
		if err != nil {
			return err
		}
		// Migrations must be idempotent: a partially applied collection save
		// must not fail the whole run on the next boot.
		if collection.Fields.GetByName("name") != nil {
			return nil
		}
		collection.Fields.Add(&core.TextField{
			Name: "name",
			Help: "Optional display label, e.g. 湖南电信. Falls back to the target when empty.",
			Max:  64,
		})
		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("network_monitors")
		if err != nil {
			return err
		}
		collection.Fields.RemoveByName("name")
		return app.Save(collection)
	})
}
