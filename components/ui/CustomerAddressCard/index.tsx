import { Address, AddressField } from "@commercelayer/react-components"

interface AddressCardProps {
  addressType: "shipping" | "billing"
  deselect: boolean
  onSelect: () => void
}

export const CustomerAddressCard: React.FC<AddressCardProps> = ({
  addressType,
  deselect,
  onSelect,
}) => {
  const dataCy =
    addressType === "billing"
      ? "customer-billing-address"
      : "customer-shipping-address"
  return (
    <Address
      data-cy={dataCy}
      className="p-3 border rounded cursor-pointer hover:border-primary shadow-sm"
      selectedClassName="border-primary"
      deselect={deselect}
      onSelect={onSelect}
      disabledClassName="opacity-50 cursor-not-allowed"
    >
      {
        <AddressField>
          {({ address }) => (
            <CustomAddress
              firstName={address.firstName}
              lastName={address.lastName}
              city={address.city}
              line1={address.line1}
              line2={address.line2}
              zipCode={address.zipCode}
              stateCode={address.stateCode}
              countryCode={address.countryCode}
              phone={address.phone}
            />
          )}
        </AddressField>
      }
    </Address>
  )
}

interface AddressProps {
  firstName: string
  lastName: string
  city: string
  line1: string
  line2: string
  zipCode: string
  stateCode: string
  countryCode: string
  phone: string
}

const CustomAddress = ({
  firstName,
  lastName,
  city,
  line1,
  line2,
  zipCode,
  stateCode,
  countryCode,
  phone,
}: AddressProps) => (
  <>
    <p className="font-bold text-md">
      {firstName} {lastName}
    </p>
    <p className="text-sm text-gray-600">
      {[line1, line2].join(", ")}
      <br />
      {zipCode} {city} - {stateCode} ({countryCode})
      <br />
      {phone}
    </p>
  </>
)