# More navigation

Native nested disclosures keep the remaining tools reachable without crowding primary navigation. Groups and links are computed from the feature catalog, filtered by sidebar search, and expanded for the active view. In compact mode selecting More expands the sidebar first.

All currently supported dashboard views have Angular routes. Old aliases such as CRM/passport/marketing remain represented by their actual merged destinations rather than duplicate menu entries. Custom assistant tools are supplied by the engine context and use the typed `tools/:id` route. The bridge validates custom tool IDs against actual tool navigation buttons before opening them.
