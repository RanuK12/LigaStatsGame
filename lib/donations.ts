// Donation config. Static-export friendly: NEXT_PUBLIC_* vars are inlined at build,
// payments use static links (MercadoPago link/alias + Stripe Payment Links) — no server.
// Fill these in .env.local (see .env.local.example). Empty values disable the buttons.

export interface StripeTier {
  usd: number
  link: string
}

export const mpAlias: string = process.env.NEXT_PUBLIC_MP_ALIAS || ''
export const mpLink: string = process.env.NEXT_PUBLIC_MP_LINK || ''
export const mpQrImage: string = '/LigaStatsGame/donations/mp-qr.png'

// Suggested ARS amounts (used as labels; the MP link handles the actual amount).
export const mpAmounts: number[] = [1000, 2500, 5000]

export const stripeTiers: StripeTier[] = [
  { usd: 5, link: process.env.NEXT_PUBLIC_STRIPE_LINK_5 || '' },
  { usd: 10, link: process.env.NEXT_PUBLIC_STRIPE_LINK_10 || '' },
  { usd: 25, link: process.env.NEXT_PUBLIC_STRIPE_LINK_25 || '' },
]

export const mpConfigured = Boolean(mpLink || mpAlias)
export const stripeConfigured = stripeTiers.some((t) => Boolean(t.link))
