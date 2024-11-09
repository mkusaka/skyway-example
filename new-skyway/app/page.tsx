"use client"

import Host from "./host";
import {useState} from "react";
import Link from "next/link";
import Guest from "./guest";

type ShowResources = "link" | "host" | "guest";

export default function Page() {
  const [showResources, setShowResources] = useState<ShowResources>("link");

  switch (showResources) {
    case "link":
      return <>
        <div>
          <Link href="" onClick={() => {
            setShowResources("host")
          }}>Host page</Link>
        </div>
        <div>
          <Link href="" onClick={() => {
            setShowResources("guest")
          }}>Guest page</Link>
        </div>
      </>
    case "host":
      return <Host/>
    case "guest":
      return <Guest/>
    default:
      return <></>
  }
}