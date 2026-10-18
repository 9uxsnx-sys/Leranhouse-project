## Error Type
Console TypeError

## Error Message
offers.data.map is not a function


    at PaymentsOffersPage (components\Dashboard\Pages\Payments\PaymentsOffersPage.tsx:100:24)

## Code Frame
   98 |
   99 |         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
> 100 |           {offers.data.map((offer: any) => (
      |                        ^
  101 |             <div key={offer.id} className="bg-white p-4 rounded-xl border border-gray-100...
  102 |               {editingOfferId === String(offer.id) ? (
  103 |                 <EditOfferForm

Next.js version: 16.2.6 (Webpack)
