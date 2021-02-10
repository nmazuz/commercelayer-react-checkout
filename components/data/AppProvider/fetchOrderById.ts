import CLayer, {
  AddressCollection,
  Order,
  OrderCollection,
  CustomerAddressCollection,
  ShippingMethod,
} from "@commercelayer/js-sdk"

import { changeLanguage } from "components/data/i18n"

interface FetchOrderByIdProps {
  orderId: string
  accessToken: string
}

interface IsNewAddressProps {
  address: AddressCollection | null
  customerAddresses: Array<CustomerAddressCollection> | undefined
  isGuest: boolean
}

interface CheckAndSetDefaultAddressForOrderProps {
  order: OrderCollection
  customerAddresses: Array<CustomerAddressCollection>
}

interface ShipmentSelectedProps {
  shipmentId: string
  shippingMethodId: string | undefined
}

export interface FetchOrderByIdResponse {
  isGuest: boolean
  isUsingNewBillingAddress: boolean
  isUsingNewShippingAddress: boolean
  hasSameAddresses: boolean
  hasEmailAddress: boolean
  emailAddress: string
  hasShippingAddress: boolean
  shippingAddress: AddressCollection | null
  hasBillingAddress: boolean
  billingAddress: AddressCollection | null
  hasShippingMethod: boolean
  shipments: Array<ShipmentSelectedProps>
  hasPaymentMethod: boolean
  hasCustomerAddresses: boolean
}

async function isNewAddress({
  address,
  customerAddresses,
  isGuest,
}: IsNewAddressProps) {
  if (isGuest) {
    return true
  }

  const hasAddressIntoAddresses = Boolean(
    customerAddresses?.find(({ name }) => name === address?.name)
  )

  if (
    !hasAddressIntoAddresses &&
    customerAddresses &&
    customerAddresses?.length > 1 &&
    Boolean(address)
  ) {
    return true
  }
  if (
    !hasAddressIntoAddresses &&
    customerAddresses &&
    customerAddresses?.length > 1 &&
    Boolean(!address)
  ) {
    return false
  }
  return !hasAddressIntoAddresses
}

async function checkAndSetDefaultAddressForOrder({
  order,
  customerAddresses,
}: CheckAndSetDefaultAddressForOrderProps) {
  const addressId = customerAddresses[0].address()?.id
  const customerAddressId = customerAddresses[0].id

  const updateObjet: Partial<Record<string, string>> = {
    _billingAddressCloneId: addressId,
    _shippingAddressCloneId: addressId,
  }
  try {
    await order
      .update(updateObjet)
      .then(async function (orderObj: OrderCollection) {
        const billingAddressToUpdate = await orderObj.billingAddress()
        const shippingAddressToUpdate = orderObj.shippingAddress()
        if (billingAddressToUpdate) {
          billingAddressToUpdate.update({
            reference: customerAddressId,
          })
        }
        if (shippingAddressToUpdate) {
          shippingAddressToUpdate.update({
            reference: customerAddressId,
          })
        }
      })
  } catch (error) {
    console.log(error)
  }
}

export const fetchOrderById = async ({
  orderId,
  accessToken,
}: FetchOrderByIdProps): Promise<FetchOrderByIdResponse> => {
  CLayer.init({
    accessToken: accessToken,
    endpoint: `${process.env.NEXT_PUBLIC_API_DOMAIN}`,
  })

  try {
    const order = await Order.includes(
      "shipping_address",
      "billing_address",
      "shipments",
      "shipments.shipping_method",
      "payment_method",
      "customer",
      "customer.customer_addresses",
      "customer.customer_addresses.address"
    ).find(orderId)

    const customer = order.customer()
    const addresses = customer && customer.customerAddresses()
    const arrayAddresses = addresses?.toArray()

    if (
      !order.guest &&
      arrayAddresses &&
      arrayAddresses.length === 1 &&
      !order.shippingAddress() &&
      !order.billingAddress()
    ) {
      await checkAndSetDefaultAddressForOrder({
        order: order,
        customerAddresses: arrayAddresses,
      })
      // order = await Order.
    }

    const hasCustomerAddresses =
      (arrayAddresses && arrayAddresses.length >= 1) || false

    const shippingAddress = order.shippingAddress()
    const hasShippingAddress = Boolean(order.shippingAddress())

    const billingAddress = await order.billingAddress()
    const hasBillingAddress = Boolean(billingAddress)

    const isGuest = Boolean(order.guest)

    const hasEmailAddress = Boolean(order.customerEmail)
    const emailAddress = order.customerEmail

    const shippingMethodsAvailable = await ShippingMethod.all()
    const shipments = await order.shipments()?.includes("shippingMethod").load()
    const shipmentsSelected = shipments?.toArray().map((a) => {
      return {
        shipmentId: a.id,
        shippingMethodId: a.shippingMethod()?.id,
      }
    })

    const shippingMethods = shipmentsSelected?.map(
      (a: ShipmentSelectedProps) => a.shippingMethodId
    )

    let hasShippingMethod = Boolean(!shippingMethods?.includes(undefined))

    // If we billing and shipping address are set, we have only
    // a shipping method, we set it to all shipments. If all promises are successful
    // we set hasShippingMethod to true to skip the shipping step
    if (
      hasBillingAddress &&
      hasShippingAddress &&
      shippingMethods?.includes(undefined) &&
      shippingMethodsAvailable.toArray().length === 1 &&
      shipments &&
      shipments.toArray().length > 0
    ) {
      const shippingMethod = shippingMethodsAvailable.toArray()[0]
      try {
        await Promise.all(
          shipments?.toArray().map(async (shipment) => {
            return shipment.update({ shippingMethod })
          })
        )
        hasShippingMethod = true
      } catch {
        console.log("error updating shipments")
      }
    }

    const hasPaymentMethod = false // Boolean(await order.paymentMethod())

    const isUsingNewBillingAddress = await isNewAddress({
      address: billingAddress,
      customerAddresses: arrayAddresses,
      isGuest,
    })
    const isUsingNewShippingAddress = await isNewAddress({
      address: shippingAddress,
      customerAddresses: arrayAddresses,
      isGuest,
    })

    const hasSameAddresses = shippingAddress?.name === billingAddress?.name

    console.log("order.shippingAddress :>> ", order.shippingAddress())
    console.log("order.billingAddress :>> ", await order.billingAddress())
    console.log("order.shipments :>> ", order.shipments())
    console.log("order.paymentMethod :>> ", await order.paymentMethod())

    changeLanguage(order.languageCode)

    return {
      isGuest,
      hasCustomerAddresses,
      isUsingNewBillingAddress,
      isUsingNewShippingAddress,
      hasSameAddresses,
      hasEmailAddress,
      emailAddress,
      hasShippingAddress,
      shippingAddress,
      hasBillingAddress,
      billingAddress,
      hasShippingMethod,
      shipments: (shipmentsSelected as unknown) as ShipmentSelectedProps[],
      hasPaymentMethod,
    }
  } catch (e) {
    console.log(`error on retrieving order: ${e}`)
    return {
      isGuest: false,
      hasCustomerAddresses: false,
      isUsingNewBillingAddress: true,
      isUsingNewShippingAddress: true,
      hasSameAddresses: false,
      hasEmailAddress: false,
      emailAddress: "",
      hasShippingAddress: false,
      shippingAddress: null,
      hasBillingAddress: false,
      billingAddress: null,
      hasShippingMethod: false,
      shipments: [],
      hasPaymentMethod: false,
    }
  }
}
