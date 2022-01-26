import {
  connectLedger,
  ledgerReset,
} from "@tallyho/tally-background/redux-slices/ledger"
import { AsyncThunkFulfillmentType } from "@tallyho/tally-background/redux-slices/utils"
import React, { ReactElement, useEffect, useState } from "react"
import LedgerPanelContainer from "../../components/Ledger/LedgerPanelContainer"
import TabContainer from "../../components/Tab/TabContainer"
import { useBackgroundDispatch, useBackgroundSelector } from "../../hooks"
import LedgerConnectPopup from "./LedgerConnectPopup"
import LedgerImportDone from "./LedgerImportDone"
import LedgerImportAccounts from "./LedgerImportAccounts"
import LedgerPrepare from "./LedgerPrepare"

export default function Ledger(): ReactElement {
  const [phase, setPhase] = useState<
    "0-prepare" | "1-request" | "2-connect" | "3-done"
  >("0-prepare")
  const [deviceID, setDeviceID] = useState<string | null>(null)

  const devices = useBackgroundSelector((state) => state.ledger.devices)
  const device = deviceID === null ? null : devices[deviceID] ?? null

  const dispatch = useBackgroundDispatch()
  useEffect(() => {
    dispatch(ledgerReset())
  }, [dispatch])

  return (
    <TabContainer>
      {phase === "0-prepare" && (
        <LedgerPrepare
          onContinue={async () => {
            setPhase("1-request")
            try {
              // Open popup for testing
              // TODO: add correct filters
              // TODO: use result (for multiple devices)?
              await navigator.usb.requestDevice({ filters: [] })
            } catch {
              // Ignore
            }
            setPhase("2-connect")

            const { deviceID: newDeviceID } = (await dispatch(
              connectLedger()
            )) as unknown as AsyncThunkFulfillmentType<typeof connectLedger>

            /* Allow some time to react to clicks before changing the UI. */
            setTimeout(() => {
              setDeviceID(newDeviceID)
            }, 100)
          }}
        />
      )}
      {phase === "1-request" && <LedgerConnectPopup />}
      {phase === "2-connect" && !device && (
        <LedgerPanelContainer
          indicatorImageSrc="/images/connect_ledger_indicator_disconnected.svg"
          heading="Connecting..."
        />
      )}
      {phase === "2-connect" && device && (
        <LedgerImportAccounts
          device={device}
          onConnect={() => {
            setPhase("3-done")
          }}
        />
      )}
      {phase === "3-done" && (
        <LedgerImportDone
          onClose={() => {
            setPhase("0-prepare")
            setDeviceID(null)
            dispatch(ledgerReset())
          }}
        />
      )}
    </TabContainer>
  )
}
