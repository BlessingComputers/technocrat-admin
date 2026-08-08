# Order Checkout — Frontend Integration Guide

How to take a customer from "items in cart" to "order created" against
`POST /api/v1/orders` (the online-payment order flow).

---

## TL;DR

1. Items live in a **cart keyed by `sessionId`**, not by the logged-in user.
2. Read that `sessionId` from `GET /api/v1/cart` → `data.sessionId`.
3. Send it as **`cartSessionId`** in the `POST /api/v1/orders` body.
4. For delivery, also send real `shippingAddressId` + `billingAddressId`.
   For pickup, send neither.

The single most important change: **always include `cartSessionId` in the checkout body.**
If you don't, checkout may look at the wrong cart and fail with `"Your cart is empty."`

---

## Why `cartSessionId` is required

The cart is stored in the DB row `shopping_carts` and is identified by its
**`sessionId`** (unique). Every add/remove/read operates on that session's cart.

Checkout now finds the cart the same way — by `sessionId`. The customer's JWT tells
us *who* is ordering, but not *which cart* to use (a customer can have more than one
cart across sessions/devices). So you must tell us the session.

> The `sessionId` is also stored in an **httpOnly** cookie named `cartSessionId`.
> Because it's httpOnly, **JavaScript cannot read it** (`document.cookie` won't show it).
> That's why you must get the value from the `GET /api/v1/cart` response body instead.

---

## The full flow

### 1. Add items to the cart

```
POST /api/v1/cart/items
{ "variantId": "<uuid>", "quantity": 2 }
```

The response includes the cart, including its `sessionId`. Keep it, or re-fetch below.

### 2. Read the cart (and grab the sessionId)

```
GET /api/v1/cart
```

```json
{
  "success": true,
  "data": {
    "sessionId": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",   // ← use this
    "items": [ /* ... */ ],
    "subtotalAmount": 12000,
    "estimatedTotal": 12000,
    "expiresAt": "2026-08-11T10:00:00.000Z"
  }
}
```

### 3. (If delivering) get the customer's addresses

```
GET /api/v1/addresses
```

Pick the IDs the user chose for shipping and billing.

### 4. Create the order

**Delivery (`DISPATCH`):**

```
POST /api/v1/orders
{
  "cartSessionId": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
  "deliveryMethod": "DISPATCH",
  "shippingAddressId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "billingAddressId":  "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "notes": "Please call on arrival."         // optional
}
```

**Pickup (`SELF_PICKUP`):**

```
POST /api/v1/orders
{
  "cartSessionId": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
  "deliveryMethod": "SELF_PICKUP"
}
```

**Success → `201`** with the full order (id, `orderNumber`, items, totals, status).
The order is created as **PENDING / payment PENDING**, and the cart is emptied.
Proceed to your payment step next.

---

## Field reference (`POST /api/v1/orders` body)

| Field | Required? | Notes |
|---|---|---|
| `cartSessionId` | **Yes** (in practice) | From `GET /api/v1/cart` → `data.sessionId`. Falls back to the `cartSessionId` cookie only on same-site requests — don't rely on that. |
| `deliveryMethod` | No (defaults `DISPATCH`) | `"DISPATCH"` or `"SELF_PICKUP"`. |
| `shippingAddressId` | Only for `DISPATCH` | Real address owned by the customer. **Must NOT be sent for `SELF_PICKUP`.** |
| `billingAddressId` | Only for `DISPATCH` | Same rules as shipping. |
| `couponCode` | No | Send **only** a real, active code. **Omit entirely** if there's no coupon — do not send `"string"` or `""`. |
| `notes` | No | Free text, ≤ 1000 chars. |

Rules enforced server-side:
- `DISPATCH` without an address → rejected.
- `SELF_PICKUP` **with** an address → rejected (remove the address fields).
- Address must belong to the authenticated customer.

---

## Error reference (all come back on failure)

| Message | Cause | Fix |
|---|---|---|
| `Your cart is empty. Add items before placing an order.` | `cartSessionId` missing/blank, or that cart has no items. | Send the `sessionId` from `GET /api/v1/cart`; make sure items were added to that session. |
| `A shipping address is required for delivery orders.` | `DISPATCH` with no `shippingAddressId`. | Send shipping + billing IDs, or switch to `SELF_PICKUP`. |
| `Shipping address is not needed for self-pickup orders.` | `SELF_PICKUP` with an address. | Remove the address fields. |
| `Shipping address not found.` | Address ID isn't one of the customer's. | Use an ID from `GET /api/v1/addresses`. |
| `Coupon '…' is invalid or expired.` | Bad/placeholder coupon (e.g. `"string"`). | Omit `couponCode` unless there's a real one. |
| `This cart does not belong to your account.` | The cart's `sessionId` is owned by a different customer. | Use the current customer's cart `sessionId`. |

---

## Cart persistence & multi-device (important)

- The cart (row + items) is **persisted in the database** and survives logout/login;
  it lives until `expiresAt` (30 days for logged-in customers).
- A cart becomes reachable across **devices** only once it is linked to the customer
  (its `customerId` column is set). That happens automatically when a **logged-in**
  user interacts with the cart.
- **Guest carts** (items added while logged out) are device-local. To carry them into
  the account on login, call **`POST /api/v1/cart/merge`** with the guest `sessionId`
  right after login. Otherwise those guest items won't appear on other devices.
- On any device, the reliable pattern is the same: `GET /api/v1/cart` → read
  `data.sessionId` → pass it to checkout.

---

## Don't confuse the two checkout endpoints

| Endpoint | Use it for |
|---|---|
| `POST /api/v1/orders` | The standard order/online-payment flow described here. |
| `POST /api/v1/checkout` | The **manual** payment flow (bank transfer + proof-of-payment upload). Also takes `cartSessionId`. |

Both locate the cart by `cartSessionId` — so the "read `sessionId` from `GET /api/v1/cart`
and pass it" rule applies to both.
