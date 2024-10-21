"use client"

import Member from "./member";
import Host from "./host";
import Attendee from "./attendee";
import {useState} from "react";
import Link from "next/link";

type ShowResources = "link" | "member" | "host" | "attendee";

export default function Page() {
  const [showResources, setShowResources] = useState<ShowResources>("link");

  switch (showResources) {
    case "link":
      return <>
        <div>
          <Link href="" onClick={() => {
            setShowResources("member")
          }}>Member page</Link>
        </div>
        <div>
          <Link href="" onClick={() => {
            setShowResources("host")
          }}>Host page</Link>
        </div>
        <div>
          <Link href="" onClick={() => {
            setShowResources("attendee")
          }}>Attendee page</Link>
        </div>
      </>
    case "member":
      return <Member/>
    case "host":
      return <Host/>
    case "attendee":
      return <Attendee/>
    default:
      return <></>
  }
}