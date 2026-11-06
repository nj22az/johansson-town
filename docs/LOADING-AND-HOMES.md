# Loading and residential refinement

Character and street asset preloads now overlap instead of running as two serial phases. The active corridor no longer preloads the unused 1,422,240-byte canal-house exterior. Office (274,812 bytes), crystal room (508,504 bytes) and Thuan bedroom (5,195,848 bytes) load on first entry. This removes 7,401,404 bytes of GLB payload from the initial startup requirements; actual transfer sizes and timing depend on the browser cache and connection.

Room requests are cached per ID, coalesce concurrent requests, retain successful scenes across visits, and allow retry after a failed request. Movement and interactions pause while a requested room loads; the player stays in the existing scene until it is ready. A failed request leaves the player there with a retry message. Ramen still preloads because its model is also the restaurant exterior.

Thuan's bedroom entry moves from the wall-adjacent door corner to the clear east aisle at (1.45, 0, 0.3), looking west into the room. Entry resets pitch. The spawn clears the recorded furniture bounds and has at least 0.65 m clearance from the room bounds.

Residential houses gain shallow coloured awnings, planted window boxes and warm porch lamps. Details use shared district batches; all porch lamps share one InstancedMesh, with no added PointLights or shadow maps. Existing lanes and home approaches remain clear.

Validation: production build; 2 loading/spawn tests; 3 grid tests; 9 living-town tests; 3 existing navigation/construction/escort tests. Browser and iPad rendered validation remain unavailable in this environment. No measured load-time or frame-rate improvement is claimed.
