# API Reference

All routes are under `/api`. Every route requires an authenticated session
(the `wsc_session` httpOnly cookie) unless noted, and independently checks
role/ownership server-side. Responses are `{ success: boolean, data? , message? }`.

## Auth
- `POST /api/auth/register` `{ name, email, password }`
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password` `{ email }`: returns a reset link (no email service; see README)
- `POST /api/auth/reset-password` `{ token, password }`
- `POST /api/auth/change-password` `{ currentPassword, newPassword }`
- `PATCH /api/auth/profile` `{ name }`

## Cafeterias & menu
- `GET /api/cafeterias`
- `GET /api/cafeterias/:id` · `PATCH /api/cafeterias/:id` (owner/admin) `{ status }`
- `GET /api/menu-items?cafeteriaId=&category=&search=`
- `POST /api/menu-items` (cafeteria owner) · `PATCH /api/menu-items/:id` · `DELETE /api/menu-items/:id`

## Orders
- `GET /api/orders?status=` (scoped to caller's role)
- `POST /api/orders` `{ cafeteriaId, items: [{menuItemId, quantity}], pickupTime }` (employee)
- `GET /api/orders/:id` · `PATCH /api/orders/:id` `{ status }` (guided transitions, ownership-checked)

## Food requests
- `GET /api/food-requests` · `POST /api/food-requests` (employee)
- `PATCH /api/food-requests/:id` `{ status }` (owner/admin)

## Polls
- `GET /api/polls?active=true`
- `POST /api/polls` (cafeteria owner) `{ title, options[], startDate, endDate }`
- `GET /api/polls/:id` · `PATCH /api/polls/:id` `{ active }` (owner)
- `POST /api/polls/:id/vote` `{ optionId }` (employee, one vote per poll enforced by DB constraint)

## Charging
- `GET/POST /api/charging-stations` · `PATCH/DELETE /api/charging-stations/:id`
- `GET/POST /api/chargers?stationId=` · `GET/PATCH/DELETE /api/chargers/:id`
- `GET/POST /api/reservations` `{ chargerId, date, startTime, endTime }`: server-validated overlap safety
- `PATCH /api/reservations/:id` `{ status: "CANCELLED" }`

## Notifications
- `GET /api/notifications?limit=` · `PATCH /api/notifications` (mark all read)
- `PATCH /api/notifications/:id` (mark one read)

## Admin
- `GET /api/admin/users?role=&search=&active=` · `PATCH /api/admin/users/:id` `{ active, role }`
- `GET /api/admin/stats`
- `GET /api/admin/activity?limit=`
