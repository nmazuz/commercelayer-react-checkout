import "../styles/globals.css"
import type { AppProps } from "next/app"
import { AppContextType } from "next/dist/next-server/lib/utils"

function CheckoutApp(props: AppProps) {
  const { Component, pageProps } = props
  return <Component {...pageProps} />
}

CheckoutApp.getInitialProps = async (appContext: AppContextType) => {
  const res = await fetch("http://localhost:3000/api/settings", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(appContext.ctx.query),
  })
  const data = await res.json()

  if (!data.validCheckout && appContext.ctx.res) {
    return { redirectTo: "/invalid" }
  }

  return {
    pageProps: { ...data }, // will be passed to the page component as props
  }
}

export default CheckoutApp