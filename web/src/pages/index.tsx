import { Button, Input } from '@ensdomains/thorin'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Head from 'next/head'
import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

import { Footer } from '@/components/Footer'
import { useDebounce } from '@/hooks/useDebounce'
import { useFetch } from '@/hooks/useFetch'
import { useIsMounted } from '@/hooks/useIsMounted'
import { Card, Form, Helper, Link, Spacer } from '@/styles'
import { WorkerRequest } from '@/types'

export default function App() {
  const { address } = useAccount()
  const isMounted = useIsMounted()

  const [name, setName] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState<string | undefined>(undefined)

  const regex = new RegExp('^[a-z0-9-]+$')
  const debouncedName = useDebounce(name, 500)
  const enabled = !!debouncedName && regex.test(debouncedName)

  const { data, isLoading, signMessage, variables } = useSignMessage()

  const requestBody: WorkerRequest = {
    name: `${debouncedName}.bico.eth`,
    records: {
      addresses: {
        60: address,
      },
      text: {
        description: description,
      },
    },
    signature: {
      hash: data,
      message: variables?.message,
    },
  }

  const {
    data: gatewayData,
    error: gatewayError,
    isLoading: gatewayIsLoading,
  } = useFetch(data && '/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const content = (
    <Card>
      <ConnectButton showBalance={false} />

      <Form
        onSubmit={(e) => {
          e.preventDefault()
          signMessage({
            message: `Register ${debouncedName}.bico.eth`,
          })
        }}
      >
        <Input
          type="text"
          label="Name"
          suffix=".bico.eth"
          placeholder="ens"
          required
          disabled={!!data || !address}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          type="text"
          label="Description"
          placeholder="Your portable web3 profile"
          disabled={!!data || !address}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Button
          type="submit"
          disabled={!enabled || !!data}
          loading={isLoading || gatewayIsLoading}
        >
          Register
        </Button>
      </Form>

      {gatewayError ? (
        <Helper type="error">
          {gatewayError.message === 'Conflict'
            ? 'Somebody already registered that name'
            : 'Something went wrong'}
        </Helper>
      ) : gatewayData ? (
        <Helper>
          <p>
            Visit the{' '}
            <Link href={`https://ens.app/${debouncedName}.bico.eth`}>
              ENS Manager
            </Link>{' '}
            to see your name. It will stop working in 24 hours.
          </p>
        </Helper>
      ) : !!debouncedName && !enabled ? (
        <Helper type="error">Name must be lowercase alphanumeric</Helper>
      ) : null}
    </Card>
  )

  return (
    <>
      <Head>
        <title>Offchain ENS Registrar</title>
        <meta property="og:title" content="Offchain ENS Registrar" />
        <meta
          name="description"
          content="Quick demo of how offchain ENS names work"
        />
        <meta
          property="og:description"
          content="Quick demo of how offchain ENS names work"
        />
      </Head>

      {isMounted && (
        <>
          <Spacer />
          {content}
          <Footer />
        </>
      )}
    </>
  )
}
