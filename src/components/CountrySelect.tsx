import { Combobox } from '@headlessui/react'
import { useState } from 'react'
import { getNames } from 'country-list'

const countries = getNames()

export default function CountrySelect({ form, setForm }: any) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredCountries = query === ''
    ? countries
    : countries.filter((country) =>
        country.toLowerCase().includes(query.toLowerCase())
      )

  return (
    <div className="relative">
      <label htmlFor="country" className="block mb-2 font-medium">
        Country / Region
      </label>

      <Combobox
        value={form.country}
        onChange={(value) => {
          setForm((prev: any) => ({ ...prev, country: value }))
          setIsOpen(false)
        }}
      >
        <div className="relative">
          <Combobox.Input
            id="country"
            name="country"
            required
autoComplete="new-password"
  onBlur={() => setIsOpen(false)}

            className="w-full border border-gray-600 rounded px-3 py-2 bg-transparent text-sm"
            displayValue={(country: string) => country}
            onChange={(event) => {
              setQuery(event.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
          />

          {isOpen && (
            <Combobox.Options
              static
              className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-400 bg-white text-sm shadow-md"
            >
              {filteredCountries.length === 0 ? (
                <div className="px-4 py-2 text-gray-500">No results</div>
              ) : (
                filteredCountries.map((country) => (
                  <Combobox.Option
                    key={country}
                    value={country}
                    className={({ active }) =>
                      `px-4 py-2 cursor-pointer ${
                        active ? 'bg-gray-100 text-black' : 'text-black'
                      }`
                    }
                  >
                    {country}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          )}
        </div>
      </Combobox>
    </div>
  )
}
