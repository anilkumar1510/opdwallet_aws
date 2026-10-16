# Spec Delta: Dynamic Pharmacy Cart API Integration

## Purpose

Replace the static `ADJUDICATED_CART` placeholder with real cart data fetched from `localhost:8090/habit-opd/api/v1/opd_pharmacy_cart` using `booking_name` (from prescription upload) and `patient_id` (from family member record).

## ADDED Requirements

### Requirement: Cart data is fetched from the habit-opd pharmacy cart API

The system SHALL fetch cart data from `habit-opd/api/v1/opd_pharmacy_cart` using `queryId=GET_PAGE`, `filter=booking_name:{booking_name},patient_id:{patient_id}` parameters, once the prescription booking is accepted and a `booking_name` is available.

#### Scenario: Cart is fetched using booking_name and patient_id

- **WHEN** the pharmacy flow advances to the cart step (step 3) after successful prescription submission
- **THEN** the system SHALL extract the `booking_name` (e.g., "OPD-2026-00252") from the booking response and the `patient_id` from the active family member
- **AND** the system SHALL send a GET request to `localhost:8090/habit-opd/api/v1/opd_pharmacy_cart?queryId=GET_PAGE&filter=booking_name:{booking_name},patient_id:{patient_id}`
- **AND** the system SHALL wait for the API response before displaying the cart
- **AND** the cart display SHALL use the items from `response.resource[0].vendors[0].items` instead of `ADJUDICATED_CART`
- **AND** the `booking_name` field in the response SHALL be used to identify the source booking

#### Scenario: Successful cart response is mapped to CartItem interface

- **WHEN** the API returns successfully (errCode: 0) with cart data in `resource[0]`
- **THEN** for each item in `resource[0].vendors[0].items`, the system SHALL map:
  - `id` ← `serviceItemCode` or `serviceItemId`
  - `name` ← `serviceItemName`
  - `unitPrice` ← `item_discounted_price` or `selling_amount`
  - `qty` ← `quantity`
  - `isSubstitute` ← `false` (pharmacy carts do not have substitute items in this API shape)
  - `originalBrand` ← `""` (brand may be in `provider_name` if needed)
  - `med_type` information available for display (OTC vs prescription)

#### Scenario: Cart API response includes item details

- **WHEN** the API returns cart items
- **THEN** the response SHALL include for each item:
  - `serviceItemId` / `serviceItemCode` - unique item identifier
  - `serviceItemName` - medicine name with dosage form
  - `provider_name` / `provider_code` - brand/vendor information
  - `quantity` - number of units
  - `selling_amount` / `item_discounted_price` - price per unit
  - `service_mrp` - original MRP
  - `image_url` - medicine image for display
  - `prescription_req` - whether prescription is required
  - `label` - dosage form description (e.g., "strip of 15 tablets")

#### Scenario: Static cart is used as fallback when API fails

- **WHEN** the cart API request fails or returns errCode !== 0
- **THEN** the system SHALL fall back to the static `ADJUDICATED_CART` for demonstration purposes
- **AND** the system SHALL surface a visible warning indicating the cart is using demo data

### Requirement: Cart totals are calculated from API response

The system SHALL calculate cart totals from the fetched data using the `selling_amount` or `item_discounted_price` values returned by the API.

#### Scenario: Cart value is calculated from API prices

- **WHEN** items are displayed from the API response
- **THEN** the cart value SHALL be the sum of `selling_amount` × `quantity` for each item
- **AND** the wallet block and copay calculations SHALL use this computed value

### Requirement: Cart reduce/decrease is reflected locally first

When the member reduces a medicine quantity in the cart, the system SHALL immediately update the UI with the new quantity and recalculated values, then attempt to persist to the API if possible.

#### Scenario: Member reduces quantity

- **WHEN** the member clicks the decrease button for a cart item
- **THEN** the item quantity SHALL be decremented in the UI immediately
- **AND** the `pay().cartValue`, `pay().copay`, and `pay().walletBlock` SHALL be recalculated based on new quantities
- **AND** the cart list SHALL continue to show the updated quantity
- **AND** if the API endpoint for item updates becomes available, it SHALL be called with the new quantity

### Requirement: Cart remove action updates totals

When the member removes an item from the cart, the system SHALL remove it from the display and recalculate all totals.

#### Scenario: Member removes item

- **WHEN** the member clicks the remove button for a cart item
- **THEN** the item SHALL be removed from the cart display immediately
- **AND** cart totals SHALL be recalculated excluding that item
- **AND** the wallet block and copay SHALL reflect the reduced cart value

## MODIFIED Components

### PharmacyPage: `pushCart()` method

**Current behavior**: Sets `cart` signal with static `ADJUDICATED_CART`

**New behavior**:
1. Accept `bookingName` (from booking response) and `patientId` (from family member) as parameters
2. Call the cart API with filter `booking_name:{bookingName},patient_id:{patientId}`
3. Parse `response.resource[0].vendors[0].items` into `CartItem[]`
4. Update `cart` signal with fetched items
5. Set `cartPushed` to `true` to allow cart step advancement
6. On API failure, fall back to `ADJUDICATED_CART` with error indication

### PharmacyPage: `decrement()` method

**Current behavior**: Reduces quantity locally and updates cart signal

**New behavior**:
1. Find the item being reduced
2. Decrement quantity in the cart array
3. Recalculate totals (cartValue, walletBlock, copay, excess, selfPay)
4. Keep the reduced quantity in view (local state)
5. If API update endpoint is available, persist change

### PharmacyPage: `removeItem()` method

**Current behavior**: Removes item and updates cart signal

**New behavior**:
1. Filter out the item from cart array
2. Recalculate totals
3. Update cart display with remaining items

### PharmacyPage: `validate()` method

**Add validation for cart step**: When `currentStep() === 'cart'`, ensure there are items in the cart before allowing advance to payment.

## API Integration Details

### Endpoint: GET /habit-opd/api/v1/opd_pharmacy_cart

**Request**:
```
GET localhost:8090/habit-opd/api/v1/opd_pharmacy_cart?queryId=GET_PAGE&filter=booking_name:{booking_name},patient_id:{patient_id}

Headers:
- X-XSRF-TOKEN: <computed token>
- timezone: Asia/Calcutta
- current_time: <epoch millis>
- current_url: <current URL>
- host_name: localhost:8090
- cookie: session_id=<session cookie>
```

**Response Structure**:
```json
{
  "errCode": 0,
  "message": "Success",
  "count": 1,
  "resource": [
    {
      "booking_name": "OPD-2026-00252",
      "patient_id": "2c731f61-6948-11f1-ae5b-d65a0079d2d6-68",
      "vendors": [
        {
          "items": [
            {
              "serviceItemCode": "111998",
              "serviceItemName": "Zincovit Tablet...",
              "provider_name": "1MG",
              "selling_amount": 88.23,
              "quantity": 1,
              "prescription_req": false,
              "label": "strip of 15 tablets"
            }
          ]
        }
      ]
    }
  ]
}
```

### CartItem Mapping Function

```typescript
function mapCartItem(apiItem: ApiCartItem): CartItem {
  return {
    id: apiItem.serviceItemCode ?? apiItem.serviceItemId ?? '',
    name: apiItem.serviceItemName?.trim() ?? 'Medicine',
    unitPrice: apiItem.selling_amount ?? apiItem.item_discounted_price ?? 0,
    qty: apiItem.quantity ?? 0,
    isSubstitute: false,
    originalBrand: apiItem.provider_name ?? '',
  };
}
```

## State Changes

### New signals needed:
- `cartLoading: boolean` - indicates when API is fetching cart data
- `cartError: string | null` - error message if cart fetch fails

### Modified behavior:
- `pushCart()` called after booking acceptance → fetches from API
- Cart displays items from API response
- Totals computed from actual prices, not static values

## Testing Considerations

### Unit tests to add:
1. Cart API fetch with valid booking_name and patient_id
2. Cart fall-back when API returns errCode !== 0
3. Cart mapping from API response to CartItem interface
4. Quantity reduction updates local totals correctly
5. Item removal updates local totals correctly
6. Empty cart state after all items removed

### E2E test scenarios:
1. Happy path: upload prescription → booking accepted → cart loaded from API
2. Fallback: API unavailable → static demo cart displayed with warning
3. Reduce item: quantity decreases → totals recalculate
4. Remove item: item disappears → totals recalculate

## Backward Compatibility

The static `ADJUDICATED_CART` and corresponding logic remain in the codebase as a fallback. If the cart API fails at any point, the system gracefully falls back to demonstrating the flow with static data. This ensures the pharmacy journey remains functional even when the backend API is temporarily unavailable.